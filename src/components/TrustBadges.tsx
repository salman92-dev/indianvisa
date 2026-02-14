import {
  Shield,
  Lock,
  Globe,
  HeadphonesIcon,
  Zap,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import paypalLogo from "@/assets/paypal-logo.png";

// Section A: Payment & Security badges (top priority)
const paymentSecurityBadges = [
  { 
    id: "paypal",
    text: "Secure Payment",
    usePaypalLogo: true,
  },
  { 
    id: "pci",
    icon: Shield, 
    text: "PCI-DSS Compliant",
  },
  { 
    id: "ssl",
    icon: Lock, 
    text: "256-bit SSL",
  },
];

// Section B: Service Assurance items
const serviceAssuranceItems = [
  { id: "trusted", icon: Globe, text: "Trusted Worldwide" },
  { id: "fast", icon: FileCheck, text: "Fast Document Verification" },
  { id: "support", icon: HeadphonesIcon, text: "Priority Support" },
  { id: "verified", icon: Zap, text: "Verified Travel Assistance" },
];

// Full desktop badges (all items)
const allBadges = [
  { id: "paypal-full", text: "Secure Payment", usePaypalLogo: true },
  { id: "pci-full", icon: Shield, text: "PCI-DSS Compliant" },
  { id: "ssl-full", icon: Lock, text: "256-bit SSL" },
  { id: "trusted-full", icon: Globe, text: "Trusted Worldwide" },
  { id: "fast-full", icon: FileCheck, text: "Fast Verification" },
  { id: "support-full", icon: HeadphonesIcon, text: "Priority Support" },
  { id: "verified-full", icon: Zap, text: "Fast Processing" },
];

interface TrustBadgesProps {
  variant?: "footer";
  className?: string;
}

export const TrustBadges = ({ className = "" }: TrustBadgesProps) => {
  return (
    <div className={`py-6 bg-muted/50 border-t border-border/50 ${className}`}>
      <div className="container mx-auto px-4">
        
        {/* MOBILE VIEW: Two distinct sections */}
        <div className="lg:hidden space-y-6">
          {/* Section A: Payment & Security */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {paymentSecurityBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2"
                >
                  {badge.usePaypalLogo ? (
                    <img 
                      src={paypalLogo} 
                      alt="PayPal" 
                      className="h-5 w-auto"
                    />
                  ) : badge.icon && (
                    <badge.icon 
                      className="h-5 w-5 text-primary flex-shrink-0" 
                      strokeWidth={1.5} 
                    />
                  )}
                  <span className="text-xs font-medium text-foreground/80">
                    {badge.text}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Payments are securely processed via PayPal
            </p>
          </div>

          {/* Separator */}
          <div className="border-t border-border/30" />

          {/* Section B: Service Assurance */}
          <div className="grid grid-cols-2 gap-3">
            {serviceAssuranceItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2"
              >
                <CheckCircle2 
                  className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" 
                  strokeWidth={2} 
                />
                <span className="text-[11px] text-foreground/70 leading-tight">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DESKTOP VIEW: Full horizontal list */}
        <div className="hidden lg:flex items-center justify-center gap-8 flex-wrap">
          {allBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-2"
            >
              {badge.usePaypalLogo ? (
                <img 
                  src={paypalLogo} 
                  alt="PayPal" 
                  className="h-4 w-auto"
                />
              ) : badge.icon && (
                <badge.icon 
                  className="h-4 w-4 text-primary flex-shrink-0" 
                  strokeWidth={1.5} 
                />
              )}
              <span className="text-xs font-medium text-foreground/80">
                {badge.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;