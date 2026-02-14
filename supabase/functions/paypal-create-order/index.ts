import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CreateOrderSchema = z.object({
  visaType: z.enum(['tourist', 'business', 'medical', 'conference', 'student', 'other']),
  duration: z.string().min(1).max(50),
  countryCode: z.string().length(2).optional(),
  applicationId: z.string().uuid().optional(),
});

// Country to currency region mapping
const USA_COUNTRIES = ['US'];
const UK_COUNTRIES = ['GB'];
const EUROPE_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 
  'SI', 'ES', 'SE', 'NO', 'CH', 'IS'
];

type VisaDuration = '30_days' | '1_year' | '5_years' | '30 days' | '1 year' | '5 years';

// Pricing by visa duration and currency - supports both underscore and space formats
const VISA_PRICES: Record<string, Record<string, number>> = {
  '30_days': { USD: 49.90, GBP: 39.90, EUR: 39.90 },
  '30 days': { USD: 49.90, GBP: 39.90, EUR: 39.90 },
  '1_year': { USD: 75.00, GBP: 65.00, EUR: 65.00 },
  '1 year': { USD: 75.00, GBP: 65.00, EUR: 65.00 },
  '5_years': { USD: 125.00, GBP: 115.00, EUR: 115.00 },
  '5 years': { USD: 125.00, GBP: 115.00, EUR: 115.00 },
};

function getCurrencyByCountry(countryCode: string): string {
  const code = countryCode.toUpperCase();
  
  // Handle regional selections
  if (code === 'US' || USA_COUNTRIES.includes(code)) return 'USD';
  if (code === 'GB' || UK_COUNTRIES.includes(code)) return 'GBP';
  if (code === 'EU' || EUROPE_COUNTRIES.includes(code)) return 'EUR';
  
  // Rest of World (ROW) or any other code - default to USD
  return 'USD';
}

function getVisaPrice(duration: string, currency: string): number {
  const prices = VISA_PRICES[duration];
  if (!prices) {
    // Default to 30_days pricing if duration not found
    return VISA_PRICES['30_days'][currency] || VISA_PRICES['30_days'].USD;
  }
  return prices[currency] || prices.USD;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token from the header
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

    // Verify the user using the JWT token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    console.log("Auth result - user:", user?.id, "error:", authError?.message);

    if (authError || !user) {
      console.error("Auth failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.json();
    console.log("Raw request body:", JSON.stringify(rawBody));
    
    const { visaType, duration, countryCode, applicationId } = CreateOrderSchema.parse(rawBody);

    console.log("Creating order for:", { visaType, duration, countryCode, userId: user.id });
    
    // Determine currency based on country region - countryCode is the nationality (2-letter code)
    const currency = countryCode ? getCurrencyByCountry(countryCode) : 'USD';
    
    // Get price based on visa duration
    const baseAmount = getVisaPrice(duration, currency);
    
    console.log("Currency determined:", { countryCode, currency, duration, baseAmount });
    const convenienceFee = 0;
    const taxRate = 0;
    const taxAmount = 0;
    const totalAmount = baseAmount + convenienceFee + taxAmount;

    console.log("Pricing calculated:", { currency, baseAmount, totalAmount, duration });

    // Create PayPal order
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");
    const paypalMode = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const paypalBaseUrl =
      paypalMode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    console.log("[PayPal Create Order] Configuration:", {
      mode: paypalMode,
      baseUrl: paypalBaseUrl,
      hasClientId: !!paypalClientId,
      hasSecret: !!paypalSecret,
      clientIdLength: paypalClientId?.length,
    });

    // Get PayPal access token
    const auth = btoa(`${paypalClientId}:${paypalSecret}`);
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to get PayPal access token");
    }

    const { access_token } = await tokenResponse.json();

    // Create order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: applicationId || user.id,
          description: `India e-Tourist Visa - ${duration}`,
          amount: {
            currency_code: currency,
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: baseAmount.toFixed(2),
              },
              handling: {
                currency_code: currency,
                value: convenienceFee.toFixed(2),
              },
              tax_total: {
                currency_code: currency,
                value: taxAmount.toFixed(2),
              },
            },
          },
        },
      ],
    };

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error("PayPal order creation failed:", error);
      throw new Error("Failed to create PayPal order");
    }

    const order = await orderResponse.json();
    console.log("PayPal order created:", order.id);

    // Store payment record using admin client (bypasses RLS)
    // NOTE: BookVisa passes a bookingId as "applicationId". payments.application_id has a FK to visa_applications,
    // so we only store application_id if it actually exists to avoid FK failures.
    let resolvedApplicationId: string | null = null;

    if (applicationId) {
      const { data: appRow, error: appLookupError } = await supabaseAdmin
        .from("visa_applications")
        .select("id")
        .eq("id", applicationId)
        .maybeSingle();

      if (appLookupError) {
        console.error("Failed to verify application_id:", appLookupError);
      } else if (appRow?.id) {
        resolvedApplicationId = appRow.id;
      } else {
        console.warn(
          "applicationId not found in visa_applications; storing payment with null application_id",
          { applicationId }
        );
      }
    }

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      application_id: resolvedApplicationId,
      paypal_order_id: order.id,
      service_name: `India e-Tourist Visa - ${duration}`,
      visa_duration: duration,
      country: countryCode,
      amount: baseAmount,
      currency: currency,
      convenience_fee: convenienceFee,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: "pending",
    });

    if (paymentError) {
      console.error("Failed to store payment record:", paymentError);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: totalAmount,
        currency: currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
