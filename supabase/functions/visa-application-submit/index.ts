import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitRequestBody {
  applicationId: string;
}

// Common variations of "India" that might be used
const INDIA_IDENTIFIERS = [
  'india',
  'in',
  'ind',
  'indian',
  'republic of india',
  'bharat',
];

/**
 * Checks if a value represents India
 */
function isIndianValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return INDIA_IDENTIFIERS.some(id => normalized === id || normalized.includes('india'));
}

interface ApplicantData {
  nationality?: string;
  nationality_by_birth?: boolean;
  passport_place_of_issue?: string;
  country_of_birth?: string;
}

/**
 * Validates if an applicant is eligible to apply for an Indian visa.
 * 
 * Block submission if ALL of the following are true:
 * - Applicant nationality = India
 * - Applicant nationality by birth = India (true with Indian nationality)
 * - Applicant passport issuing country = India
 * 
 * Allow submission when:
 * - Applicant nationality is NOT India, OR
 * - Applicant holds a non-Indian passport (foreign passport), OR
 * - Applicant is a former Indian citizen (foreign passport)
 */
function validateApplicantEligibility(data: ApplicantData): { eligible: boolean; error?: string } {
  const nationalityIsIndia = isIndianValue(data.nationality);
  const passportIssuedInIndia = isIndianValue(data.passport_place_of_issue);
  
  // nationality_by_birth is a boolean in our schema
  // If true and nationality is India, consider it as Indian by birth
  const nationalityByBirthIsIndia = data.nationality_by_birth === true && nationalityIsIndia;

  // Block if ALL conditions are met:
  // 1. Nationality is India
  // 2. Nationality by birth indicates Indian origin (or defaulted to true with Indian nationality)
  // 3. Passport was issued in India
  const isIndianCitizen = 
    nationalityIsIndia && 
    (nationalityByBirthIsIndia || data.nationality_by_birth !== false) && 
    passportIssuedInIndia;

  if (isIndianCitizen) {
    return {
      eligible: false,
      error: "Indian citizens are not eligible to apply for an Indian visa. Please select the correct service.",
    };
  }

  return { eligible: true };
}

serve(async (req) => {
  console.log("visa-application-submit: Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      console.log("visa-application-submit: Missing Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized: missing access token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId }: SubmitRequestBody = await req.json();
    if (!applicationId) {
      return new Response(JSON.stringify({ error: "Missing applicationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      console.log("visa-application-submit: Auth failed", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("visa-application-submit: User verified", user.id);

    // Fetch the FULL application data for snapshot
    const { data: app, error: appError } = await supabaseAdmin
      .from("visa_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) {
      console.error("visa-application-submit: Fetch application error", appError);
      return new Response(JSON.stringify({ error: appError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (app.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (app.status !== "draft") {
      return new Response(JSON.stringify({ error: `Cannot submit application in status: ${app.status}` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (app.is_locked) {
      return new Response(JSON.stringify({ error: "Application is locked and cannot be modified" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Business rule validation: Check applicant eligibility
    const eligibility = validateApplicantEligibility({
      nationality: app.nationality,
      nationality_by_birth: app.nationality_by_birth,
      passport_place_of_issue: app.passport_place_of_issue,
      country_of_birth: app.country_of_birth,
    });

    if (!eligibility.eligible) {
      console.log("visa-application-submit: Applicant ineligible - Indian citizen", {
        nationality: app.nationality,
        passport_place_of_issue: app.passport_place_of_issue,
      });
      return new Response(JSON.stringify({ 
        error: eligibility.error,
        code: "INDIAN_CITIZEN_INELIGIBLE",
      }), {
        status: 422, // Unprocessable Entity - business rule violation
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all documents for this application
    const { data: documents, error: docsError } = await supabaseAdmin
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId);

    if (docsError) {
      console.error("visa-application-submit: Fetch documents error", docsError);
    }

    // Generate signed URLs for documents (valid for 30 days)
    const documentUrls: { type: string; name: string; url: string }[] = [];
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from("visa-documents")
          .createSignedUrl(doc.file_path, 60 * 60 * 24 * 30); // 30 days

        if (signedUrlData?.signedUrl) {
          documentUrls.push({
            type: doc.document_type,
            name: doc.file_name,
            url: signedUrlData.signedUrl,
          });
        }
      }
    }

    // Find linked payment (if any)
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("application_id", applicationId)
      .eq("status", "completed")
      .maybeSingle();

    const submittedAt = new Date().toISOString();

    // Create immutable snapshot of the application
    const { error: snapshotError } = await supabaseAdmin
      .from("application_snapshots")
      .upsert({
        application_id: applicationId,
        payment_id: payment?.id || null,
        snapshot_data: app,
        document_urls: documentUrls,
        submitted_at: submittedAt,
        submitted_by: user.id,
      }, {
        onConflict: "application_id",
      });

    if (snapshotError) {
      console.error("visa-application-submit: Snapshot creation error", snapshotError);
      // Continue anyway - snapshot is for audit, not blocking
    } else {
      console.log("visa-application-submit: Snapshot created for application", applicationId);
    }

    // Update application status and lock it permanently
    const { error: updateError } = await supabaseAdmin
      .from("visa_applications")
      .update({
        status: "submitted",
        submitted_at: submittedAt,
        is_locked: true, // Lock form permanently
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("visa-application-submit: Update error", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("visa-application-submit: Application submitted and locked", applicationId);

    // Send application submission emails
    try {
      // Send to user
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-visa-submission-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ applicationId }),
      });
      console.log("visa-application-submit: User email triggered");
    } catch (emailError) {
      console.error("Failed to send user submission email:", emailError);
    }

    try {
      // Send to admin with FULL form data + file links
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-visa-submission-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ 
          applicationId,
          snapshotData: app,
          documentUrls,
        }),
      });
      console.log("visa-application-submit: Admin email triggered with full form data");
    } catch (emailError) {
      console.error("Failed to send admin submission email:", emailError);
    }

    // Note: External confirmation removed - user and admin emails already sent above

    return new Response(JSON.stringify({
      success: true, 
      applicationId,
      snapshotCreated: !snapshotError,
      locked: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("visa-application-submit: Unhandled error", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
