import { useEffect } from "react";

/**
 * Forces HTTPS and canonical domain redirect.
 * Redirects:
 * - http://visa4less.com → https://visa4less.com
 * - http://www.visa4less.com → https://visa4less.com
 * - https://www.visa4less.com → https://visa4less.com
 * 
 * Note: For best SEO, also configure visa4less.com as the primary domain
 * in Lovable Project Settings → Domains for server-side 301 redirects.
 */
const HttpsRedirect = () => {
  useEffect(() => {
    const { protocol, hostname, pathname, search, hash } = window.location;
    
    // Skip redirect for local development and preview URLs
    if (
      hostname === "localhost" ||
      hostname.includes("lovable.app") ||
      hostname.includes("lovable.dev")
    ) {
      return;
    }

    const isHttp = protocol === "http:";
    const isWww = hostname.startsWith("www.");
    
    // Redirect if not HTTPS or if using www
    if (isHttp || isWww) {
      const canonicalHost = hostname.replace(/^www\./, "");
      const canonicalUrl = `https://${canonicalHost}${pathname}${search}${hash}`;
      
      // Use replace to perform a 301-like redirect (replaces history entry)
      window.location.replace(canonicalUrl);
    }
  }, []);

  return null;
};

export default HttpsRedirect;
