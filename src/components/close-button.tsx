import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CloseButton({
  onClick,
  className,
  label = "Close",
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <X className="size-4" />
    </button>
  );
}
