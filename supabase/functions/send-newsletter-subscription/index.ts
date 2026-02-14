import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "cs@visa4less.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email: string;
  name?: string;
}

// HTML escape function to prevent XSS
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: NewsletterRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format and length
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      console.log("[Newsletter] Invalid email format:", trimmedEmail.substring(0, 50));
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize name input
    const rawName = name || "Subscriber";
    const sanitizedName = escapeHtml(rawName.trim().substring(0, 100));
    const subscriberName = sanitizedName || "Subscriber";

    // Send welcome email to subscriber
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Visa4Less</h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">A subsidiary of Fly4Less® LLC OPC</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Our Newsletter! 🎉</h2>
          
          <p>Dear ${subscriberName},</p>
          
          <p>Thank you for subscribing to the Visa4Less newsletter! You're now part of our community and will receive:</p>
          
          <ul style="color: #555;">
            <li>Latest visa updates and travel tips for India</li>
            <li>Special promotions and offers</li>
            <li>Important travel advisories</li>
            <li>Insider tips for a smooth visa application process</li>
          </ul>
          
          <p>Ready to start your India visa application?</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.visa4less.com/book-visa" 
               style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Apply for Visa Now
            </a>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
          <p>Need assistance? Contact us at <a href="mailto:cs@visa4less.com" style="color: #dc2626;">cs@visa4less.com</a></p>
          <p>© ${new Date().getFullYear()} Visa4Less. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Send admin notification
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin-top: 0;">New Newsletter Subscription</h2>
          
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Name:</strong> ${subscriberName}</p>
          <p><strong>Date/Time:</strong> ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}</p>
        </div>
        
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          This is an automated notification from Visa4Less.
        </p>
      </body>
      </html>
    `;

    // Send both emails using sanitized email
    const [userEmailResponse, adminEmailResponse] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Visa4Less <cs@visa4less.com>",
          to: [trimmedEmail],
          subject: "Welcome to Visa4Less Newsletter! 🇮🇳",
          html: userEmailHtml,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Visa4Less System <cs@visa4less.com>",
          to: [ADMIN_EMAIL],
          subject: "New Newsletter Subscription - Visa4Less",
          html: adminEmailHtml,
        }),
      }),
    ]);

    const userResult = await userEmailResponse.json();
    const adminResult = await adminEmailResponse.json();

    console.log("Newsletter emails sent:", { userResult, adminResult });

    return new Response(
      JSON.stringify({ success: true, userEmailId: userResult.id, adminEmailId: adminResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending newsletter emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
