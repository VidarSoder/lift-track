import type { WarmupKind, WarmupPreset } from "@/lib/types";

const LEGACY_BIKE_IDS = new Set([
  "bike-easy-8",
  "bike-ramp-10",
  "bike-hard-then-easy",
]);

export const WARMUP_PRESETS: WarmupPreset[] = [
  {
    id: "bike",
    kind: "bike",
    title: "Bike",
    detail:
      "One ride. After you start, set minutes and level like the console. Add a segment when you change resistance.",
    steps: [{ minutes: 10, pace: "Level 5" }],
  },
  {
    id: "run-7-then-4",
    kind: "run",
    title: "7 km/h, then 4 km/h",
    detail: "The usual treadmill start",
    steps: [
      { minutes: 6, pace: "7 km/h" },
      { minutes: 3, pace: "4 km/h wind-down" },
    ],
  },
  {
    id: "run-easy-8",
    kind: "run",
    title: "Easy 8 minutes",
    detail: "Steady jog, no heroics",
    steps: [{ minutes: 8, pace: "7 km/h" }],
  },
  {
    id: "run-walk-jog",
    kind: "run",
    title: "Walk, jog, walk",
    detail: "If the legs are still heavy",
    steps: [
      { minutes: 3, pace: "5 km/h walk" },
      { minutes: 5, pace: "7.5 km/h jog" },
      { minutes: 2, pace: "4.5 km/h walk" },
    ],
  },
  {
    id: "walk-easy",
    kind: "walk",
    title: "Easy walk",
    detail: "Set how many minutes you walked, then save. Short before a lift, or 30 if that is the session.",
    steps: [{ minutes: 20, pace: "Easy" }],
  },
];

export function warmupById(id: string) {
  if (LEGACY_BIKE_IDS.has(id)) {
    return WARMUP_PRESETS.find((preset) => preset.id === "bike");
  }
  return WARMUP_PRESETS.find((preset) => preset.id === id);
}

export function isBikeExercise(id: string, group?: string) {
  return (
    group === "Bike" ||
    id === "bike" ||
    LEGACY_BIKE_IDS.has(id) ||
    warmupById(id)?.kind === "bike"
  );
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

export function firstNumber(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function cardioUnits(group: string) {
  if (group === "Run") {
    return { load: "km/h", work: "min", loadStep: 0.5, workStep: 1, fallbackLoad: 7 };
  }
  if (group === "Bike") {
    return { load: "lvl", work: "min", loadStep: 1, workStep: 1, fallbackLoad: 5 };
  }
  if (group === "Walk") {
    return {
      load: "min",
      work: "min",
      loadStep: 1,
      workStep: 1,
      fallbackLoad: 20,
      only: "work" as const,
    };
  }
  if (group === "Mobility") {
    return { load: "rpe", work: "min", loadStep: 1, workStep: 1, fallbackLoad: 3 };
  }
  return { load: "kg", work: "reps", loadStep: 2.5, workStep: 1, fallbackLoad: 20 };
}
