"use client";

import { useRef, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import type { LoggedSet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function nudge(value: number | null, step: number, fallback: number) {
  return Math.max(0, Number(((value ?? fallback) + step).toFixed(1)));
}

function Stepper({
  value,
  unit,
  onMinus,
  onPlus,
}: {
  value: number | null;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between rounded-lg bg-background px-1 py-1">
      <button type="button" className="grid size-9 shrink-0 place-items-center" onClick={onMinus}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-0 text-center text-sm font-semibold">
        {value ?? "—"}
        <span className="block text-[10px] font-normal text-muted-foreground">{unit}</span>
      </span>
      <button type="button" className="grid size-9 shrink-0 place-items-center" onClick={onPlus}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function BikeRide({
  sets,
  lastLevel,
  lastMinutes,
  locked,
  onChange,
}: {
  sets: LoggedSet[];
  lastLevel?: number | null;
  lastMinutes?: number | null;
  locked?: boolean;
  onChange: (sets: LoggedSet[]) => void;
}) {
  const seedLevel = lastLevel ?? 5;
  const seedMinutes = lastMinutes ?? 10;
  const totalMin = sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const confirmTimer = useRef<number | null>(null);

  function update(index: number, next: LoggedSet) {
    onChange(sets.map((set, setIndex) => (setIndex === index ? next : set)));
  }

  function addSegment(level: number, minutes: number) {
    if (sets.length >= 8) return;
    onChange([
      ...sets,
      { weight: level, reps: minutes, done: false },
    ]);
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
  const nextLevel = last?.weight ?? seedLevel;
  const nextMinutes = last?.reps ?? seedMinutes;

  return (
    <div className="space-y-2">
      <p className="text-sm leading-6 text-muted-foreground">
        Same as the console: minutes at a level. Change resistance, add another
        block. {totalMin ? `${totalMin} min on the bike.` : "Start with one block."}
      </p>
      {sets.map((set, index) => {
        const level = set.weight ?? seedLevel;
        const minutes = set.reps ?? seedMinutes;
        return (
          <div
            key={`bike-seg-${index}`}
            className={cn(
              "space-y-2 rounded-2xl border p-2.5",
              set.done
                ? "border-primary/35 bg-primary/10"
                : "border-transparent bg-secondary/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <Stepper
                  value={set.reps}
                  unit="min"
                  onMinus={() =>
                    update(index, { ...set, reps: nudge(set.reps, -1, seedMinutes) })
                  }
                  onPlus={() =>
                    update(index, { ...set, reps: nudge(set.reps, 1, seedMinutes) })
                  }
                />
                <Stepper
                  value={set.weight}
                  unit="lvl"
                  onMinus={() =>
                    update(index, {
                      ...set,
                      weight: nudge(set.weight, -1, seedLevel),
                    })
                  }
                  onPlus={() =>
                    update(index, {
                      ...set,
                      weight: nudge(set.weight, 1, seedLevel),
                    })
                  }
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
              {minutes} min · level {level}
              {index === 0 && lastLevel != null ? ` · last lvl ${lastLevel}` : ""}
            </p>
            {locked ? null : (
              <Button
                type="button"
                variant={set.done ? "default" : "outline"}
                className="h-11 w-full"
                onClick={() =>
                  update(index, {
                    ...set,
                    weight: level,
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
            onClick={() => addSegment(Math.max(1, nextLevel - 2), 4)}
          >
            Easier block
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12"
            disabled={sets.length >= 8}
            onClick={() => addSegment(nextLevel + 2, 4)}
          >
            Harder block
          </Button>
          <Button
            type="button"
            variant="outline"
            className="col-span-2 h-12"
            disabled={sets.length >= 8}
            onClick={() => addSegment(nextLevel, nextMinutes)}
          >
            <Plus className="size-4" />
            Add a segment
          </Button>
        </div>
      )}
    </div>
  );
}
