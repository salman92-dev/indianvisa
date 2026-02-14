import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "cs@visa4less.com";

interface ContactFormRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// HTML escape function to prevent XSS in email content
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new Error("Missing required fields");
    }

    // Validate input lengths to prevent abuse
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 5000) {
      throw new Error("Input exceeds maximum allowed length");
    }

    if (phone && phone.length > 20) {
      throw new Error("Phone number too long");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Sanitize all user inputs
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safePhone = phone ? escapeHtml(phone.trim()) : null;
    const safeSubject = escapeHtml(subject.trim());
    const safeMessage = escapeHtml(message.trim());

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Send email to admin with sanitized content
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
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Inquiry</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Name:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${safeName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;"><a href="mailto:${safeEmail}" style="color: #2563eb;">${safeEmail}</a></p>
                  </td>
                </tr>
                ${safePhone ? `
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Phone:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;"><a href="tel:${safePhone}" style="color: #2563eb;">${safePhone}</a></p>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Subject:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${safeSubject}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Message:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px; white-space: pre-wrap;">${safeMessage}</p>
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
                <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Reply to ${safeName}
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

    // Send admin notification
    const { error: adminError } = await resend.emails.send({
      from: "Visa4Less <noreply@visa4less.com>",
      to: [ADMIN_EMAIL],
      subject: `New Inquiry – Visa4Less Website: ${safeSubject}`,
      html: adminEmailHtml,
      reply_to: email, // Use original email for reply functionality
    });

    if (adminError) {
      console.error("Admin email error:", adminError);
      throw new Error("Failed to send admin notification");
    }

    // Send auto-reply to user with sanitized content
    const userEmailHtml = `
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
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">We've received your message</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${safeName},
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                Thank you for contacting Visa4Less. Our team will get back to you shortly.
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                We typically respond within 24 hours during business days.
              </p>
              
              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #374151; margin: 0 0 8px 0; font-weight: 600;">Your message:</p>
                <p style="color: #6b7280; margin: 0; font-style: italic;">"${safeMessage.substring(0, 200)}${safeMessage.length > 200 ? '...' : ''}"</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                The Visa4Less Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">Need urgent help? Contact us at:</p>
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

    const { error: userError } = await resend.emails.send({
      from: "Visa4Less <noreply@visa4less.com>",
      to: [email], // Use original email for sending
      subject: "We've received your message – Visa4Less",
      html: userEmailHtml,
    });

    if (userError) {
      console.error("User email error:", userError);
      // Don't throw, admin was notified
    }

    console.log("Contact form processed successfully for:", safeEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});