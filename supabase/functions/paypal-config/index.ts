import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const mode = Deno.env.get("PAYPAL_MODE") || "sandbox";

    console.log("[PayPal Config] Request received");
    console.log("[PayPal Config] Mode:", mode);
    console.log("[PayPal Config] Client ID present:", !!clientId);

    if (!clientId) {
      console.error("[PayPal Config] ERROR: PAYPAL_CLIENT_ID not configured in secrets");
      return new Response(
        JSON.stringify({ error: "PayPal not configured - missing client ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (clientId.length < 20) {
      console.error("[PayPal Config] ERROR: PAYPAL_CLIENT_ID appears invalid (too short)");
      return new Response(
        JSON.stringify({ error: "PayPal configuration invalid" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[PayPal Config] SUCCESS: Returning ${mode} mode configuration`);
    return new Response(
      JSON.stringify({ clientId, mode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[PayPal Config] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
