import { Dumbbell } from "lucide-react";

export function AppLoader({
  title = "Training",
  detail = "Getting your log…",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16"
    >
      <div className="relative grid size-40 place-items-center">
        <span className="absolute inset-0 rounded-full bg-primary/10" />
        <span className="loader-ring absolute inset-2 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/35" />
        <span className="absolute inset-6 rounded-full border border-primary/20" />
        <Dumbbell className="relative size-14 text-primary" strokeWidth={1.75} />
      </div>
      <div className="mt-10 flex h-16 items-end gap-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className="loader-bar w-3 rounded-full bg-primary"
            style={{ animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>
      <p className="mt-8 font-heading text-3xl leading-none">{title}</p>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
