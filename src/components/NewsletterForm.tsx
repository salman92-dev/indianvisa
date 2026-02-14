import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .eq("source", "newsletter")
        .maybeSingle();

      if (existing) {
        toast.info("You're already subscribed!");
        setEmail("");
        setIsSubmitting(false);
        return;
      }

      // Insert into leads table
      const { error } = await supabase.from("leads").insert({
        name: "Newsletter Subscriber",
        email: email.trim().toLowerCase(),
        source: "newsletter",
        page_url: window.location.href,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        // Send confirmation and admin notification emails
        try {
          await supabase.functions.invoke("send-newsletter-subscription", {
            body: { email: email.trim().toLowerCase() },
          });
        } catch (emailError) {
          console.error("Newsletter email error:", emailError);
        }

        // Track newsletter signup
        if (typeof window !== "undefined") {
          if ((window as any).gtag) {
            (window as any).gtag("event", "newsletter_signup", {
              page_path: window.location.pathname,
            });
          }
          if ((window as any).fbq) {
            (window as any).fbq("track", "Lead", { source: "newsletter" });
          }
        }
        toast.success("Thanks for subscribing! Check your email for confirmation.");
      }
      
      setEmail("");
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Stay Updated</h4>
      <p className="text-sm text-muted-foreground">
        Get visa updates & travel tips for India
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-background"
          maxLength={255}
          aria-label="Email for newsletter"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={isSubmitting}
          aria-label="Subscribe to newsletter"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default NewsletterForm;
