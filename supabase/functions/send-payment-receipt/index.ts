import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendReceiptRequest {
  paymentId: string;
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { paymentId, email }: SendReceiptRequest = await req.json();

    if (!paymentId || !email) {
      throw new Error("Missing paymentId or email");
    }

    // Fetch payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // Verify ownership - user must own this payment
    if (payment.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You can only send receipts for your own payments" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const date = new Date(payment.captured_at || payment.created_at).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
            <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Visa4Less</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Payment Receipt</p>
              <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; margin-top: 16px;">
                ✓ Payment Successful
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                Dear ${payment.payer_name || 'Customer'},
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                Thank you for your payment. Here are your transaction details:
              </p>
              
              <!-- Transaction Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Transaction ID</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${payment.paypal_capture_id || payment.paypal_order_id}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${payment.service_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment Method</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">PayPal</td>
                </tr>
              </table>
              
              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; color: #6b7280; font-size: 18px;">Total Paid</td>
                  <td style="padding: 20px; text-align: right; font-weight: 700; font-size: 24px; color: #2563eb;">${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)}</td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="https://visa4less.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">Thank you for choosing Visa4Less</p>
              <p style="margin: 0;">Questions? Contact us at <a href="mailto:support@visa4less.com" style="color: #2563eb; text-decoration: none;">support@visa4less.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const { error: emailError } = await resend.emails.send({
      from: "Visa4Less <cs@visa4less.com>",
      to: [email],
      subject: `Payment Receipt - ${payment.service_name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw new Error("Failed to send email");
    }

    console.log("Receipt email sent to:", email);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
