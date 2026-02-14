import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ReceiptRequestSchema = z.object({
  paymentId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Generate receipt - Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Use anon key for auth verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Use service role for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    console.log("Generate receipt - Auth result:", user?.id, authError?.message);

    if (authError || !user) {
      console.error("Auth failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.json();
    const { paymentId } = ReceiptRequestSchema.parse(rawBody);

    // Fetch payment - admin client bypasses RLS but we verify user ownership
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "completed") {
      throw new Error("Receipt only available for completed payments");
    }

    // Generate HTML receipt
    const receiptHtml = generateReceiptHtml(payment);
    
    return new Response(
      JSON.stringify({ 
        html: receiptHtml,
        payment: {
          id: payment.id,
          transaction_id: payment.paypal_capture_id,
          amount: payment.total_amount,
          currency: payment.currency,
          service: payment.service_name,
          date: payment.captured_at,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateReceiptHtml(payment: any): string {
  const date = new Date(payment.captured_at).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - Visa4Less</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 40px; }
    .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 32px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.9; }
    .success-badge { display: inline-block; background: #22c55e; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; margin-top: 16px; }
    .content { padding: 32px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    .total-row { background: #f9fafb; margin: 24px -32px; padding: 20px 32px; }
    .total-row .detail-value { font-size: 24px; color: #2563eb; }
    .footer { text-align: center; padding: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .footer a { color: #2563eb; text-decoration: none; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Visa4Less</h1>
      <p>Payment Receipt</p>
      <div class="success-badge">✓ Payment Successful</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">${payment.paypal_capture_id || payment.paypal_order_id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">PayPal</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: #22c55e;">Completed</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="detail-row">
          <span class="detail-label">Service</span>
          <span class="detail-value">${payment.service_name}</span>
        </div>
        ${payment.country ? `
        <div class="detail-row">
          <span class="detail-label">Country</span>
          <span class="detail-value">${payment.country}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Payment Breakdown</div>
        <div class="detail-row">
          <span class="detail-label">Base Amount</span>
          <span class="detail-value">${payment.currency} ${parseFloat(payment.amount).toFixed(2)}</span>
        </div>
        ${payment.convenience_fee > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Convenience Fee</span>
          <span class="detail-value">${payment.currency} ${parseFloat(payment.convenience_fee).toFixed(2)}</span>
        </div>
        ` : ''}
        ${payment.tax_amount > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Tax</span>
          <span class="detail-value">${payment.currency} ${parseFloat(payment.tax_amount).toFixed(2)}</span>
        </div>
        ` : ''}
      </div>

      <div class="total-row">
        <div class="detail-row" style="border: none;">
          <span class="detail-label" style="font-size: 18px;">Total Paid</span>
          <span class="detail-value">${payment.currency} ${parseFloat(payment.total_amount).toFixed(2)}</span>
        </div>
      </div>

      ${payment.payer_email ? `
      <div class="section">
        <div class="section-title">Payer Information</div>
        <div class="detail-row">
          <span class="detail-label">Name</span>
          <span class="detail-value">${payment.payer_name || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${payment.payer_email}</span>
        </div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>Thank you for choosing Visa4Less</p>
      <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:support@visa4less.com">support@visa4less.com</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
