"use client";

import { useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import {
  CARDIO_PREFILLS,
  cardioLoadStep,
  cardioLoadUnit,
  type CardioKind,
} from "@/data/warmup";
import type { LoggedSet } from "@/lib/types";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPY: Record<
  CardioKind,
  { hint: string; loadWord: string; machine: string }
> = {
  bike: {
    hint: "Minutes at a level, same as the console.",
    loadWord: "level",
    machine: "bike",
  },
  run: {
    hint: "Minutes at a speed, same as the treadmill.",
    loadWord: "km/h",
    machine: "run",
  },
  walk: {
    hint: "Minutes at a walking speed, same controls as a run.",
    loadWord: "km/h",
    machine: "walk",
  },
};

const SEED: Record<CardioKind, { minutes: number; load: number }> = {
  bike: { minutes: 10, load: 5 },
  run: { minutes: 8, load: 7 },
  walk: { minutes: 20, load: 5 },
};

function setsMatchPrefill(sets: LoggedSet[], steps: { minutes: number; load: number }[]) {
  if (sets.length !== steps.length) return false;
  return steps.every((step, index) => {
    const set = sets[index];
    return set?.weight === step.load && set?.reps === step.minutes;
  });
}

export function CardioRide({
  kind,
  sets,
  lastLoad,
  lastMinutes,
  locked,
  onChange,
}: {
  kind: CardioKind;
  sets: LoggedSet[];
  lastLoad?: number | null;
  lastMinutes?: number | null;
  locked?: boolean;
  onChange: (sets: LoggedSet[]) => void;
}) {
  const seed = SEED[kind];
  const seedLoad = lastLoad ?? seed.load;
  const seedMinutes = lastMinutes ?? seed.minutes;
  const unit = cardioLoadUnit(kind);
  const loadStep = cardioLoadStep(kind);
  const copy = COPY[kind];
  const prefills = CARDIO_PREFILLS[kind];
  const totalMin = sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const confirmTimer = useRef<number | null>(null);
  const activePrefill = prefills.find((prefill) =>
    setsMatchPrefill(sets, prefill.steps),
  );

  function update(index: number, next: LoggedSet) {
    onChange(sets.map((set, setIndex) => (setIndex === index ? next : set)));
  }

  function applyPrefill(id: string) {
    const prefill = prefills.find((item) => item.id === id);
    if (!prefill) return;
    onChange(
      prefill.steps.map((step) => ({
        weight: step.load,
        reps: step.minutes,
        done: false,
      })),
    );
  }

  function addSegment(load: number, minutes: number) {
    if (sets.length >= 8) return;
    onChange([...sets, { weight: load, reps: minutes, done: false }]);
  }

  function requestRemove(index: number) {
    if (sets.length <= 1) return;
    if (confirmIndex !== index) {
      setConfirmIndex(index);
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => {
        setConfirmIndex(null);
        confirmTimer.current = null;
      }, 2500);
      return;
    }
    setConfirmIndex(null);
    onChange(sets.filter((_, setIndex) => setIndex !== index));
  }

  const last = sets[sets.length - 1];
  const nextLoad = last?.weight ?? seedLoad;
  const nextMinutes = last?.reps ?? seedMinutes;
  const easierDelta = kind === "bike" ? 2 : 1;

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-muted-foreground">
        {copy.hint} Change pace, add another block.
        {totalMin ? ` ${totalMin} min on the ${copy.machine}.` : " Start with a prefill or one block."}
      </p>

      {locked ? null : (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Start from
          </p>
          <div className="grid grid-cols-3 gap-2">
            {prefills.map((prefill) => {
              const active = activePrefill?.id === prefill.id;
              return (
                <button
                  key={prefill.id}
                  type="button"
                  onClick={() => applyPrefill(prefill.id)}
                  className={cn(
                    "min-w-0 rounded-2xl border px-2 py-2.5 text-left",
                    active
                      ? "border-primary/50 bg-primary/15"
                      : "border-transparent bg-secondary/80",
                  )}
                >
                  <span className="block text-[13px] font-semibold leading-tight">
                    {prefill.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                    {prefill.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sets.map((set, index) => {
        const load = set.weight ?? seedLoad;
        const minutes = set.reps ?? seedMinutes;
        return (
          <div
            key={`${kind}-seg-${index}`}
            className={cn(
              "space-y-2 rounded-2xl border p-2.5",
              set.done
                ? "border-primary/35 bg-primary/10"
                : "border-transparent bg-secondary/60",
            )}
          >
            <div className="flex items-start gap-2">
              <span className="grid size-8 shrink-0 place-items-center text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <Stepper
                  value={set.reps}
                  unit="min"
                  step={1}
                  fallback={seedMinutes}
                  onChange={(reps) => update(index, { ...set, reps })}
                />
                <Stepper
                  value={set.weight}
                  unit={unit}
                  step={loadStep}
                  fallback={seedLoad}
                  onChange={(weight) => update(index, { ...set, weight })}
                />
              </div>
              {sets.length > 1 && !locked ? (
                <button
                  type="button"
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground",
                    confirmIndex === index && "bg-destructive/15 text-destructive",
                  )}
                  aria-label={
                    confirmIndex === index
                      ? `Tap again to remove block ${index + 1}`
                      : `Remove block ${index + 1}`
                  }
                  onClick={() => requestRemove(index)}
                >
                  {confirmIndex === index ? (
                    <span className="text-[10px] font-medium">Again</span>
                  ) : (
                    <X className="size-4" />
                  )}
                </button>
              ) : null}
            </div>
            <p className="px-1 text-[11px] text-muted-foreground">
              {minutes} min · {load} {copy.loadWord}
              {index === 0 && lastLoad != null
                ? ` · last ${lastLoad} ${unit}`
                : ""}
            </p>
            {locked ? null : (
              <Button
                type="button"
                variant={set.done ? "default" : "outline"}
                className="h-11 w-full"
                onClick={() =>
                  update(index, {
                    ...set,
                    weight: load,
                    reps: minutes,
                    done: !set.done,
                  })
                }
              >
                {set.done ? <Check className="size-4" /> : null}
                {set.done ? "Saved" : "Save block"}
              </Button>
            )}
          </div>
        );
      })}

      {locked ? null : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-12"
            disabled={sets.length >= 8}
            onClick={() =>
              addSegment(Math.max(1, Number((nextLoad - easierDelta).toFixed(1))), 4)
            }
          >
            Easier block
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12"
            disabled={sets.length >= 8}
            onClick={() =>
              addSegment(Number((nextLoad + easierDelta).toFixed(1)), 4)
            }
          >
            Harder block
          </Button>
          <Button
            type="button"
            variant="outline"
            className="col-span-2 h-12"
            disabled={sets.length >= 8}
            onClick={() => addSegment(nextLoad, nextMinutes)}
          >
            <Plus className="size-4" />
            Add a segment
          </Button>
        </div>
      )}
    </div>
  );
}
