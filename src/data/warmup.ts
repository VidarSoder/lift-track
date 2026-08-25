import { resolveLoadHints } from "@/data/load-hints";
import type { Exercise, WarmupKind, WarmupPreset } from "@/lib/types";

const LEGACY_BIKE_IDS = new Set([
  "bike-easy-8",
  "bike-ramp-10",
  "bike-hard-then-easy",
]);

const LEGACY_RUN_IDS = new Set([
  "run-7-then-4",
  "run-easy-8",
  "run-walk-jog",
]);

const LEGACY_WALK_IDS = new Set([
  "walk-easy",
  "walk-easy-10",
  "walk-easy-30",
]);

export type CardioKind = "bike" | "run" | "walk";

export type CardioPrefill = {
  id: string;
  title: string;
  detail: string;
  steps: { minutes: number; load: number }[];
};

export const WARMUP_PRESETS: WarmupPreset[] = [
  {
    id: "bike",
    kind: "bike",
    title: "Bike",
    detail:
      "One ride. After you start, pick a prefill or set minutes and level like the console.",
    steps: [{ minutes: 10, pace: "Level 5" }],
  },
  {
    id: "run",
    kind: "run",
    title: "Run",
    detail:
      "One treadmill run. After you start, pick a prefill or set minutes and km/h yourself.",
    steps: [{ minutes: 8, pace: "7 km/h" }],
  },
  {
    id: "walk",
    kind: "walk",
    title: "Walk",
    detail:
      "One walk. After you start, pick a prefill or set minutes and km/h the same way as a run.",
    steps: [{ minutes: 20, pace: "5 km/h" }],
  },
];

export const CARDIO_PREFILLS: Record<CardioKind, CardioPrefill[]> = {
  bike: [
    {
      id: "easy",
      title: "Easy 8",
      detail: "8 min · lvl 4",
      steps: [{ minutes: 8, load: 4 }],
    },
    {
      id: "ramp",
      title: "Ramp 10",
      detail: "5 · 4, then 5 · 7",
      steps: [
        { minutes: 5, load: 4 },
        { minutes: 5, load: 7 },
      ],
    },
    {
      id: "hard-easy",
      title: "Hard then easy",
      detail: "6 · 8, then 4 · 4",
      steps: [
        { minutes: 6, load: 8 },
        { minutes: 4, load: 4 },
      ],
    },
  ],
  run: [
    {
      id: "easy",
      title: "Easy 8",
      detail: "8 min · 7 km/h",
      steps: [{ minutes: 8, load: 7 }],
    },
    {
      id: "7-then-4",
      title: "7 then 4",
      detail: "6 · 7, then 3 · 4",
      steps: [
        { minutes: 6, load: 7 },
        { minutes: 3, load: 4 },
      ],
    },
    {
      id: "walk-jog",
      title: "Walk-jog",
      detail: "3 walk, 5 jog, 2 walk",
      steps: [
        { minutes: 3, load: 5 },
        { minutes: 5, load: 7.5 },
        { minutes: 2, load: 4.5 },
      ],
    },
  ],
  walk: [
    {
      id: "short",
      title: "Short 10",
      detail: "10 min · 5 km/h",
      steps: [{ minutes: 10, load: 5 }],
    },
    {
      id: "easy",
      title: "Easy 20",
      detail: "20 min · 5 km/h",
      steps: [{ minutes: 20, load: 5 }],
    },
    {
      id: "long",
      title: "Long 30",
      detail: "30 min · 5 km/h",
      steps: [{ minutes: 30, load: 5 }],
    },
  ],
};

export function warmupById(id: string) {
  if (LEGACY_BIKE_IDS.has(id)) {
    return WARMUP_PRESETS.find((preset) => preset.id === "bike");
  }
  if (LEGACY_RUN_IDS.has(id)) {
    return WARMUP_PRESETS.find((preset) => preset.id === "run");
  }
  if (LEGACY_WALK_IDS.has(id)) {
    return WARMUP_PRESETS.find((preset) => preset.id === "walk");
  }
  return WARMUP_PRESETS.find((preset) => preset.id === id);
}

export function cardioKind(id: string, group?: string): CardioKind | null {
  if (group === "Bike" || id === "bike" || LEGACY_BIKE_IDS.has(id)) return "bike";
  if (group === "Run" || id === "run" || LEGACY_RUN_IDS.has(id)) return "run";
  if (group === "Walk" || id === "walk" || LEGACY_WALK_IDS.has(id)) return "walk";
  const kind = warmupById(id)?.kind;
  if (kind === "bike" || kind === "run" || kind === "walk") return kind;
  return null;
}

export function isBikeExercise(id: string, group?: string) {
  return cardioKind(id, group) === "bike";
}

export function isCardioRide(id: string, group?: string) {
  return cardioKind(id, group) != null;
}

export function warmupsByKind(kind: WarmupKind) {
  return WARMUP_PRESETS.filter((preset) => preset.kind === kind);
}

export function warmupMinutes(preset: WarmupPreset) {
  return preset.steps.reduce((sum, step) => sum + step.minutes, 0);
}

export function warmupLabel(kind: WarmupKind) {
  if (kind === "bike") return "Bike";
  if (kind === "run") return "Run";
  if (kind === "walk") return "Walk";
  return "Mobility";
}

export function cardioLoadUnit(kind: CardioKind) {
  return kind === "bike" ? "lvl" : "km/h";
}

export function cardioLoadStep(kind: CardioKind) {
  return kind === "run" || kind === "walk" ? 0.5 : 1;
}

export function firstNumber(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export type CardioUnits = {
  load: string;
  work: string;
  loadStep: number;
  workStep: number;
  fallbackLoad: number;
  only?: "work" | "reps";
};

export function cardioUnits(group: string): CardioUnits {
  if (group === "Run") {
    return { load: "km/h", work: "min", loadStep: 0.5, workStep: 1, fallbackLoad: 7 };
  }
  if (group === "Bike") {
    return { load: "lvl", work: "min", loadStep: 1, workStep: 1, fallbackLoad: 5 };
  }
  if (group === "Walk") {
    return { load: "km/h", work: "min", loadStep: 0.5, workStep: 1, fallbackLoad: 5 };
  }
  if (group === "Mobility") {
    return { load: "rpe", work: "min", loadStep: 1, workStep: 1, fallbackLoad: 3 };
  }
  return { load: "kg", work: "reps", loadStep: 2.5, workStep: 1, fallbackLoad: 20 };
}

export function exerciseUnits(exercise: Exercise): CardioUnits {
  const base = cardioUnits(exercise.group);
  if (exercise.bodyweight) {
    return { ...base, only: "reps", fallbackLoad: 0 };
  }
  // Strength lifts: use per-exercise plate/DB/machine steps, not the generic 2.5 kg default.
  if (base.load === "kg") {
    const hints = resolveLoadHints(exercise);
    return {
      ...base,
      loadStep: hints.loadStep,
      fallbackLoad: hints.defaultLoad,
    };
  }
  return base;
}
