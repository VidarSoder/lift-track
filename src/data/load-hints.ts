import type { Exercise } from "@/lib/types";

export type LoadHints = {
  defaultLoad: number;
  loadStep: number;
};

/**
 * Starting load and +/- step per lift.
 * Steps match common gym increments: DBs ~2 kg, pin stacks ~5 kg,
 * barbell plates ~2.5 kg (1.25 kg per side).
 */
const BY_ID: Record<string, LoadHints> = {
  "bench-press": { defaultLoad: 35, loadStep: 2.5 },
  "machine-bench": { defaultLoad: 20, loadStep: 5 },
  "incline-db-press": { defaultLoad: 6, loadStep: 2 },
  "pec-deck": { defaultLoad: 12, loadStep: 5 },
  "seated-db-press": { defaultLoad: 6, loadStep: 2 },
  "weighted-dip": { defaultLoad: 0, loadStep: 2.5 },
  "skull-crusher": { defaultLoad: 12, loadStep: 2.5 },
  "rope-pushdown": { defaultLoad: 10, loadStep: 5 },
  "overhead-rope": { defaultLoad: 10, loadStep: 5 },
  "pull-up": { defaultLoad: 0, loadStep: 2.5 },
  "lat-pulldown": { defaultLoad: 25, loadStep: 5 },
  "cable-row": { defaultLoad: 20, loadStep: 5 },
  "barbell-curl": { defaultLoad: 12, loadStep: 2.5 },
  "db-curl": { defaultLoad: 6, loadStep: 2 },
  "incline-curl": { defaultLoad: 4, loadStep: 2 },
  "hammer-curl": { defaultLoad: 6, loadStep: 2 },
  "leg-press": { defaultLoad: 40, loadStep: 10 },
  "hack-squat": { defaultLoad: 20, loadStep: 5 },
  "hip-thrust": { defaultLoad: 35, loadStep: 5 },
  "leg-curl": { defaultLoad: 15, loadStep: 5 },
  "calf-raise": { defaultLoad: 20, loadStep: 5 },
  "cg-bench": { defaultLoad: 30, loadStep: 2.5 },
  "ez-curl-arms": { defaultLoad: 12, loadStep: 2.5 },
  "oh-db-extension": { defaultLoad: 6, loadStep: 2 },
  "incline-curl-arms": { defaultLoad: 4, loadStep: 2 },
  "pushdown-arms": { defaultLoad: 10, loadStep: 5 },
  "spider-curl": { defaultLoad: 8, loadStep: 2 },
  "lateral-raise": { defaultLoad: 4, loadStep: 1 },
  "chest-supported-row": { defaultLoad: 8, loadStep: 2 },
  "cable-curl-fri": { defaultLoad: 10, loadStep: 5 },
  "pushdown-fri": { defaultLoad: 10, loadStep: 5 },
};

export function inferLoadStep(equipment: string) {
  const text = equipment.toLowerCase();
  if (/dumbbell|hantel|db\b/i.test(text)) return 2;
  if (
    /machine|leg press|hack squat|pec deck|pulldown|leg curl|calf|press machine|cable/i.test(
      text,
    )
  ) {
    return 5;
  }
  if (/barbell|ez-bar|ez bar|bar\b/i.test(text)) return 2.5;
  return 2.5;
}

export function inferDefaultLoad(equipment: string, group: string) {
  const text = equipment.toLowerCase();
  if (/dumbbell|hantel/i.test(text)) {
    if (/lateral|side delt/i.test(group)) return 3;
    return 5;
  }
  if (/machine|leg press/i.test(text)) return 20;
  if (/cable/i.test(text)) return 8;
  if (/barbell|ez-bar|bar\b/i.test(text)) return 12;
  return 10;
}

export function loadHintsFor(exerciseId: string): LoadHints | undefined {
  return BY_ID[exerciseId];
}

export function resolveLoadHints(exercise: Exercise): LoadHints {
  const mapped = loadHintsFor(exercise.id);
  const loadStep =
    exercise.loadStep ?? mapped?.loadStep ?? inferLoadStep(exercise.equipment);
  const defaultLoad =
    exercise.defaultLoad ??
    mapped?.defaultLoad ??
    inferDefaultLoad(exercise.equipment, exercise.group);
  return { loadStep, defaultLoad };
}
