import { markFor } from "@/data/marks";
import { cn } from "@/lib/utils";

export function ExerciseMark({
  id,
  size = "md",
  className,
}: {
  id: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const mark = markFor(id);
  const Icon = mark.icon;

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-lg",
        mark.tone.chip,
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "size-3.5" : "size-4", mark.tone.ink)} />
    </span>
  );
}

export function markEdge(id: string) {
  return markFor(id).tone.edge;
}
