import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Tracking pixel IDs - Replace with actual IDs when ready
const META_PIXEL_ID = "YOUR_META_PIXEL_ID"; // Facebook/Instagram Pixel
const GOOGLE_ADS_ID = "YOUR_GOOGLE_ADS_ID"; // Google Ads conversion tag
const TIKTOK_PIXEL_ID = "YOUR_TIKTOK_PIXEL_ID"; // TikTok Pixel

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: any;
    ttq: any;
  }
}

const TrackingPixels = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize Meta Pixel
    if (META_PIXEL_ID !== "YOUR_META_PIXEL_ID") {
      initMetaPixel();
    }

    // Initialize TikTok Pixel
    if (TIKTOK_PIXEL_ID !== "YOUR_TIKTOK_PIXEL_ID") {
      initTikTokPixel();
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    // Meta Pixel page view
    if (window.fbq) {
      window.fbq("track", "PageView");
    }

    // TikTok Pixel page view
    if (window.ttq) {
      window.ttq.page();
    }

    // Google Analytics page view is handled automatically by gtag
  }, [location.pathname]);

  return null;
};

// Initialize Meta (Facebook/Instagram) Pixel
function initMetaPixel() {
  if (window.fbq) return;

  (function(f: any, b: Document, e: string, v: string) {
    const n: any = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}

// Initialize TikTok Pixel
function initTikTokPixel() {
  if (window.ttq) return;

  (function(w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = w[t] = w[t] || [];
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off",
      "once", "ready", "alias", "group", "enableCookie", "disableCookie"
    ];
    ttq.setAndDefer = function(target: any, method: string) {
      target[method] = function() {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function(instanceId: string) {
      const e = ttq._i[instanceId] || [];
      for (let n = 0; n < ttq.methods.length; n++) {
        ttq.setAndDefer(e, ttq.methods[n]);
      }
      return e;
    };
    ttq.load = function(pixelId: string, options?: object) {
      const i = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[pixelId] = [];
      ttq._i[pixelId]._u = i;
      ttq._t = ttq._t || {};
      ttq._t[pixelId] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[pixelId] = options || {};
      const script = d.createElement("script") as HTMLScriptElement;
      script.type = "text/javascript";
      script.async = true;
      script.src = i + "?sdkid=" + pixelId + "&lib=" + t;
      const firstScript = d.getElementsByTagName("script")[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);
    };
    ttq.load(TIKTOK_PIXEL_ID);
    ttq.page();
  })(window, document, "ttq");
}

// Export tracking utility functions for use in other components
export const trackEvent = {
  // Meta Pixel events
  meta: {
    lead: (data?: object) => window.fbq?.("track", "Lead", data),
    purchase: (data: { value: number; currency: string }) =>
      window.fbq?.("track", "Purchase", data),
    addToCart: (data?: object) => window.fbq?.("track", "AddToCart", data),
    initiateCheckout: (data?: object) =>
      window.fbq?.("track", "InitiateCheckout", data),
    completeRegistration: (data?: object) =>
      window.fbq?.("track", "CompleteRegistration", data),
  },

  // Google Analytics events
  google: {
    conversion: (conversionId: string, data?: object) =>
      window.gtag?.("event", "conversion", {
        send_to: conversionId,
        ...data,
      }),
    event: (eventName: string, data?: object) =>
      window.gtag?.("event", eventName, data),
  },

  // TikTok Pixel events
  tiktok: {
    purchase: (data: { value: number; currency: string }) =>
      window.ttq?.track("Purchase", data),
    addToCart: (data?: object) => window.ttq?.track("AddToCart", data),
    initiateCheckout: (data?: object) =>
      window.ttq?.track("InitiateCheckout", data),
    completeRegistration: (data?: object) =>
      window.ttq?.track("CompleteRegistration", data),
    submitForm: (data?: object) => window.ttq?.track("SubmitForm", data),
  },

  // Track across all platforms
  all: {
    purchase: (value: number, currency: string) => {
      trackEvent.meta.purchase({ value, currency });
      trackEvent.tiktok.purchase({ value, currency });
      trackEvent.google.event("purchase", { value, currency });
    },
    lead: (source?: string) => {
      trackEvent.meta.lead({ source });
      trackEvent.tiktok.submitForm({ source });
      trackEvent.google.event("generate_lead", { source });
    },
    registration: () => {
      trackEvent.meta.completeRegistration();
      trackEvent.tiktok.completeRegistration();
      trackEvent.google.event("sign_up");
    },
  },
};

export default TrackingPixels;
