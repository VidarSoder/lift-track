"use client";

import { Check } from "lucide-react";
import { warmupLabel } from "@/data/warmup";
import type { WarmupLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WarmupCard({
  warmup,
  onDone,
}: {
  warmup: WarmupLog;
  onDone: () => void;
}) {
  return (
    <Card className={cn(warmup.done && "bg-primary/[0.06] ring-primary/25")}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Warm-up · {warmupLabel(warmup.kind)}
            </p>
            <p className="mt-0.5 font-medium">{warmup.title}</p>
          </div>
          {warmup.done ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              <Check className="size-3.5" />
              Done
            </span>
          ) : null}
        </div>
        <ol className="space-y-1.5 text-sm leading-6">
          {warmup.steps.map((step, index) => (
            <li key={`${step.pace}-${index}`} className="text-muted-foreground">
              <span className="font-medium text-foreground">{step.minutes} min</span>
              {" · "}
              {step.pace}
            </li>
          ))}
        </ol>
        {warmup.done ? null : (
          <Button className="h-11 w-full" onClick={onDone}>
            Mark warm-up done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
