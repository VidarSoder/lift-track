import type { LoggedSet, WorkoutSession } from "@/lib/types";

export type SetLogKind = "work" | "warmup" | "extra";

export type SetLogEntry = {
  date: string;
  dayId: string;
  title: string;
  exerciseId: string;
  kind: SetLogKind;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  done: boolean;
  sessionStatus: WorkoutSession["status"];
  sessionStartedAt: string;
  loggedAt: string;
};

function kindForSet(set: LoggedSet, workIndex: number, plannedWork: number): SetLogKind {
  if (set.warmup) return "warmup";
  if (workIndex >= plannedWork) return "extra";
  return "work";
}

/** Stable id so the same set in a session can be updated without deleting history. */
export function setLogDocId(entry: Pick<
  SetLogEntry,
  "date" | "dayId" | "exerciseId" | "kind" | "setIndex" | "sessionStartedAt"
>) {
  const started = entry.sessionStartedAt.replace(/[:.]/g, "-");
  return [
    entry.date,
    entry.dayId,
    entry.exerciseId,
    entry.kind,
    String(entry.setIndex),
    started,
  ].join("__");
}

export function setLogEntriesFromSession(session: WorkoutSession): SetLogEntry[] {
  const loggedAt = new Date().toISOString();
  const entries: SetLogEntry[] = [];
  for (const exercise of session.exercises) {
    let workIndex = 0;
    let warmupIndex = 0;
    const plannedWork = exercise.sets.filter((set) => !set.warmup).length;
    for (const set of exercise.sets) {
      const kind = kindForSet(set, workIndex, plannedWork);
      const setIndex = set.warmup ? warmupIndex : workIndex;
      if (set.warmup) warmupIndex += 1;
      else workIndex += 1;
      // Keep unfinished placeholders out of the durable log.
      if (!set.done && set.weight == null && set.reps == null) continue;
      entries.push({
        date: session.date,
        dayId: session.dayId,
        title: session.title,
        exerciseId: exercise.exerciseId,
        kind,
        setIndex,
        weight: set.weight,
        reps: set.reps,
        done: set.done,
        sessionStatus: session.status,
        sessionStartedAt: session.startedAt,
        loggedAt,
      });
    }
  }
  return entries;
}

/** Rebuild a session shell from durable setLogs (same-day overwrite recovery). */
export function sessionFromSetLogs(
  entries: SetLogEntry[],
  extras?: Partial<WorkoutSession>,
): WorkoutSession | null {
  if (entries.length === 0) return null;
  const first = entries[0];
  const byExercise = new Map<string, SetLogEntry[]>();
  for (const entry of entries) {
    const bucket = byExercise.get(entry.exerciseId) ?? [];
    bucket.push(entry);
    byExercise.set(entry.exerciseId, bucket);
  }
  const exercises = [...byExercise.entries()].map(([exerciseId, sets]) => {
    const warm = sets
      .filter((set) => set.kind === "warmup")
      .sort((a, b) => a.setIndex - b.setIndex);
    const work = sets
      .filter((set) => set.kind !== "warmup")
      .sort((a, b) => a.setIndex - b.setIndex);
    return {
      exerciseId,
      sets: [
        ...warm.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          done: set.done,
          warmup: true as const,
        })),
        ...work.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          done: set.done,
        })),
      ],
    };
  });
  const startedAt = first.sessionStartedAt;
  return {
    date: first.date,
    dayId: first.dayId as WorkoutSession["dayId"],
    title: first.title,
    status: first.sessionStatus === "skipped" ? "skipped" : "completed",
    startedAt,
    clockStartedAt: startedAt,
    clockEndedAt: extras?.clockEndedAt ?? extras?.finishedAt,
    finishedAt: extras?.finishedAt ?? extras?.clockEndedAt,
    timeOfDay: extras?.timeOfDay ?? "morning",
    feelingBefore: extras?.feelingBefore ?? {
      energy: 3,
      sleep: 3,
      soreness: 2,
      notes: "",
    },
    feelingAfter: extras?.feelingAfter,
    exercises,
    updatedAt: new Date().toISOString(),
    ...extras,
  };
}
