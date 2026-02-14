import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "cs@visa4less.com";
// Use Resend's verified sender for reliable delivery
// Once visa4less.com is verified in Resend, change back to: "Visa4Less <cs@visa4less.com>"
const SENDER_EMAIL = "Visa4Less <onboarding@resend.dev>";

interface RegistrationEmailRequest {
  fullName: string;
  email: string;
  phone?: string;
  ipAddress?: string;
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

    const { fullName, email, phone, ipAddress }: RegistrationEmailRequest = await req.json();

    if (!fullName || !email) {
      throw new Error("Missing required fields");
    }

    // Validate that the email matches the authenticated user's email
    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      console.error("Email mismatch - user trying to send to different email");
      return new Response(
        JSON.stringify({ error: "Email address does not match authenticated user" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // ==================== ADMIN NOTIFICATION EMAIL ====================
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
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New User Registration</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                A new user has registered on Visa4Less:
              </p>
              
              <!-- Copy-Paste Format -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 14px; text-transform: uppercase;">User Details (Copy-Paste Format)</h3>
                <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; color: #111827; white-space: pre-wrap; word-break: break-all;">
Full Name: ${fullName}
Email: ${email}
Phone: ${phone || 'Not provided'}
Registration Date: ${timestamp}
User ID: ${user.id}
${ipAddress ? `IP Address: ${ipAddress}` : ''}
                </pre>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Full Name:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${fullName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
                  </td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Phone:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${phone}</p>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Registration Date/Time:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 16px;">${timestamp}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <strong style="color: #6b7280;">User ID:</strong>
                    <p style="margin: 8px 0 0 0; color: #111827; font-size: 14px; font-family: monospace;">${user.id}</p>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://www.visa4less.com/admin/users" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
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

    const { error: adminError } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🎉 New User Registration – ${fullName}`,
      html: adminEmailHtml,
    });

    if (adminError) {
      console.error("Admin email error:", adminError);
    } else {
      console.log("Admin registration notification sent for:", email);
    }

    // ==================== USER WELCOME EMAIL ====================
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
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Visa4Less!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your account has been created successfully</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${fullName},
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                Welcome to Visa4Less! Your account has been successfully created. You're now ready to apply for your Indian e-Visa with our expert assistance.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://www.visa4less.com/book-visa" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Start Your Visa Application →
                </a>
              </div>
              
              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #374151; margin: 0 0 8px 0; font-weight: 600;">📋 What's next?</p>
                <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Select your visa package (30 days / 1 year / 5 years)</li>
                  <li>Complete secure payment via PayPal</li>
                  <li>Fill in your visa application details</li>
                  <li>Upload your passport photo and passport scan</li>
                  <li>Submit and relax – we'll handle the rest!</li>
                </ul>
              </div>
              
              <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #166534; margin: 0; font-weight: 600;">✓ 99% Approval Success Rate</p>
                <p style="color: #166534; margin: 8px 0 0 0; font-size: 14px;">Our experts review every application to ensure accuracy before submission.</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, our support team is here to help!<br><br>
                Best regards,<br>
                The Visa4Less Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">Need help? Contact us:</p>
              <p style="margin: 0;">
                📧 <a href="mailto:cs@visa4less.com" style="color: #dc2626; text-decoration: none;">cs@visa4less.com</a> | 
                📞 <a href="tel:+971527288475" style="color: #dc2626; text-decoration: none;">+971 52 728 8475</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Visa4Less - A subsidiary of Fly4Less® LLC OPC
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
      from: SENDER_EMAIL,
      to: [email],
      subject: "Welcome to Visa4Less – Your Account is Ready!",
      html: userEmailHtml,
    });

    if (userError) {
      console.error("User email error:", userError);
    } else {
      console.log("User welcome email sent to:", email);
    }

    console.log("Registration emails completed for:", email, "by user:", user.id);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending registration emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
