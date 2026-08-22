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

export function createSession(
  day: ProgramDay,
  date = formatDateISO(),
  extras: PinnedExercise[] = [],
): WorkoutSession {
  const seen = new Set(day.exercises.map((exercise) => exercise.id));
  const extraLifts = extras.filter((item) => !seen.has(item.exerciseId));
  return {
    date,
    dayId: day.id,
    title: day.title,
    status: "in_progress",
    startedAt: new Date().toISOString(),
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
      exercise.sets.reduce((inner, set) => {
        if (!set.done || !set.weight || !set.reps) return inner;
        return inner + set.weight * set.reps;
      }, 0)
    );
  }, 0);
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
  return exercise.sets.length > 0 && exercise.sets.every((set) => set.done);
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
  const started = new Date(session.startedAt).getTime();
  const finished = session.finishedAt
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
    exercises: keepProgress ? session.exercises : [],
  };
  const nextAthlete = keepProgress
    ? rememberProgress(athlete, closed)
    : stripTodaysProgress(athlete, session.date);
  return {
    athlete: { ...nextAthlete, lastSessionStatus: "skipped" as const },
    today: closed,
  };
}

export function rememberProgress(athlete: AthleteDoc, session: WorkoutSession) {
  return {
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
  } satisfies AthleteDoc;
}

export function applyCompletedSession(athlete: AthleteDoc, session: WorkoutSession) {
  const prs: Record<string, PersonalRecord> = { ...athlete.prs };
  if (session.dayId !== "warmup") {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (!set.done || !set.weight || !set.reps) continue;
        const current = prs[exercise.exerciseId];
        if (!current || set.weight > current.weight) {
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

  return {
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
  } satisfies AthleteDoc;
}

export function previousSets(athlete: AthleteDoc, dayId: DayKind, exerciseId: string) {
  const fromDay = athlete.lastByDay[dayId]?.sets[exerciseId];
  if (fromDay?.some((set) => set.weight != null)) return fromDay;
  const load = lastLoad(athlete, exerciseId);
  if (!load) return [];
  return [{ weight: load.weight, reps: load.reps, done: false }];
}

export function lastLoad(athlete: AthleteDoc, exerciseId: string): LastLoad | null {
  const stored = athlete.lastLoads?.[exerciseId];
  if (stored?.weight) return stored;
  for (const day of Object.values(athlete.lastByDay)) {
    const done = [...(day?.sets[exerciseId] ?? [])]
      .reverse()
      .find((set) => set.done && set.weight != null);
    if (done?.weight != null && day) {
      return { weight: done.weight, reps: done.reps, date: day.date };
    }
  }
  const pr = athlete.prs[exerciseId];
  if (pr) return { weight: pr.weight, reps: pr.reps, date: pr.date };
  return null;
}

export function mergeLoads(
  current: AthleteDoc["lastLoads"],
  session: WorkoutSession,
) {
  const next: Record<string, LastLoad> = { ...(current ?? {}) };
  for (const exercise of session.exercises) {
    const done = [...exercise.sets]
      .reverse()
      .find((set) => set.done && set.weight != null);
    if (done?.weight == null) continue;
    next[exercise.exerciseId] = {
      weight: done.weight,
      reps: done.reps,
      date: session.date,
    };
  }
  return next;
}
