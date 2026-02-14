import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  photo: ['image/jpeg', 'image/jpg'],
  passport: ['application/pdf', 'image/jpeg', 'image/jpg'],
  other: ['application/pdf', 'image/jpeg', 'image/jpg'],
};

const MAX_FILE_SIZES: Record<string, number> = {
  photo: 1024 * 1024, // 1MB
  passport: 2048 * 1024, // 2MB
  other: 2048 * 1024, // 2MB
};

const VALID_DOCUMENT_TYPES = ['photo', 'passport', 'other'];

serve(async (req) => {
  console.log('visa-document-upload: Request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate auth header
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      console.log('visa-document-upload: Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auth client to verify user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // Admin client for storage/db operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication using the provided token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.log('visa-document-upload: Auth failed', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('visa-document-upload: User verified', user.id);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('application_id') as string;
    const documentType = formData.get('document_type') as string;
    
    console.log('visa-document-upload: Parsing form data', { applicationId, documentType, fileName: file?.name, fileSize: file?.size });

    if (!file || !applicationId || !documentType) {
      console.log('visa-document-upload: Missing fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, application_id, document_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate document type
    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      console.log('visa-document-upload: Invalid document type', documentType);
      return new Response(
        JSON.stringify({ error: `Invalid document type: ${documentType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format for application_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      console.log('visa-document-upload: Invalid application ID format');
      return new Response(
        JSON.stringify({ error: 'Invalid application ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileSize = file.size;
    const mimeType = file.type;

    // Server-side validation: Check file size
    const maxSize = MAX_FILE_SIZES[documentType];
    if (fileSize > maxSize) {
      console.log('visa-document-upload: File too large', { fileSize, maxSize });
      return new Response(
        JSON.stringify({ error: `File size exceeds maximum ${maxSize / (1024 * 1024)}MB for ${documentType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side validation: Check mime type
    const allowedTypes = ALLOWED_MIME_TYPES[documentType];
    if (!allowedTypes.includes(mimeType)) {
      console.log('visa-document-upload: Invalid mime type', { mimeType, allowedTypes });
      return new Response(
        JSON.stringify({ error: `Invalid file type. Allowed types for ${documentType}: ${allowedTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the application belongs to the user
    const { data: application, error: appError } = await supabaseAdmin
      .from('visa_applications')
      .select('id, user_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.log('visa-document-upload: Application not found', appError?.message);
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (application.user_id !== user.id) {
      console.log('visa-document-upload: User mismatch', { appUserId: application.user_id, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to application' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure file path
    const fileExt = file.name.split('.').pop();
    const storagePath = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
    console.log('visa-document-upload: Uploading to path', storagePath);

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();

    // Upload to storage using admin client (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('visa-documents')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('visa-document-upload: Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('visa-document-upload: File uploaded successfully');

    // Delete existing document of same type if exists
    await supabaseAdmin
      .from('application_documents')
      .delete()
      .eq('application_id', applicationId)
      .eq('document_type', documentType);

    // Store document metadata
    const { data: docData, error: dbError } = await supabaseAdmin
      .from('application_documents')
      .insert([{
        application_id: applicationId,
        document_type: documentType,
        file_name: file.name,
        file_path: storagePath,
        file_size: fileSize,
        mime_type: mimeType,
      }])
      .select()
      .single();

    if (dbError) {
      console.error('visa-document-upload: Database error:', dbError);
      // Attempt to clean up uploaded file
      await supabaseAdmin.storage
        .from('visa-documents')
        .remove([storagePath]);
      
      return new Response(
        JSON.stringify({ error: 'Failed to save document metadata', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('visa-document-upload: Document metadata saved', docData);

    return new Response(
      JSON.stringify({ success: true, data: docData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in visa-document-upload:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
