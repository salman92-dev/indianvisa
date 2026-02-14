import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "cs@visa4less.com";
const SENDER_EMAIL = "Visa4Less <cs@visa4less.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
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
    // Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create auth client to verify the user
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
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
      .select("*, arrival_points(name, code, city)")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      throw new Error("Application not found");
    }

    // Verify ownership
    if (app.user_id !== user.id) {
      console.error("User attempting to send notification for application they don't own");
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch uploaded documents
    const { data: docs } = await supabaseAdmin
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId);

    // Generate signed URLs for document downloads
    const documentLinks: string[] = [];
    if (docs && docs.length > 0) {
      for (const doc of docs) {
        const { data: signedUrl } = await supabaseAdmin
          .storage
          .from("visa-documents")
          .createSignedUrl(doc.file_path, 60 * 60 * 24 * 7); // 7 days expiry
        
        if (signedUrl?.signedUrl) {
          documentLinks.push(`${doc.document_type}: ${signedUrl.signedUrl}`);
        }
      }
    }

    const submittedAt = new Date(app.submitted_at || new Date()).toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // ==================== ADMIN APPLICATION NOTIFICATION EMAIL ====================
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
        <table width="700" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Visa Application Submitted</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${escapeHtml(app.full_name)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              
              <!-- Copy-Paste Format -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 14px; text-transform: uppercase;">Application Details (Copy-Paste Format)</h3>
                <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #111827; white-space: pre-wrap; word-break: break-all; line-height: 1.6;">
=== VISA APPLICATION ===
Application ID: ${app.id}
Submitted At: ${submittedAt}
User ID: ${app.user_id}

=== APPLICANT DETAILS ===
Surname (exactly as in passport): ${app.surname || 'N/A'}
Given Name(s) (exactly as in passport): ${app.given_name || 'N/A'}
Full Name: ${app.full_name}
Date of Birth: ${app.date_of_birth}
Gender: ${app.gender}
Place of Birth: ${app.place_of_birth}
Country of Birth: ${app.country_of_birth}
Nationality: ${app.nationality}
Religion: ${app.religion || 'N/A'}
Marital Status: ${app.marital_status || 'N/A'}
Education: ${app.educational_qualification || 'N/A'}
Visible Identification Marks (exactly as in passport, if any): ${app.visible_identification_marks || 'N/A'}

=== PASSPORT DETAILS ===
Passport Number: ${app.passport_number}
Place of Issue: ${app.passport_place_of_issue || 'N/A'}
Issue Date: ${app.passport_issue_date}
Expiry Date: ${app.passport_expiry_date}
Other Passport: ${app.other_passport_held ? 'Yes' : 'No'}
${app.other_passport_held ? `Other Passport Country: ${app.other_passport_country || 'N/A'}
Other Passport Number: ${app.other_passport_number || 'N/A'}` : ''}

=== CONTACT INFORMATION ===
Email: ${app.email}
Phone: ${app.mobile_isd} ${app.mobile_number}
Present Address: ${app.present_address_house_street || ''} ${app.present_address_village_town || ''} ${app.present_address_state || ''} ${app.present_address_postal_code || ''} ${app.present_address_country || ''}

=== VISA DETAILS ===
Visa Type: ${app.visa_type}
Duration: ${app.duration_of_stay}
Arrival Date: ${app.intended_arrival_date}
Arrival Point: ${app.arrival_points?.name || 'N/A'}
Purpose: ${app.purpose_of_visit || 'Tourism'}
Places to Visit: ${app.places_to_visit_1 || 'N/A'}${app.places_to_visit_2 ? ', ' + app.places_to_visit_2 : ''}

=== FAMILY DETAILS ===
Father's Name: ${app.father_name || 'N/A'}
Father's Nationality: ${app.father_nationality || 'N/A'}
Mother's Name: ${app.mother_name || 'N/A'}
Mother's Nationality: ${app.mother_nationality || 'N/A'}
${app.marital_status === 'Married' ? `Spouse's Name: ${app.spouse_name || 'N/A'}
Spouse's Nationality: ${app.spouse_nationality || 'N/A'}` : ''}

=== REFERENCES ===
India Reference: ${app.reference_india_name || 'N/A'}
India Address: ${app.reference_india_address || 'N/A'}
India Phone: ${app.reference_india_phone || 'N/A'}
Home Reference: ${app.reference_home_name || 'N/A'}
Home Address: ${app.reference_home_address || 'N/A'}
Home Phone: ${app.reference_home_phone || 'N/A'}

=== PREVIOUS VISA ===
Visited India Before: ${app.visited_india_before ? 'Yes' : 'No'}
${app.visited_india_before ? `Previous Visa Number: ${app.previous_visa_number || 'N/A'}
Previous Visa Type: ${app.previous_visa_type || 'N/A'}` : ''}

=== SECURITY QUESTIONS ===
Visa Refused Before: ${app.visa_refused_before ? 'Yes' : 'No'}
Arrested/Convicted: ${app.security_arrested_convicted ? 'Yes' : 'No'}
Criminal Activities: ${app.security_criminal_activities ? 'Yes' : 'No'}
Terrorist Activities: ${app.security_terrorist_activities ? 'Yes' : 'No'}

=== DOCUMENTS ===
${docs && docs.length > 0 ? docs.map(d => `${d.document_type}: ${d.file_name}`).join('\n') : 'No documents uploaded'}

===========================
                </pre>
              </div>

              ${documentLinks.length > 0 ? `
              <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📎 Document Download Links (Valid for 7 days)</h3>
                ${documentLinks.map(link => {
                  const [type, url] = link.split(': ');
                  return `<p style="margin: 8px 0;"><strong>${type}:</strong> <a href="${url}" style="color: #0284c7; word-break: break-all;">${url}</a></p>`;
                }).join('')}
              </div>
              ` : ''}
              
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://www.visa4less.com/admin/applications" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
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

    await resend.emails.send({
      from: SENDER_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `📋 New Visa Application – ${escapeHtml(app.full_name)} (${app.visa_type})`,
      html: emailHtml,
    });

    console.log("Admin notification sent for application:", applicationId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
