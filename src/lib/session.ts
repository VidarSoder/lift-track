import { upsertBikeStats } from "@/lib/bike";
import { mergeLiftLog } from "@/lib/lifts";
import { spanMs } from "@/lib/session-timer";
import { ATHLETE_NAME } from "@/data/program";
import { currentTimeOfDay, formatDateISO } from "@/lib/dates";
import type {
  AthleteDoc,
  DayKind,
  LastLoad,
  LoggedSet,
  PersonalRecord,
  PinnedExercise,
  ProgramDay,
  SessionExercise,
  SessionSummary,
  WorkoutSession,
} from "@/lib/types";

export function emptyFeeling() {
  return { energy: 3, sleep: 3, soreness: 2, notes: "" };
}

export function emptyAfter() {
  return { pump: 3, fatigue: 3, mood: 3, joints: 2, notes: "" };
}

export function blankSets(count: number): LoggedSet[] {
  return Array.from({ length: count }, () => ({
    weight: null,
    reps: null,
    done: false,
  }));
}

export function isWarmupSet(set: LoggedSet) {
  return Boolean(set.warmup);
}

export function workingSets(sets: LoggedSet[]) {
  return sets.filter((set) => !set.warmup);
}

export function warmupSets(sets: LoggedSet[]) {
  return sets.filter((set) => set.warmup);
}

export function insertWarmupSet(sets: LoggedSet[], warmup: LoggedSet): LoggedSet[] {
  return [...warmupSets(sets), { ...warmup, warmup: true }, ...workingSets(sets)];
}

function roundToStep(value: number, step: number) {
  if (step <= 0) return Number(value.toFixed(1));
  return Number((Math.round(value / step) * step).toFixed(1));
}

export function suggestedWarmup(
  workKg: number | null,
  existing: LoggedSet[],
  step: number,
): { weight: number; reps: number } {
  const warm = warmupSets(existing);
  if (workKg === 0) {
    return { weight: 0, reps: warm.length === 0 ? 5 : 3 };
  }
  const target = workKg != null && workKg > 0 ? workKg : 20;
  const last = [...warm].reverse().find((set) => set.weight != null)?.weight;
  const fractions = [0.5, 0.7, 0.85];
  const nextFraction = fractions[Math.min(warm.length, fractions.length - 1)];
  let weight =
    last != null
      ? Math.max(last + step, target * nextFraction)
      : target * (fractions[0] ?? 0.5);
  const ceiling = workKg != null && workKg > step ? workKg - step : weight;
  weight = Math.max(step, Math.min(weight, ceiling));
  return {
    weight: roundToStep(weight, step),
    reps: warm.length === 0 ? 8 : 5,
  };
}

export const SESSION_REOPEN_MS = 24 * 60 * 60 * 1000;

export function sessionClosedAt(session: WorkoutSession) {
  return new Date(
    session.finishedAt ?? session.clockEndedAt ?? session.startedAt,
  ).getTime();
}

export function canReopenSession(
  session?: WorkoutSession | null,
  now = Date.now(),
) {
  if (!session || session.status !== "completed") return false;
  return now - sessionClosedAt(session) <= SESSION_REOPEN_MS;
}

export function isLiveSession(
  session?: WorkoutSession | null,
  today = formatDateISO(),
  now = Date.now(),
) {
  if (!session || session.status === "skipped") return false;
  if (session.date === today) return true;
  if (session.status === "in_progress") return true;
  return canReopenSession(session, now);
}

