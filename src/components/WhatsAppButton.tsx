import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "971527288475";
const PREFILLED_MESSAGE = encodeURIComponent("Hi, I need help applying for Indian visa via Visa4Less.");

const WhatsAppButton = () => {
  const handleClick = () => {
    // Track WhatsApp click
    if (typeof window !== "undefined") {
      if ((window as any).gtag) {
        (window as any).gtag("event", "whatsapp_click", {
          page_path: window.location.pathname,
        });
      }
      if ((window as any).fbq) {
        (window as any).fbq("track", "Contact", { method: "whatsapp" });
      }
    }

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${PREFILLED_MESSAGE}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      {/* Mobile-only sticky WhatsApp button */}
      <button
        onClick={handleClick}
        className="md:hidden fixed bottom-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" fill="currentColor" />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
      </button>

      {/* Desktop WhatsApp button - with tooltip */}
      <button
        onClick={handleClick}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" fill="currentColor" />
        
        {/* Tooltip - desktop only */}
        <span className="absolute right-full mr-3 px-3 py-2 bg-card border border-border rounded-lg shadow-lg text-sm text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Chat with us on WhatsApp
        </span>

        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
      </button>
    </>
  );
};

export default WhatsAppButton;
