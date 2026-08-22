"use client";

import { Bike, Check, Footprints } from "lucide-react";
import {
  warmupById,
  warmupLabel,
  warmupMinutes,
  warmupsByKind,
} from "@/data/warmup";
import type { WarmupKind, WarmupLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KINDS: { id: WarmupKind; label: string; icon: typeof Bike }[] = [
  { id: "run", label: "Run", icon: Footprints },
  { id: "bike", label: "Bike", icon: Bike },
];

export function warmupFromPreset(id: string): WarmupLog | undefined {
  const preset = warmupById(id);
  if (!preset) return undefined;
  return {
    kind: preset.kind,
    presetId: preset.id,
    title: preset.title,
    steps: preset.steps,
  };
}

export function WarmupPicker({
  value,
  onChange,
}: {
  value?: WarmupLog;
  onChange: (warmup?: WarmupLog) => void;
}) {
  const kind = value?.kind ?? "run";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Warm-up</p>
        {value ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => onChange(undefined)}
          >
            Skip
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {KINDS.map((item) => {
          const Icon = item.icon;
          const active = kind === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const first = warmupsByKind(item.id)[0];
                onChange(first ? warmupFromPreset(first.id) : undefined);
              }}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {warmupsByKind(kind).map((preset) => {
          const selected = value?.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(warmupFromPreset(preset.id))}
              className={cn(
                "w-full rounded-2xl border px-3 py-3 text-left",
                selected
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium leading-tight">{preset.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {warmupMinutes(preset)} min · {preset.detail}
                  </p>
                </div>
                {selected ? <Check className="size-4 shrink-0 text-primary" /> : null}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {preset.steps
                  .map((step) => `${step.minutes} min ${step.pace}`)
                  .join(" → ")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
