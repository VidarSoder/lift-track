export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayKind =
  | "push"
  | "pull"
  | "legs"
  | "arms"
  | "shoulders"
  | "optional"
  | "warmup"
  | "rest";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type SetTarget = {
  reps: string;
  restSec: number;
};

export type Exercise = {
  id: string;
  name: string;
  group: string;
  sets: number;
  reps: string;
  restSec: number;
  tempo?: string;
  equipment: string;
  setup: string;
  how: string;
  mistakes: string;
  progress: string;
  supersetWith?: string;
};

export type ProgramDay = {
  id: DayKind;
  weekday: Weekday;
  title: string;
  source: string;
  focus: string;
  durationMin: string;
  warmup: string[];
  finishers?: string[];
  coaching: string;
  exercises: Exercise[];
};

export type WarmupKind = "bike" | "run" | "walk" | "mobility";

export type WarmupStep = {
  minutes: number;
  pace: string;
};

export type WarmupPreset = {
  id: string;
  kind: WarmupKind;
  title: string;
  detail: string;
  steps: WarmupStep[];
};

export type WarmupLog = {
  kind: WarmupKind;
  presetId: string;
  title: string;
  steps: WarmupStep[];
  done?: boolean;
};

export type CustomExercise = {
  id: string;
  name: string;
  group: string;
  sets: number;
  reps: string;
};

export type PinnedExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
};

export type LoggedSet = {
  weight: number | null;
  reps: number | null;
  done: boolean;
};

export type FeelingBefore = {
  energy: number;
  sleep: number;
  soreness: number;
  notes: string;
};

export type FeelingAfter = {
  pump: number;
  fatigue: number;
  mood: number;
  joints?: number;
  notes: string;
};

export type SessionExercise = {
  exerciseId: string;
  sets: LoggedSet[];
  done?: boolean;
};

export type WorkoutSession = {
  date: string;
  dayId: DayKind;
  title: string;
  status: "in_progress" | "completed" | "skipped";
  startedAt: string;
  finishedAt?: string;
  timeOfDay: TimeOfDay;
  feelingBefore: FeelingBefore;
  feelingAfter?: FeelingAfter;
  feelingBeforeSaved?: boolean;
  feelingAfterSaved?: boolean;
  warmup?: WarmupLog;
  exercises: SessionExercise[];
  updatedAt: string;
};

export type LastSets = Record<string, LoggedSet[]>;

export type SessionSummary = {
  date: string;
  dayId: DayKind;
  title: string;
  volume: number;
  durationMin: number;
  completedSets: number;
  plannedSets: number;
  mood?: number;
  pump?: number;
};

export type PersonalRecord = {
  weight: number;
  reps: number;
  date: string;
};

export type LastLoad = {
  weight: number;
  reps: number | null;
  date: string;
};

export type BodyWeight = {
  date: string;
  kg: number;
};

export type AthleteDoc = {
  name: string;
  timezone: string;
  programStartDate: string;
  lastSessionDate: string | null;
  lastSessionStatus: WorkoutSession["status"] | null;
  lastByDay: Partial<Record<DayKind, { date: string; sets: LastSets }>>;
  lastLoads?: Record<string, LastLoad>;
  bodyWeight?: BodyWeight[];
  customExercises?: CustomExercise[];
  pinnedByDay?: Partial<Record<DayKind, PinnedExercise[]>>;
  prs: Record<string, PersonalRecord>;
  recent: SessionSummary[];
  sessionsCompleted: number;
  streak: number;
  updatedAt: string;
};

export type CacheBundle = {
  athlete: AthleteDoc;
  today?: WorkoutSession;
};
