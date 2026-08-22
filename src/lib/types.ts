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
  notes: string;
};

export type SessionExercise = {
  exerciseId: string;
  sets: LoggedSet[];
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

export type AthleteDoc = {
  name: string;
  timezone: string;
  programStartDate: string;
  lastSessionDate: string | null;
  lastSessionStatus: WorkoutSession["status"] | null;
  lastByDay: Partial<Record<DayKind, { date: string; sets: LastSets }>>;
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
