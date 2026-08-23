import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Anchor,
  ArrowDown,
  ArrowDownFromLine,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpFromDot,
  ArrowUpRight,
  ArrowUpToLine,
  Bike,
  Columns2,
  Crosshair,
  Diamond,
  Flame,
  FlipHorizontal2,
  Footprints,
  GitCommitHorizontal,
  Hammer,
  HeartPulse,
  Hexagon,
  Infinity,
  Leaf,
  Link2,
  Minus,
  Mountain,
  MoveDiagonal2,
  MoveHorizontal,
  Orbit,
  PersonStanding,
  RectangleHorizontal,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Route,
  Snowflake,
  Split,
  Square,
  Sun,
  Triangle,
  Undo2,
  Waves,
} from "lucide-react";

export type Tone = {
  chip: string;
  ink: string;
  edge: string;
};

export type Mark = {
  icon: LucideIcon;
  tone: Tone;
};

const TONES = {
  sand: {
    chip: "bg-amber-500/12",
    ink: "text-amber-200/85",
    edge: "border-l-amber-700/45",
  },
  rust: {
    chip: "bg-orange-500/12",
    ink: "text-orange-200/80",
    edge: "border-l-orange-800/45",
  },
  clay: {
    chip: "bg-rose-500/12",
    ink: "text-rose-200/80",
    edge: "border-l-rose-800/40",
  },
  wine: {
    chip: "bg-red-500/12",
    ink: "text-red-200/75",
    edge: "border-l-red-900/40",
  },
  dusk: {
    chip: "bg-violet-500/12",
    ink: "text-violet-200/80",
    edge: "border-l-violet-800/40",
  },
  ink: {
    chip: "bg-indigo-500/12",
    ink: "text-indigo-200/80",
    edge: "border-l-indigo-800/40",
  },
  slate: {
    chip: "bg-sky-500/12",
    ink: "text-sky-200/80",
    edge: "border-l-sky-800/40",
  },
  fog: {
    chip: "bg-cyan-500/10",
    ink: "text-cyan-200/75",
    edge: "border-l-cyan-800/35",
  },
  pine: {
    chip: "bg-teal-500/12",
    ink: "text-teal-200/80",
    edge: "border-l-teal-800/40",
  },
  moss: {
    chip: "bg-emerald-500/12",
    ink: "text-emerald-200/80",
    edge: "border-l-emerald-800/40",
  },
  sage: {
    chip: "bg-lime-500/10",
    ink: "text-lime-200/75",
    edge: "border-l-lime-800/35",
  },
  copper: {
    chip: "bg-yellow-600/12",
    ink: "text-yellow-200/75",
    edge: "border-l-yellow-800/40",
  },
  stone: {
    chip: "bg-stone-400/12",
    ink: "text-stone-200/80",
    edge: "border-l-stone-600/40",
  },
  blush: {
    chip: "bg-fuchsia-500/10",
    ink: "text-fuchsia-200/75",
    edge: "border-l-fuchsia-800/35",
  },
} satisfies Record<string, Tone>;

