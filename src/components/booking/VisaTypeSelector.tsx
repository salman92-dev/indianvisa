import { Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisaDuration, VISA_TYPE_OPTIONS, getVisaPrice, getCurrencyByCountry } from "@/lib/currencyUtils";

interface VisaTypeSelectorProps {
  value: VisaDuration;
  onChange: (value: VisaDuration) => void;
  nationality: string;
}

const VisaTypeSelector = ({ value, onChange, nationality }: VisaTypeSelectorProps) => {
  const { code: currency, symbol } = getCurrencyByCountry(nationality);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium">Choose Your Visa Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VISA_TYPE_OPTIONS.map((visa) => {
          const price = getVisaPrice(visa.id, currency);
          const isSelected = value === visa.id;

          return (
            <button
              key={visa.id}
              type="button"
              onClick={() => onChange(visa.id)}
              className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 transition-all text-left",
                "hover:border-primary/50 hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              )}
            >
              {/* Popular badge */}
              {visa.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    <Crown className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>

              {/* Content */}
              <div className={cn("space-y-2", visa.popular && "mt-2")}>
                <h4 className="font-semibold text-foreground pr-6">{visa.name}</h4>
                <p className="text-xs text-muted-foreground">{visa.description}</p>
                
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">
                      {symbol}{price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">per person</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {visa.processingTime}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VisaTypeSelector;
