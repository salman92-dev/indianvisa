import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POPUP_SHOWN_KEY = "visa4less_lead_popup_shown";
const POPUP_DELAY = 60000; // 60 seconds fallback

interface LeadCapturePopupProps {
  triggerPages?: string[];
}

const LeadCapturePopup = ({ triggerPages = ["/pricing", "/book-visa", "/apply-visa"] }: LeadCapturePopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
  });

  useEffect(() => {
    const hasShown = sessionStorage.getItem(POPUP_SHOWN_KEY);
    const currentPath = window.location.pathname;
    const shouldTrigger = triggerPages.some(page => currentPath.includes(page));

    if (hasShown || !shouldTrigger) return;

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        showPopup();
      }
    };

    // Time-based fallback
    const timeoutId = setTimeout(() => {
      showPopup();
    }, POPUP_DELAY);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timeoutId);
    };
  }, [triggerPages]);

  const showPopup = () => {
    const hasShown = sessionStorage.getItem(POPUP_SHOWN_KEY);
    if (!hasShown) {
      setIsOpen(true);
      sessionStorage.setItem(POPUP_SHOWN_KEY, "true");
      
      // Track popup shown event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "lead_popup_shown", {
          page_path: window.location.pathname,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("leads").insert({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        country: formData.country || null,
        source: "exit_intent",
        page_url: window.location.href,
      });

      if (error) throw error;

      // Track lead capture event
      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "lead_captured", {
            source: "exit_intent",
            page_path: window.location.pathname,
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", { source: "exit_intent" });
        }
      }

      toast.success("Thank you! We'll be in touch soon.");
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">Not Ready to Complete?</h2>
          <p className="text-muted-foreground text-sm">
            Leave your email and we'll guide you through the Indian visa process.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Name *</Label>
            <Input
              id="lead-name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email">Email *</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
            >
              <SelectTrigger id="lead-country">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AE">United Arab Emirates</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Get Visa Guidance"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LeadCapturePopup;
