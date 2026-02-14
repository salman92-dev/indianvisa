import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendThankYouRequest {
  paymentId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client for auth verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { paymentId }: SendThankYouRequest = await req.json();

    if (!paymentId) {
      throw new Error("Missing paymentId");
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch payment with user and application details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*, visa_applications(full_name)")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // Validate ownership - user must own this payment
    if (payment.user_id !== user.id) {
      console.error("User does not own this payment");
      return new Response(
        JSON.stringify({ error: "Unauthorized - you do not own this payment" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email already sent
    if (payment.thank_you_email_sent) {
      console.log("Thank you email already sent for payment:", paymentId);
      return new Response(
        JSON.stringify({ success: true, message: "Email already sent" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const userName = payment.payer_name || payment.visa_applications?.full_name || "Customer";
    const userEmail = payment.payer_email;

    if (!userEmail) {
      throw new Error("No email address found for payment");
    }

    const paymentDate = new Date(payment.captured_at || payment.created_at).toLocaleDateString('en-US', {
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Visa4Less</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Thank You for Your Payment!</p>
              <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; margin-top: 16px;">
                ✓ Payment Confirmed
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${userName},
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                Thank you for your payment! We've received your payment successfully and your transaction has been completed.
              </p>
              
              <!-- Payment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Transaction ID:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${payment.paypal_capture_id || payment.paypal_order_id}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Date & Time:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${paymentDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Service:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${payment.service_name}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- BIG CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://www.visa4less.com/apply-visa?id=${payment.application_id || ''}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px 48px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Click Here to Complete Your Visa Application
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">📋 Next Steps</h3>
                <ol style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Click the button above to complete your visa application form</li>
                  <li>Upload your passport photo and passport scan</li>
                  <li>Submit your application for processing</li>
                  <li>We'll handle the rest and keep you updated!</li>
                </ol>
              </div>
              
              <!-- Support -->
              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #374151; margin: 0 0 8px 0; font-weight: 600;">Need Help?</p>
                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                  If you have any questions or need assistance, please don't hesitate to reach out to our support team at <a href="mailto:cs@visa4less.com" style="color: #dc2626; text-decoration: none;">cs@visa4less.com</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">Thank you for choosing Visa4Less</p>
              <p style="margin: 0;">
                📧 <a href="mailto:cs@visa4less.com" style="color: #dc2626; text-decoration: none;">cs@visa4less.com</a> | 
                📞 <a href="tel:+971527288475" style="color: #dc2626; text-decoration: none;">+971 52 728 8475</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send email
    // Use Resend's verified sender for reliable delivery
    // Once visa4less.com is verified in Resend, change back to: "Visa4Less <cs@visa4less.com>"
    const { error: emailError } = await resend.emails.send({
      from: "Visa4Less <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Thank you for your payment – Next step for your Indian e-Visa",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw new Error("Failed to send email");
    }

    // Mark email as sent
    await supabaseAdmin
      .from("payments")
      .update({ thank_you_email_sent: true })
      .eq("id", paymentId);

    console.log("Thank you email sent to:", userEmail, "by user:", user.id);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending thank you email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
