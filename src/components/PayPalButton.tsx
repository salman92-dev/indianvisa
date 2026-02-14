import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayPalButtonProps {
  visaType: string;
  duration: string;
  countryCode?: string;
  applicationId?: string;
  currency?: string;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    paypal?: any;
    __paypalSdk?: {
      currency: string;
      promise: Promise<void>;
    };
  }
}

const PayPalButton = ({
  visaType,
  duration,
  countryCode,
  applicationId,
  currency = 'USD',
  onSuccess,
  onError,
}: PayPalButtonProps) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // Keep latest callbacks without forcing PayPal re-renders on parent state updates
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const scriptLoadedRef = useRef(false);
  const buttonsInstanceRef = useRef<any>(null);
  const scheduledTimeoutsRef = useRef<number[]>([]);

  const [retryCount, setRetryCount] = useState(0);
  const isDev = import.meta.env.DEV;

  // Function to check if on desktop at runtime
  const checkIsDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 768;

  const isEmbeddedPreview = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const openInNewTab = useCallback(() => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  }, []);

  const clearScheduled = useCallback(() => {
    scheduledTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    scheduledTimeoutsRef.current = [];
  }, []);

  const schedule = useCallback(
    (fn: () => void, delayMs: number) => {
      const id = window.setTimeout(fn, delayMs);
      scheduledTimeoutsRef.current.push(id);
      return id;
    },
    []
  );

  const renderButtons = useCallback(
    async (attempt: number = 1) => {
      if (isDev) console.log("renderButtons called, attempt:", attempt);

      if (!paypalRef.current) {
        if (attempt < 10) {
          if (isDev) console.warn("PayPal container not ready yet, retrying...", { attempt });
          schedule(() => renderButtons(attempt + 1), 50 + attempt * 50);
          return;
        }
        console.error("PayPal container ref not available after max attempts");
        setError("PayPal container not ready");
        return;
      }

      if (!window.paypal || typeof window.paypal.Buttons !== "function") {
        if (attempt < 10) {
          if (isDev) console.warn("PayPal SDK not ready yet, retrying...", { attempt });
          const delay = 300 + attempt * 200;
          schedule(() => renderButtons(attempt + 1), delay);
          return;
        }
        console.error("PayPal SDK not loaded correctly after max attempts");
        setError("PayPal SDK not loaded correctly. Please refresh the page or try a different browser.");
        return;
      }

      paypalRef.current.innerHTML = "";

      try {
        if (isDev) console.log("Creating PayPal Buttons");

        try {
          buttonsInstanceRef.current?.close?.();
        } catch {
          // ignore
        }
        buttonsInstanceRef.current = null;

        const isDesktopNow = checkIsDesktop();
        buttonsInstanceRef.current = window.paypal.Buttons({
          // On desktop, only show PayPal button (no card). On mobile, show all options.
          fundingSource: isDesktopNow ? window.paypal.FUNDING.PAYPAL : undefined,
          createOrder: async () => {
            try {
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError || !session?.access_token) {
                if (isDev) console.error("Session error:", sessionError);
                toast.error("Please log in to continue with payment");
                throw new Error("Not authenticated");
              }

              if (isDev) console.log("Creating order for user");

              const { data, error } = await supabase.functions.invoke("paypal-create-order", {
                body: {
                  visaType,
                  duration,
                  countryCode,
                  applicationId,
                },
              });

              if (error) {
                if (isDev) console.error("Order creation error:", error);
                throw new Error(error.message || "Failed to create order");
              }

              if (!data?.orderId) {
                throw new Error("Failed to create order");
              }

              if (isDev) console.log("Order created");
              return data.orderId;
            } catch (error: any) {
              if (isDev) console.error("Error creating order:", error);
              toast.error(error.message || "Failed to create payment order. Please try again.");
              throw error;
            }
          },
          onApprove: async (data: any) => {
            if (isDev) console.log("PayPal onApprove triggered");

            try {
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session?.access_token) {
                if (isDev) console.error("No session in onApprove");
                toast.error("Session expired. Please log in again.");
                throw new Error("Not authenticated");
              }

              if (isDev) console.log("Capturing order");

              const { data: captureData, error: captureError } = await supabase.functions.invoke(
                "paypal-capture-order",
                {
                  body: { orderId: data.orderID },
                }
              );

              if (captureError) {
                const errorMsg = captureError.message || "Failed to capture payment";
                toast.error(errorMsg, { duration: 8000 });
                throw new Error(errorMsg);
              }

              toast.success("Payment completed successfully!");
              onSuccessRef.current({ orderId: data.orderID, ...captureData });
              return captureData;
            } catch (error: any) {
              if (isDev) console.error("Error capturing order:", error);
              onErrorRef.current(error);
              throw error;
            }
          },
          onError: (err: any) => {
            if (isDev) console.error("PayPal error:", err);
            const errorMsg = err?.message || "Payment failed. Please try again or contact support.";
            toast.error(errorMsg, { duration: 8000 });
            onErrorRef.current(err);
          },
          onCancel: () => {
            toast.info("Payment cancelled");
          },
        });

        await buttonsInstanceRef.current.render(paypalRef.current);
        if (isDev) console.log("PayPal buttons rendered successfully");
      } catch (err: any) {
        console.error("Error rendering PayPal buttons:", err?.message);
        setError(`Failed to render PayPal buttons: ${err?.message || "Unknown error"}`);
      }
    },
    [
      applicationId,
      countryCode,
      duration,
      isDev,
      schedule,
      visaType,
    ]
  );

  useEffect(() => {
    const loadPayPal = async () => {
      setLoading(true);
      setError(null);
      setSdkReady(false);
      clearScheduled();

      try {
        if (retryCount > 0) {
          const existing = document.querySelectorAll('script[data-paypal-sdk="true"]');
          existing.forEach((s) => s.remove());
          delete window.__paypalSdk;
        }

        if (window.paypal && typeof window.paypal.Buttons === "function") {
          if (!window.__paypalSdk || window.__paypalSdk.currency === currency) {
            window.__paypalSdk = window.__paypalSdk ?? {
              currency,
              promise: Promise.resolve(),
            };
            setSdkReady(true);
            setLoading(false);
            return;
          }

          setError("PayPal is already loaded with a different currency. Please refresh the page and try again.");
          setLoading(false);
          return;
        }

        if (window.__paypalSdk) {
          if (window.__paypalSdk.currency !== currency) {
            setError("PayPal is already loading with a different currency. Please refresh the page and try again.");
            setLoading(false);
            return;
          }

          await window.__paypalSdk.promise;
          setSdkReady(true);
          setLoading(false);
          return;
        }

        if (isDev) console.log("[PayPal] Fetching config...");

        const { data: config, error: configError } = await supabase.functions.invoke("paypal-config");

        if (configError) {
          console.error("[PayPal] Config endpoint error:", configError.message);
          setError("PayPal configuration service unavailable. Please try again later.");
          setLoading(false);
          return;
        }

        if (isDev) console.log("[PayPal] Config received:", { mode: (config as any)?.mode });

        if (!config?.clientId) {
          console.error("[PayPal] Missing configuration");
          setError("PayPal is not configured. Please contact support.");
          setLoading(false);
          return;
        }

        const { clientId, mode } = config;
        if (!clientId || clientId.length < 20) {
          console.error("[PayPal] Invalid configuration");
          setError("Invalid PayPal configuration. Please contact support.");
          setLoading(false);
          return;
        }

        if (isDev) console.log(`[PayPal] Loading SDK in ${mode || "default"} mode`);

        // On desktop: disable card funding. On mobile: enable card funding.
        const isDesktopNow = checkIsDesktop();
        const fundingParam = isDesktopNow ? "&disable-funding=card" : "&enable-funding=card";
        const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture${fundingParam}`;

        if (isDev) console.log("[PayPal] Loading SDK from:", sdkUrl.substring(0, 80) + "...");

        window.__paypalSdk = {
          currency,
          promise: new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector(
              `script[data-paypal-sdk="true"][data-currency="${currency}"]`
            ) as HTMLScriptElement | null;

            const script = existingScript ?? document.createElement("script");
            script.setAttribute("data-paypal-sdk", "true");
            script.setAttribute("data-currency", currency);
            script.src = sdkUrl;
            script.async = true;

            const timeoutId = window.setTimeout(() => {
              console.error("[PayPal] SDK load timeout - may be blocked by browser");
              reject(new Error("timeout"));
            }, 20000);

            const handleLoad = () => {
              window.clearTimeout(timeoutId);
              scriptLoadedRef.current = true;
              resolve();
            };

            const handleError = (e: any) => {
              window.clearTimeout(timeoutId);
              reject(e);
            };

            script.addEventListener("load", handleLoad, { once: true });
            script.addEventListener("error", handleError, { once: true });

            if (!existingScript) {
              document.body.appendChild(script);
            }
          }),
        };

        await window.__paypalSdk.promise;

        if (!window.paypal || typeof window.paypal.Buttons !== "function") {
          throw new Error("PayPal SDK loaded but Buttons API is unavailable");
        }

        setSdkReady(true);
        setLoading(false);
      } catch (err: any) {
        console.error("[PayPal] Initialization error:", err);

        const isTimeout = err?.message === "timeout";
        setError(
          isTimeout
            ? "PayPal is taking too long to load. Please disable any ad blockers or try a different browser."
            : "Could not load PayPal SDK. Please disable ad blockers and try again."
        );
        setLoading(false);
        setSdkReady(false);

        delete window.__paypalSdk;
      }
    };

    loadPayPal();

    return () => {
      clearScheduled();
      try {
        buttonsInstanceRef.current?.close?.();
      } catch {
        // ignore
      }
      buttonsInstanceRef.current = null;

      if (paypalRef.current) {
        paypalRef.current.innerHTML = "";
      }
    };
  }, [currency, retryCount, clearScheduled, isDev]);

  useEffect(() => {
    if (loading || error || !sdkReady) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderButtons(1);
      });
    });

    return () => {
      clearScheduled();
    };
  }, [sdkReady, loading, error, renderButtons, clearScheduled]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setSdkReady(false);
    setRetryCount((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading PayPal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-muted-foreground text-xs">Please refresh and try again, or contact support.</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isEmbeddedPreview && (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            Payments can be blocked inside embedded previews on desktop. Open this page in a new tab to complete checkout.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={openInNewTab}
          >
            Open checkout in new tab
          </Button>
        </div>
      )}
      <div
        ref={paypalRef}
        className="min-h-[50px]"
        style={{ minHeight: "50px" }}
      />
    </div>
  );
};

export default PayPalButton;
