import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ApplicantCounterProps {
  count: number;
  onChange: (count: number) => void;
  max?: number;
}

const ApplicantCounter = ({ count, onChange, max = 10 }: ApplicantCounterProps) => {
  const increment = () => {
    if (count < max) {
      onChange(count + 1);
    }
  };

  const decrement = () => {
    if (count > 1) {
      onChange(count - 1);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium flex items-center gap-2">
        <Users className="h-4 w-4" />
        Total Applicants
      </Label>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={count <= 1}
          className="h-10 w-10"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-2xl font-bold min-w-[3ch] text-center">{count}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={count >= max}
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">(max {max})</span>
      </div>
    </div>
  );
};

export default ApplicantCounter;
