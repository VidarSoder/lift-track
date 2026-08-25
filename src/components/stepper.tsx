"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function parseLooseNumber(raw: string) {
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** Finest precision when typing / dragging — gym weights are usually 0.5 kg. */
function fineStepFor(unit: string) {
  if (unit === "kg") return 0.5;
  if (unit === "km/h") return 0.5;
  if (unit === "min" || unit === "reps" || unit === "lvl" || unit === "rpe") {
    return 1;
  }
  return 0.5;
}

function decimalsFor(step: number) {
  if (step < 1) return 1;
  if (Number.isInteger(step)) return 0;
  return 1;
}

function clampSnap(
  value: number,
  step: number,
  min: number,
  max: number,
) {
  const snapped = Math.round(value / step) * step;
  const clamped = Math.min(max, Math.max(min, snapped));
  return Number(clamped.toFixed(decimalsFor(step)));
}

function rangeFor(unit: string) {
  if (unit === "kg") return { min: 0, max: 220 };
  if (unit === "reps") return { min: 0, max: 40 };
  if (unit === "min") return { min: 1, max: 90 };
  if (unit === "lvl") return { min: 1, max: 25 };
  if (unit === "km/h") return { min: 2, max: 18 };
  if (unit === "rpe") return { min: 1, max: 10 };
  return { min: 0, max: 200 };
}

export function Stepper({
  value,
  unit,
  step,
  min,
  max,
  fallback,
  onChange,
}: {
  value: number | null;
  unit: string;
  step: number;
  min?: number;
  max?: number;
  fallback: number;
  onChange: (value: number) => void;
}) {
  const bounds = rangeFor(unit);
  const low = min ?? bounds.min;
  const high = max ?? bounds.max;
  const fine = fineStepFor(unit);
  const current = value ?? fallback;
  const [editing, setEditing] = useState(false);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  /** +/- buttons: jump by the equipment step, keep 0.5 kg precision. */
  function bump(delta: number) {
    onChange(clampSnap(current + delta, fine, low, high));
  }

  /** Typed / slider: accept any value at fine precision (0.5 kg), not the button step. */
  function commitFree(next: number) {
    onChange(clampSnap(next, fine, low, high));
  }

  function formatDisplay(n: number) {
    return String(n).replace(".", ",");
  }

  return (
    <div className="min-w-0 rounded-lg bg-background px-1 py-1.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center"
          aria-label={`Decrease ${unit}`}
          onClick={() => bump(-step)}
        >
          <Minus className="size-4" />
        </button>
        {editing ? (
          <div className="min-w-0 flex-1 text-center">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              onBlur={() => {
                const parsed = parseLooseNumber(typed);
                if (parsed != null) commitFree(parsed);
                setEditing(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              aria-label={`${unit} value`}
              className="w-full bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
            />
            <span className="block text-[10px] font-normal text-muted-foreground">
              {unit} · any value
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 px-1 text-center"
            onClick={() => {
              setTyped(value == null ? "" : formatDisplay(value));
              setEditing(true);
            }}
          >
            <span className="block text-sm font-semibold tabular-nums">
              {value ?? "—"}
            </span>
            <span className="block text-[10px] font-normal text-muted-foreground">
              {unit} · tap to type · ±{step}
            </span>
          </button>
        )}
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center"
          aria-label={`Increase ${unit}`}
          onClick={() => bump(step)}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Slider
        className={cn("mt-1.5 px-1")}
        min={low}
        max={high}
        step={fine}
        value={[Math.min(high, Math.max(low, current))]}
        onValueChange={(next) => {
          const raw = Array.isArray(next) ? next[0] : next;
          if (typeof raw !== "number") return;
          setEditing(false);
          commitFree(raw);
        }}
        aria-label={`${unit} slider`}
      />
    </div>
  );
}
