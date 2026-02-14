import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CaptureOrderSchema = z.object({
  orderId: z.string().min(1).max(100),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Capture order - Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token from the header
    const token = authHeader.replace("Bearer ", "");
    
    // Use anon key for auth verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Use service role for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the user using the JWT token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    console.log("Capture order - Auth result:", user?.id, authError?.message);

    if (authError || !user) {
      console.error("Auth failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.json();
    const { orderId } = CaptureOrderSchema.parse(rawBody);

    // Check if order already captured (idempotency)
    const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (existingPaymentError) {
      console.warn("Failed to lookup existing payment (continuing):", existingPaymentError);
    }

    if (existingPayment && existingPayment.status === "completed") {
      console.log("Order already captured");
      return new Response(
        JSON.stringify({
          status: "completed",
          message: "Order already captured",
          payment: existingPayment,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get PayPal credentials
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");
    const paypalMode = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const paypalBaseUrl =
      paypalMode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    console.log("[PayPal Capture Order] Configuration:", {
      mode: paypalMode,
      baseUrl: paypalBaseUrl,
      hasClientId: !!paypalClientId,
      hasSecret: !!paypalSecret,
      orderId: orderId,
    });

    // Get access token
    const auth = btoa(`${paypalClientId}:${paypalSecret}`);
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to get PayPal access token");
    }

    const { access_token } = await tokenResponse.json();

    // Capture the order
    const captureResponse = await fetch(
      `${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error("PayPal capture failed:", errorData);
      
      // Extract detailed error information
      const errorName = errorData?.name || "PAYMENT_FAILED";
      const errorMessage = errorData?.message || "Failed to capture payment";
      const debugId = errorData?.debug_id;
      const details = errorData?.details?.[0]?.description;
      
      // Build user-friendly error message
      let userMessage = `Payment failed: ${errorName}`;
      if (details) {
        userMessage += ` - ${details}`;
      }
      if (debugId) {
        userMessage += ` (Debug ID: ${debugId})`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          paypalError: {
            name: errorName,
            message: errorMessage,
            debugId: debugId,
            details: details,
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const captureData = await captureResponse.json();
    console.log("PayPal order captured:", captureData);

    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    const payerEmail = captureData.payer?.email_address;
    const payerName = `${captureData.payer?.name?.given_name || ""} ${captureData.payer?.name?.surname || ""}`.trim();

    // Update payment record using admin client (bypasses RLS)
    const { data: payment, error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        paypal_capture_id: captureId,
        payer_email: payerEmail,
        payer_name: payerName,
        status: "completed",
        captured_at: new Date().toISOString(),
      })
      .eq("paypal_order_id", orderId)
      .select()
      .maybeSingle();

    if (updateError) {
      // Don't fail the whole capture if our internal record couldn't be updated.
      // This can happen if no matching payment row exists (e.g. foreign key issues).
      console.error("Failed to update payment:", updateError);
    }

    if (!payment) {
      console.warn("No matching payment row found for orderId", orderId);
    }

    // DON'T change application status here - let the user submit manually
    // This ensures the full form is completed and a proper snapshot is created
    // The visa-application-submit function handles proper submission with snapshot creation

    console.log("Payment completed successfully:", payment?.id || orderId);

    // Send thank-you email in background
    if (payerEmail) {
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        const userName = payerName || "Customer";
        const paymentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Visa4Less</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Thank You for Your Payment!</p>
              <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; margin-top: 16px;">
                ✓ Payment Confirmed
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Dear ${userName},</p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                Thank you for your payment! We've received your payment successfully and your transaction has been completed.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Transaction ID:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${captureId || orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Date & Time:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${paymentDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://www.visa4less.com/apply-visa" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px 48px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px;">
                      Complete Your Visa Application
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">📋 Next Steps</h3>
                <ol style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Click the button above to complete your visa application form</li>
                  <li>Upload your passport photo and passport scan</li>
                  <li>Submit your application for processing</li>
                </ol>
              </div>
              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px;">
                <p style="color: #374151; margin: 0 0 8px 0; font-weight: 600;">Need Help?</p>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  Contact us at <a href="mailto:cs@visa4less.com" style="color: #dc2626;">cs@visa4less.com</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">Thank you for choosing Visa4Less</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const { error: emailError } = await resend.emails.send({
          from: "Visa4Less <cs@visa4less.com>",
          to: [payerEmail],
          subject: "Payment Confirmed – Complete Your Indian e-Visa Application",
          html: emailHtml,
        });

        // Send admin payment notification
        if (payment?.id) {
          try {
            const adminResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-payment-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({ paymentId: payment.id }),
            });
            if (!adminResponse.ok) {
              console.error("Failed to send admin payment notification");
            } else {
              console.log("Admin payment notification triggered for:", payment.id);
            }
          } catch (adminErr) {
            console.error("Admin notification error:", adminErr);
          }
        }

        if (emailError) {
          console.error("Failed to send thank-you email:", emailError);
        } else {
          console.log("Thank-you email sent to:", payerEmail);
          // Mark email as sent if we have a payment record
          if (payment?.id) {
            await supabaseAdmin
              .from("payments")
              .update({ thank_you_email_sent: true })
              .eq("id", payment.id);
          }
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
        // Don't fail the payment capture due to email error
      }
    }

    return new Response(
      JSON.stringify({
        status: "completed",
        payment,
        captureId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error capturing order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
