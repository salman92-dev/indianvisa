import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email address required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Test email - Starting send to:", email);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("Test email - RESEND_API_KEY present:", !!resendApiKey);

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0;">Visa4Less</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Test Email</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px;">
                ✅ This is a test email from Visa4Less to verify Resend is working correctly.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                If you received this email, the email delivery system is functioning properly.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                Sent at: ${new Date().toISOString()}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error: emailError } = await resend.emails.send({
      from: "Visa4Less <noreply@visa4less.com>",
      to: [email],
      subject: "Test Email - Visa4Less Email System",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Test email - Send failed:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message, details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Test email - Send successful:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent successfully", data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Test email - Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
