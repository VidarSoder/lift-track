import type { WarmupKind, WarmupPreset } from "@/lib/types";

export const WARMUP_PRESETS: WarmupPreset[] = [
  {
    id: "bike-easy-8",
    kind: "bike",
    title: "Easy spin",
    detail: "8 minutes, just get warm",
    steps: [{ minutes: 8, pace: "Easy · level 4–5" }],
  },
  {
    id: "bike-ramp-10",
    kind: "bike",
    title: "Ramp then settle",
    detail: "Build it, then sit back down",
    steps: [
      { minutes: 4, pace: "Easy · level 4" },
      { minutes: 4, pace: "Moderate · level 6" },
      { minutes: 2, pace: "Easy · level 4" },
    ],
  },
  {
    id: "bike-hard-then-easy",
    kind: "bike",
    title: "Push, then wind down",
    detail: "6 minutes working, 3 minutes easy",
    steps: [
      { minutes: 6, pace: "Working · level 7" },
      { minutes: 3, pace: "Easy · level 4" },
    ],
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
];

export function warmupById(id: string) {
  return WARMUP_PRESETS.find((preset) => preset.id === id);
}

export function warmupsByKind(kind: WarmupKind) {
  return WARMUP_PRESETS.filter((preset) => preset.kind === kind);
}

export function warmupMinutes(preset: WarmupPreset) {
  return preset.steps.reduce((sum, step) => sum + step.minutes, 0);
}

export function warmupLabel(kind: WarmupKind) {
  return kind === "bike" ? "Bike" : "Run";
}
