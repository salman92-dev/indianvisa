import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "cs@visa4less.com";
// Use Resend's verified sender for reliable delivery
// Once visa4less.com is verified in Resend, change back to: "Visa4Less <cs@visa4less.com>"
const SENDER_EMAIL = "Visa4Less <onboarding@resend.dev>";

interface PaymentNotificationRequest {
  paymentId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { paymentId }: PaymentNotificationRequest = await req.json();

    if (!paymentId) {
      throw new Error("Missing paymentId");
    }

    console.log("Sending admin payment notification for payment:", paymentId);

    // Fetch payment details with user profile
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      throw new Error("Payment not found");
    }

    // Fetch user profile for additional details
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", payment.user_id)
      .single();

    const timestamp = new Date(payment.captured_at || payment.created_at).toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // ==================== ADMIN PAYMENT NOTIFICATION EMAIL ====================
    const adminEmailHtml = `
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
            <td style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 Payment Received!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 28px; font-weight: bold;">
                ${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <!-- Copy-Paste Format -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 14px; text-transform: uppercase;">Payment Details (Copy-Paste Format)</h3>
                <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; color: #111827; white-space: pre-wrap; word-break: break-all;">
=== PAYMENT CONFIRMATION ===
Transaction ID: ${payment.paypal_capture_id || payment.paypal_order_id}
PayPal Order ID: ${payment.paypal_order_id}

Customer Name: ${payment.payer_name || profile?.full_name || 'N/A'}
Customer Email: ${payment.payer_email || 'N/A'}
Customer Phone: ${profile?.phone || 'N/A'}
Country/Region: ${payment.country || profile?.country || 'N/A'}

Service: ${payment.service_name}
Visa Duration: ${payment.visa_duration || 'N/A'}
Amount: ${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)}

Date & Time: ${timestamp}
Payment Status: COMPLETED ✓
User ID: ${payment.user_id}
Payment ID: ${payment.id}
===========================
                </pre>
              </div>
              
              <div style="background: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; color: #166534; font-size: 18px; font-weight: bold;">
                  ✓ Payment Confirmed
                </p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Customer Name:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${payment.payer_name || profile?.full_name || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">
                      <a href="mailto:${payment.payer_email}" style="color: #2563eb;">${payment.payer_email || 'N/A'}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Phone:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${profile?.phone || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Country/Region:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${payment.country || profile?.country || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Service:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${payment.service_name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Visa Duration:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${payment.visa_duration || 'N/A'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Amount Paid:</strong>
                    <p style="margin: 8px 0 0 0; color: #22c55e; font-size: 20px; font-weight: bold;">${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">PayPal Transaction ID:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 14px; font-family: monospace;">${payment.paypal_capture_id || payment.paypal_order_id}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <strong style="color: #6b7280;">Date & Time:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${timestamp}</p>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://www.visa4less.com/admin/payments" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  View in Admin Dashboard
                </a>
              </div>
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
      from: SENDER_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `💰 Payment Received: ${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)} from ${payment.payer_name || 'Customer'}`,
      html: adminEmailHtml,
    });

    if (emailError) {
      console.error("Admin payment notification error:", emailError);
      throw new Error("Failed to send admin notification: " + emailError.message);
    }

    console.log("Admin payment notification sent successfully for payment:", paymentId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending admin payment notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
