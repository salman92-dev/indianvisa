import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const WebhookEventSchema = z.object({
  event_type: z.string(),
  resource: z.any(),
}).passthrough();

async function verifyWebhookSignature(req: Request): Promise<boolean> {
  const transmissionId = req.headers.get("PAYPAL-TRANSMISSION-ID");
  const transmissionTime = req.headers.get("PAYPAL-TRANSMISSION-TIME");
  const transmissionSig = req.headers.get("PAYPAL-TRANSMISSION-SIG");
  const certUrl = req.headers.get("PAYPAL-CERT-URL");
  const authAlgo = req.headers.get("PAYPAL-AUTH-ALGO");
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo || !webhookId) {
    console.error("Missing webhook verification headers");
    return false;
  }

  const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const paypalSecret = Deno.env.get("PAYPAL_SECRET");
  const paypalMode = Deno.env.get("PAYPAL_MODE") || "sandbox";
  const paypalBaseUrl = paypalMode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  try {
    // Get access token
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
      console.error("Failed to get PayPal access token for webhook verification");
      return false;
    }

    const { access_token } = await tokenResponse.json();

    // Verify webhook signature
    const webhookBody = await req.text();
    const verifyResponse = await fetch(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(webhookBody),
      }),
    });

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

serve(async (req) => {
  try {
    // Clone request for signature verification
    const clonedReq = req.clone();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(clonedReq);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const rawEvent = await req.json();
    const webhookEvent = WebhookEventSchema.parse(rawEvent);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (webhookEvent.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        const orderId = webhookEvent.resource.id;
        console.log("CHECKOUT.ORDER.APPROVED received for order:", orderId);

        await supabaseClient
          .from("payments")
          .update({ status: "pending" })
          .eq("paypal_order_id", orderId);

        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        const captureId = webhookEvent.resource.id;
        const orderId = webhookEvent.resource.supplementary_data?.related_ids?.order_id;

        console.log("PAYMENT.CAPTURE.COMPLETED received - captureId:", captureId, "orderId:", orderId);

        if (orderId) {
          // DECOUPLED: Only update payment status, do NOT touch application status
          const { data: payment, error: paymentError } = await supabaseClient
            .from("payments")
            .update({
              paypal_capture_id: captureId,
              status: "completed",
              captured_at: new Date().toISOString(),
            })
            .eq("paypal_order_id", orderId)
            .select()
            .single();

          if (paymentError) {
            console.error("Error updating payment:", paymentError);
          } else {
            console.log("Payment marked as completed:", payment?.id);
          }

          // Send thank you email to user
          if (payment?.id) {
            try {
              await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-thank-you-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                },
                body: JSON.stringify({ paymentId: payment.id }),
              });
              console.log("Thank you email triggered for payment:", payment.id);
            } catch (emailError) {
              console.error("Failed to trigger thank you email:", emailError);
            }

            // MANDATORY: Send admin payment notification to cs@visa4less.com
            try {
              await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-payment-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                },
                body: JSON.stringify({ paymentId: payment.id }),
              });
              console.log("Admin payment notification sent to cs@visa4less.com for payment:", payment.id);
            } catch (adminEmailError) {
              console.error("Failed to trigger admin notification:", adminEmailError);
            }
          }

          // NOTE: Application submission is now a SEPARATE workflow
          // Users must explicitly submit their application after payment
          // This decouples payment from application workflow
        }
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED": {
        const refundId = webhookEvent.resource.id;
        const captureId = webhookEvent.resource.links?.find(
          (link: any) => link.rel === "up"
        )?.href?.split("/").pop();

        console.log("PAYMENT.CAPTURE.REFUNDED received - refundId:", refundId, "captureId:", captureId);

        if (captureId) {
          await supabaseClient
            .from("payments")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
            })
            .eq("paypal_capture_id", captureId);
        }
        break;
      }

      default:
        console.log("Unhandled webhook event type:", webhookEvent.event_type);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Processing failed" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
