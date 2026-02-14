import { Check, Cloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  saving: boolean;
  lastSaved: Date | null;
  className?: string;
}

const SaveIndicator = ({ saving, lastSaved, className }: SaveIndicatorProps) => {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs transition-all duration-300",
      saving ? "text-muted-foreground" : "text-muted-foreground/70",
      className
    )}>
      {saving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <Cloud className="h-3 w-3 text-primary" />
          <Check className="h-2.5 w-2.5 text-primary -ml-2.5 mb-1" />
          <span>Saved {formatLastSaved(lastSaved)}</span>
        </>
      ) : null}
    </div>
  );
};

export default SaveIndicator;