export function reopenSession(session: WorkoutSession): WorkoutSession {
  const elapsed = session.clockStartedAt
    ? spanMs(
        session.clockStartedAt,
        session.clockEndedAt ?? session.finishedAt ?? new Date().toISOString(),
      )
    : 0;
  return {
    ...session,
    status: "in_progress",
    finishedAt: undefined,
    clockStartedAt: new Date(Date.now() - Math.max(0, elapsed)).toISOString(),
    clockEndedAt: undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function applyReopenedSession(
  athlete: AthleteDoc,
  session: WorkoutSession,
): AthleteDoc {
  const wasLogged = athlete.recent.some(
    (item) => item.date === session.date && item.dayId === session.dayId,
  );
  return {
    ...athlete,
    lastSessionDate: session.date,
    lastSessionStatus: "in_progress",
    recent: athlete.recent.filter(
      (item) => !(item.date === session.date && item.dayId === session.dayId),
    ),
    sessionsCompleted: wasLogged
      ? Math.max(0, athlete.sessionsCompleted - 1)
      : athlete.sessionsCompleted,
    updatedAt: new Date().toISOString(),
  };
}

export function createSession(
  day: ProgramDay,
  date = formatDateISO(),
  extras: PinnedExercise[] = [],
): WorkoutSession {
  const seen = new Set(day.exercises.map((exercise) => exercise.id));
  const extraLifts = extras.filter((item) => !seen.has(item.exerciseId));
  const startedAt = new Date().toISOString();
  return {
    date,
    dayId: day.id,
    title: day.title,
    status: "in_progress",
    startedAt,
    clockStartedAt: startedAt,
    timeOfDay: currentTimeOfDay(),
    feelingBefore: emptyFeeling(),
    exercises: [
      ...day.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        sets: blankSets(exercise.sets),
      })),
      ...extraLifts.map((item) => ({
        exerciseId: item.exerciseId,
        sets: blankSets(item.sets),
      })),
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function createAthlete(startDate = formatDateISO()): AthleteDoc {
  return {
    name: ATHLETE_NAME,
    timezone: "Europe/Stockholm",
    programStartDate: startDate,
    lastSessionDate: null,
    lastSessionStatus: null,
    lastByDay: {},
    lastLoads: {},
    bodyWeight: [],
    bikeLog: [],
    liftLog: [],
    customExercises: [],
    pinnedByDay: {},
    prs: {},
    recent: [],
    sessionsCompleted: 0,
    streak: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function sessionVolume(session: WorkoutSession) {
  return session.exercises.reduce((sum, exercise) => {
    return (
      sum +
      workingSets(exercise.sets).reduce((inner, set) => {
        if (!set.done || !set.weight || !set.reps) return inner;
        return inner + set.weight * set.reps;
      }, 0)
    );
  }, 0);
}

export function sessionHasProgress(session: WorkoutSession) {
  if (session.feelingBeforeSaved || session.feelingAfterSaved) return true;
  if (session.bikeStats) return true;
  if (session.warmup?.done) return true;
  return session.exercises.some(
    (exercise) =>
      Boolean(exercise.done) ||
      exercise.sets.some((set) => set.done || set.warmup),
  );
}

export function sessionSetCounts(session: WorkoutSession) {
  const plannedSets = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const completedSets = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
    0,
  );
  return { plannedSets, completedSets };
}

export function liftIsDone(exercise: SessionExercise) {
  if (exercise.done) return true;
  const work = workingSets(exercise.sets);
  return work.length > 0 && work.every((set) => set.done);
}

export function lastSetsFromSession(session: WorkoutSession) {
  return Object.fromEntries(
    session.exercises.map((exercise) => [exercise.exerciseId, exercise.sets]),
  );
}

function isNextCalendarDay(prev: string, next: string) {
  const a = new Date(`${prev}T12:00:00Z`).getTime();
  const b = new Date(`${next}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000) === 1;
}

export function summarizeSession(session: WorkoutSession): SessionSummary {
  const { plannedSets, completedSets } = sessionSetCounts(session);
  const started = new Date(session.clockStartedAt ?? session.startedAt).getTime();
  const finished = session.clockEndedAt
    ? new Date(session.clockEndedAt).getTime()
    : session.finishedAt
      ? new Date(session.finishedAt).getTime()
      : Date.now();
  return {
    date: session.date,
    dayId: session.dayId,
    title: session.title,
    volume: Math.round(sessionVolume(session)),
    durationMin: Math.max(1, Math.round((finished - started) / 60000)),
    completedSets,
    plannedSets,
    mood: session.feelingAfter?.mood,
    pump: session.feelingAfter?.pump,
  };
}

export function stripTodaysProgress(athlete: AthleteDoc, today: string) {
  const lastLoads = { ...(athlete.lastLoads ?? {}) };
  for (const [id, load] of Object.entries(lastLoads)) {
    if (load.date === today) delete lastLoads[id];
  }
  const lastByDay = { ...athlete.lastByDay };
  for (const key of Object.keys(lastByDay) as DayKind[]) {
    if (lastByDay[key]?.date === today) delete lastByDay[key];
  }
  return {
    ...athlete,
    lastLoads,
    lastByDay,
    bikeLog: (athlete.bikeLog ?? []).filter((item) => item.date !== today),
    liftLog: (athlete.liftLog ?? []).filter((item) => item.date !== today),
    lastSessionStatus: "skipped" as const,
    updatedAt: new Date().toISOString(),
  } satisfies AthleteDoc;
}

export function cancelWorkout(
  athlete: AthleteDoc,
  session: WorkoutSession,
  keepProgress: boolean,
) {
  const closed: WorkoutSession = {
    ...session,
    status: "skipped",
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: keepProgress && sessionHasProgress(session) ? session.exercises : [],
  };
  if (!sessionHasProgress(session)) {
    return {
      athlete: {
        ...athlete,
        lastSessionStatus: "skipped" as const,
        updatedAt: closed.updatedAt,
      },
      today: closed,
    };
  }
  const nextAthlete = keepProgress
    ? rememberProgress(athlete, closed)
    : stripTodaysProgress(athlete, session.date);
  return {
    athlete: { ...nextAthlete, lastSessionStatus: "skipped" as const },
    today: closed,
  };
}

export function rememberProgress(athlete: AthleteDoc, session: WorkoutSession) {
  const remembered = mergeLiftLog(
    {
      ...athlete,
      lastSessionDate: session.date,
      lastSessionStatus: session.status,
      lastByDay: {
        ...athlete.lastByDay,
        [session.dayId]: {
          date: session.date,
          sets: lastSetsFromSession(session),
        },
      },
      lastLoads: mergeLoads(athlete.lastLoads, session),
      updatedAt: new Date().toISOString(),
    },
    session,
  );
  return session.bikeStats
    ? upsertBikeStats(remembered, { ...session.bikeStats, date: session.date })
    : remembered;
}

export function applyCompletedSession(athlete: AthleteDoc, session: WorkoutSession) {
  const prs: Record<string, PersonalRecord> = { ...athlete.prs };
  if (session.dayId !== "warmup") {
    for (const exercise of session.exercises) {
      for (const set of workingSets(exercise.sets)) {
        if (!set.done || !set.weight || !set.reps) continue;
        const current = prs[exercise.exerciseId];
        if (
          !current ||
          set.weight > current.weight ||
          (set.weight === current.weight && set.reps > current.reps)
        ) {
          prs[exercise.exerciseId] = {
            weight: set.weight,
            reps: set.reps,
            date: session.date,
          };
        }
      }
    }
  }

  const summary = summarizeSession(session);
  const recent = [
    summary,
    ...athlete.recent.filter(
      (item) => !(item.date === session.date && item.dayId === session.dayId),
    ),
  ].slice(0, 12);

  const alreadyToday = athlete.recent.some(
    (item) => item.date === session.date && item.dayId === session.dayId,
  );
  const lastDate = athlete.lastSessionDate;
  const streak =
    session.status === "completed"
      ? lastDate && isNextCalendarDay(lastDate, session.date)
        ? athlete.streak + 1
        : lastDate === session.date
          ? athlete.streak
          : 1
      : athlete.streak;

  const completed = mergeLiftLog(
    {
      ...athlete,
      lastSessionDate: session.date,
      lastSessionStatus: session.status,
      lastByDay: {
        ...athlete.lastByDay,
        [session.dayId]: {
          date: session.date,
          sets: lastSetsFromSession(session),
        },
      },
      lastLoads: mergeLoads(athlete.lastLoads, session),
      prs,
      recent,
      sessionsCompleted:
        session.status === "completed" && !alreadyToday
          ? athlete.sessionsCompleted + 1
          : athlete.sessionsCompleted,
      streak,
      updatedAt: new Date().toISOString(),
    },
    session,
  );
  return session.bikeStats
    ? upsertBikeStats(completed, { ...session.bikeStats, date: session.date })
    : completed;
}

function rawPreviousSets(athlete: AthleteDoc, dayId: DayKind, exerciseId: string) {
  return athlete.lastByDay[dayId]?.sets[exerciseId] ?? [];
}

export function previousSets(athlete: AthleteDoc, dayId: DayKind, exerciseId: string) {
  const fromDay = workingSets(rawPreviousSets(athlete, dayId, exerciseId));
  if (fromDay.some((set) => set.weight != null)) return fromDay;
  const load = lastLoad(athlete, exerciseId);
  if (!load) return [];
  return [{ weight: load.weight, reps: load.reps, done: false }];
}

export function previousWarmupSets(
  athlete: AthleteDoc,
  dayId: DayKind,
  exerciseId: string,
) {
  return warmupSets(rawPreviousSets(athlete, dayId, exerciseId));
}

const CARDIO_LOAD_IDS = {
  bike: ["bike", "bike-easy-8", "bike-ramp-10", "bike-hard-then-easy"],
  run: ["run", "run-7-then-4", "run-easy-8", "run-walk-jog"],
  walk: ["walk", "walk-easy", "walk-easy-10", "walk-easy-30"],
} as const;

export function lastCardioLoad(
  athlete: AthleteDoc,
  kind: keyof typeof CARDIO_LOAD_IDS,
): LastLoad | null {
  for (const id of CARDIO_LOAD_IDS[kind]) {
    const load = lastLoad(athlete, id);
    if (!load) continue;
    if (kind === "walk" && load.weight != null && load.weight > 12) {
      return { ...load, weight: 5, reps: load.reps ?? load.weight };
    }
    return load;
  }
  return null;
}

export function lastBikeLoad(athlete: AthleteDoc): LastLoad | null {
  return lastCardioLoad(athlete, "bike");
}

export function lastLoad(athlete: AthleteDoc, exerciseId: string): LastLoad | null {
  const stored = athlete.lastLoads?.[exerciseId];
  if (stored && stored.weight != null) return stored;
  for (const day of Object.values(athlete.lastByDay)) {
    const done = [...(day?.sets[exerciseId] ?? [])]
      .reverse()
      .find((set) => set.done && !set.warmup && set.weight != null);
    if (done?.weight != null && day) {
      return { weight: done.weight, reps: done.reps, date: day.date };
    }
  }
  const pr = athlete.prs[exerciseId];
  if (pr) return { weight: pr.weight, reps: pr.reps, date: pr.date };
  return null;
}

export function forgetTodaysLift(
  athlete: AthleteDoc,
  exerciseId: string,
  date: string,
): AthleteDoc {
  const lastLoads = { ...(athlete.lastLoads ?? {}) };
  if (lastLoads[exerciseId]?.date === date) {
    delete lastLoads[exerciseId];
  }
  return {
    ...athlete,
    lastLoads,
    liftLog: (athlete.liftLog ?? []).filter(
      (point) => !(point.date === date && point.exerciseId === exerciseId),
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function mergeLoads(
  current: AthleteDoc["lastLoads"],
  session: WorkoutSession,
) {
  const next: Record<string, LastLoad> = { ...(current ?? {}) };
  for (const exercise of session.exercises) {
    const done = [...exercise.sets]
      .reverse()
      .find((set) => set.done && !set.warmup && set.weight != null);
    if (done?.weight == null) continue;
    next[exercise.exerciseId] = {
      weight: done.weight,
      reps: done.reps,
      date: session.date,
    };
  }
  return next;
}

export function startWorkoutClock(session: WorkoutSession): WorkoutSession {
  if (session.clockStartedAt && session.clockEndedAt) {
    const elapsed = spanMs(session.clockStartedAt, session.clockEndedAt);
    return {
      ...session,
      clockStartedAt: new Date(Date.now() - elapsed).toISOString(),
      clockEndedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    ...session,
    clockStartedAt: new Date().toISOString(),
    clockEndedAt: undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function stopWorkoutClock(session: WorkoutSession): WorkoutSession {
  if (!session.clockStartedAt || session.clockEndedAt) return session;
  return {
    ...session,
    clockEndedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function resetWorkoutClock(session: WorkoutSession): WorkoutSession {
  const now = new Date().toISOString();
  return {
    ...session,
    clockStartedAt: now,
    clockEndedAt: now,
    updatedAt: now,
  };
}
