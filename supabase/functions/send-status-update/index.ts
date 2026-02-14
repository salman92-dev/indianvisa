import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  under_review: "Under Review",
  submitted_to_gov: "Submitted to Government",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Your visa application is pending review by our team.",
  under_review: "Great news! Your visa application is currently being reviewed by our team.",
  submitted_to_gov: "Excellent! Your visa application has been submitted to the Indian government authorities for processing.",
  approved: "Congratulations! Your Indian visa has been approved! You will receive your e-Visa document shortly.",
  rejected: "Unfortunately, your visa application has been rejected. Please contact our support team for assistance.",
};

interface StatusUpdateRequest {
  travelerName: string;
  email: string;
  newStatus: string;
  bookingId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { travelerName, email, newStatus, bookingId }: StatusUpdateRequest = await req.json();

    if (!email || !newStatus || !travelerName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const statusMessage = STATUS_MESSAGES[newStatus] || "Your application status has been updated.";

    const emailHtml = `
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
          <h2 style="color: #1a1a1a; margin-top: 0;">Application Status Update</h2>
          
          <p>Dear ${travelerName},</p>
          
          <p>${statusMessage}</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-size: 14px; color: #666;">Current Status:</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">${statusLabel}</p>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Booking Reference: <strong>${bookingId.slice(0, 8).toUpperCase()}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.visa4less.com/dashboard" 
             style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Your Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
          <p>Need assistance? Contact us at <a href="mailto:cs@visa4less.com" style="color: #dc2626;">cs@visa4less.com</a></p>
          <p>© ${new Date().getFullYear()} Visa4Less. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Visa4Less <cs@visa4less.com>",
        to: [email],
        subject: `Visa Application Update: ${statusLabel} - Visa4Less`,
        html: emailHtml,
      }),
    });

    const result = await emailResponse.json();
    console.log("Status update email sent:", result);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending status update email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