export const EXERCISE_MARKS: Record<string, Mark> = {
  "bench-press": { icon: RectangleHorizontal, tone: TONES.sand },
  "machine-bench": { icon: Columns2, tone: TONES.rust },
  "incline-db-press": { icon: ArrowUpRight, tone: TONES.rust },
  "seated-db-press": { icon: Triangle, tone: TONES.copper },
  "weighted-dip": { icon: ArrowDownToLine, tone: TONES.clay },
  "skull-crusher": { icon: Minus, tone: TONES.wine },
  "rope-pushdown": { icon: ArrowDown, tone: TONES.dusk },
  "overhead-rope": { icon: ArrowUpFromDot, tone: TONES.ink },
  "pull-up": { icon: ArrowUpToLine, tone: TONES.slate },
  "lat-pulldown": { icon: ArrowDownFromLine, tone: TONES.dusk },
  "cable-row": { icon: MoveHorizontal, tone: TONES.pine },
  "barbell-curl": { icon: RefreshCcw, tone: TONES.sage },
  "incline-curl": { icon: RotateCcw, tone: TONES.copper },
  "hammer-curl": { icon: Hammer, tone: TONES.stone },
  "goblet-squat": { icon: ArrowDownWideNarrow, tone: TONES.moss },
  "bulgarian-split-squat": { icon: ArrowDownLeft, tone: TONES.pine },
  "hip-thrust": { icon: Mountain, tone: TONES.sage },
  "leg-press": { icon: Square, tone: TONES.stone },
  "leg-curl": { icon: Undo2, tone: TONES.fog },
  "calf-raise": { icon: ArrowUpDown, tone: TONES.slate },
  "knee-raise": { icon: PersonStanding, tone: TONES.ink },
  "cg-bench": { icon: Columns2, tone: TONES.sand },
  "ez-curl-arms": { icon: Infinity, tone: TONES.rust },
  "oh-db-extension": { icon: Hexagon, tone: TONES.clay },
  "incline-curl-arms": { icon: RotateCw, tone: TONES.wine },
  "pushdown-arms": { icon: Diamond, tone: TONES.dusk },
  "spider-curl": { icon: GitCommitHorizontal, tone: TONES.ink },
  "lateral-raise": { icon: MoveDiagonal2, tone: TONES.sand },
  "chest-supported-row": { icon: FlipHorizontal2, tone: TONES.fog },
  "cable-curl-fri": { icon: Link2, tone: TONES.blush },
  "pushdown-fri": { icon: Crosshair, tone: TONES.dusk },
  "zone2-walk": { icon: Route, tone: TONES.moss },
  "arm-care": { icon: HeartPulse, tone: TONES.clay },
  "walk-easy-10": { icon: Route, tone: TONES.sage },
  "walk-easy-30": { icon: Route, tone: TONES.moss },
  "walk-easy": { icon: Route, tone: TONES.moss },
  "arms-mobility": { icon: HeartPulse, tone: TONES.clay },
  "bike-easy-8": { icon: Bike, tone: TONES.sage },
  "bike-ramp-10": { icon: Bike, tone: TONES.pine },
  "bike-hard-then-easy": { icon: Bike, tone: TONES.moss },
  "run-7-then-4": { icon: Footprints, tone: TONES.sand },
  "run-easy-8": { icon: Footprints, tone: TONES.copper },
  "run-walk-jog": { icon: Footprints, tone: TONES.clay },
};

export const WORKOUT_MARKS: Record<string, Mark> = {
  push: { icon: Flame, tone: TONES.rust },
  pull: { icon: ArrowUpToLine, tone: TONES.slate },
  legs: { icon: Mountain, tone: TONES.moss },
  arms: { icon: Activity, tone: TONES.copper },
  shoulders: { icon: Sun, tone: TONES.sand },
  optional: { icon: Leaf, tone: TONES.pine },
  warmup: { icon: Bike, tone: TONES.sage },
  rest: { icon: Snowflake, tone: TONES.stone },
};

const FALLBACK: Mark = { icon: Orbit, tone: TONES.stone };
const WAVE: Mark = { icon: Waves, tone: TONES.fog };
const ANCHOR: Mark = { icon: Anchor, tone: TONES.ink };
const BIKE: Mark = { icon: Bike, tone: TONES.sage };
const SPLIT: Mark = { icon: Split, tone: TONES.dusk };

const EXTRA = [FALLBACK, WAVE, ANCHOR, BIKE, SPLIT];

export function markFor(id: string): Mark {
  if (EXERCISE_MARKS[id]) return EXERCISE_MARKS[id];
  if (WORKOUT_MARKS[id]) return WORKOUT_MARKS[id];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 3)) % EXTRA.length;
  return EXTRA[hash] ?? FALLBACK;
}
