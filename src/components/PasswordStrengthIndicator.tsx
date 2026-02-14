import { validatePassword, getPasswordStrength } from "@/lib/passwordValidation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRules?: boolean;
}

export function PasswordStrengthIndicator({ password, showRules = true }: PasswordStrengthIndicatorProps) {
  const { rules, isValid } = validatePassword(password);
  const strength = getPasswordStrength(password);

  const strengthColors = {
    weak: 'bg-destructive',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };

  const strengthWidth = {
    weak: 'w-1/4',
    fair: 'w-2/4',
    good: 'w-3/4',
    strong: 'w-full',
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength === 'weak' && "text-destructive",
            strength === 'fair' && "text-orange-500",
            strength === 'good' && "text-yellow-600",
            strength === 'strong' && "text-green-600"
          )}>
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              strengthColors[strength],
              strengthWidth[strength]
            )}
          />
        </div>
      </div>

      {/* Rules Checklist */}
      {showRules && (
        <div className="grid grid-cols-1 gap-1 text-xs">
          <RuleItem passed={rules.minLength} label="At least 12 characters" />
          <RuleItem passed={rules.hasUppercase} label="1 uppercase letter" />
          <RuleItem passed={rules.hasLowercase} label="1 lowercase letter" />
          <RuleItem passed={rules.hasNumber} label="1 number" />
          <RuleItem passed={rules.hasSpecial} label="1 special character" />
          {!rules.notWeak && password.length > 0 && (
            <RuleItem passed={false} label="Not a commonly used password" />
          )}
          {!rules.noRepeated && password.length > 0 && (
            <RuleItem passed={false} label="Not only repeated characters" />
          )}
        </div>
      )}
    </div>
  );
}

function RuleItem({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5",
      passed ? "text-green-600" : "text-muted-foreground"
    )}>
      {passed ? (
        <Check className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      <span>{label}</span>
    </div>
  );
}
