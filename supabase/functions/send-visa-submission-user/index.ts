import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SENDER_EMAIL = "Visa4Less <cs@visa4less.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { applicationId } = await req.json();

    if (!applicationId) {
      throw new Error("Application ID is required");
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch application details
    const { data: app, error: appError } = await supabaseAdmin
      .from("visa_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      throw new Error("Application not found");
    }

    // Validate ownership
    if (app.user_id !== user.id) {
      console.error("User does not own this application");
      return new Response(
        JSON.stringify({ error: "Unauthorized - you do not own this application" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const submittedAt = new Date(app.submitted_at || new Date()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // ==================== USER CONFIRMATION EMAIL ====================
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
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Application Submitted Successfully!</p>
              <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; margin-top: 16px;">
                ✓ Received
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${app.full_name},
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                Great news! Your Indian e-Visa application has been successfully submitted. Our team of experts will now review your application and process it for you.
              </p>
              
              <!-- Application Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; color: #374151;">Application Summary</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Application ID:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-family: monospace; font-size: 12px;">${app.id}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Visa Type:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${app.visa_type === 'tourist' ? 'Tourist e-Visa' : app.visa_type}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Duration:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${app.duration_of_stay}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Expected Arrival:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${app.intended_arrival_date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Submitted On:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${submittedAt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Processing Time -->
              <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h4 style="color: #166534; margin: 0 0 8px 0;">⏱️ Expected Processing Time</h4>
                <p style="color: #166534; margin: 0; font-size: 18px; font-weight: bold;">2-3 Business Days</p>
              </div>
              
              <!-- What Happens Next -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h4 style="color: #92400e; margin: 0 0 12px 0;">📋 What Happens Next?</h4>
                <ol style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Our experts will review your application for accuracy</li>
                  <li>We'll submit your application to the Indian government</li>
                  <li>You'll receive your e-Visa via email once approved</li>
                  <li>Print your e-Visa and carry it while traveling!</li>
                </ol>
              </div>
              
              <!-- Track Application -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://www.visa4less.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Track Your Application →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Support -->
              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px;">
                <p style="color: #374151; margin: 0 0 8px 0; font-weight: 600;">Need Help?</p>
                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                  If you have any questions about your application, our support team is here to help. Contact us at <a href="mailto:cs@visa4less.com" style="color: #dc2626; text-decoration: none;">cs@visa4less.com</a> or call <a href="tel:+971527288475" style="color: #dc2626; text-decoration: none;">+971 52 728 8475</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">Thank you for choosing Visa4Less!</p>
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

    await resend.emails.send({
      from: SENDER_EMAIL,
      to: [app.email],
      subject: "Visa Application Submitted Successfully – Visa4Less",
      html: emailHtml,
    });

    console.log("User confirmation sent for application:", applicationId, "to:", app.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending user confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
