import { cardioUnits, warmupById } from "@/data/warmup";
import { resolveExercise } from "@/lib/exercises";
import type { AthleteDoc, LiftPoint, LoggedSet, WorkoutSession } from "@/lib/types";

const MAX_TOTAL = 320;
const MAX_PER_LIFT = 20;

export function liftUnit(exerciseId: string, athlete: AthleteDoc) {
  const preset = warmupById(exerciseId);
  const exercise = resolveExercise(exerciseId, athlete);
  if (preset?.kind === "walk" || exercise.group === "Walk") return "km/h";
  if (preset?.kind === "run" || exercise.group === "Run") return "km/h";
  if (preset?.kind === "bike" || exercise.group === "Bike") return "lvl";
  if (preset?.kind === "mobility" || exercise.group === "Mobility") return "min";
  return cardioUnits(exercise.group).load;
}

export function liftLog(athlete: AthleteDoc): LiftPoint[] {
  return [...(athlete.liftLog ?? [])].sort((a, b) => {
    const dates = b.date.localeCompare(a.date);
    if (dates !== 0) return dates;
    return a.exerciseId.localeCompare(b.exerciseId);
  });
}

function pointFromSets(
  athlete: AthleteDoc,
  date: string,
  exerciseId: string,
  sets: LoggedSet[],
  kind: "work" | "warmup",
): LiftPoint | null {
  const done = sets.filter((set) =>
    set.done && (kind === "warmup" ? Boolean(set.warmup) : !set.warmup),
  );
  if (done.length === 0) return null;
  const unit = liftUnit(exerciseId, athlete);
  const ranked = [...done].sort((a, b) => {
    const weight = (b.weight ?? 0) - (a.weight ?? 0);
    if (weight !== 0) return weight;
    return (b.reps ?? 0) - (a.reps ?? 0);
  });
  const best = ranked[0];
  const weight =
    unit === "min" ? (best.reps ?? best.weight ?? 0) : (best.weight ?? 0);
  if (unit === "min" && !weight) return null;
  if (unit !== "min" && best.weight == null) return null;
  return {
    date,
    exerciseId,
    weight,
    reps: unit === "min" ? null : best.reps,
    sets: done.length,
    unit,
    kind,
  };
}

export function mergeLiftLog(athlete: AthleteDoc, session: WorkoutSession): AthleteDoc {
  const incoming = session.exercises.flatMap((exercise) => {
    const work = pointFromSets(
      athlete,
      session.date,
      exercise.exerciseId,
      exercise.sets,
      "work",
    );
    const warmup = pointFromSets(
      athlete,
      session.date,
      exercise.exerciseId,
      exercise.sets,
      "warmup",
    );
    return [work, warmup].filter((point): point is LiftPoint => point != null);
  });
  if (incoming.length === 0) return athlete;

  const kept = liftLog(athlete).filter(
    (point) =>
      !(
        point.date === session.date &&
        incoming.some(
          (item) =>
            item.exerciseId === point.exerciseId &&
            (item.kind ?? "work") === (point.kind ?? "work"),
        )
      ),
  );
  const next = [...incoming, ...kept]
    .sort((a, b) => b.date.localeCompare(a.date))
    .reduce<LiftPoint[]>((list, point) => {
      const count = list.filter(
        (item) =>
          item.exerciseId === point.exerciseId &&
          (item.kind ?? "work") === (point.kind ?? "work"),
      ).length;
      if (count >= MAX_PER_LIFT) return list;
      list.push(point);
      return list;
    }, [])
    .slice(0, MAX_TOTAL);

  return {
    ...athlete,
    liftLog: next,
    updatedAt: new Date().toISOString(),
  };
}

export function inferredLiftLog(athlete: AthleteDoc): LiftPoint[] {
  const stored = liftLog(athlete);
  if (stored.length > 0) return stored;
  const points: LiftPoint[] = [];
  for (const [exerciseId, load] of Object.entries(athlete.lastLoads ?? {})) {
    if (load.weight == null) continue;
    points.push({
      date: load.date,
      exerciseId,
      weight: load.weight,
      reps: load.reps,
      sets: 1,
      unit: liftUnit(exerciseId, athlete),
      kind: "work",
    });
  }
  return points.sort((a, b) => b.date.localeCompare(a.date));
}

function groupLiftPoints(athlete: AthleteDoc, kind: "work" | "warmup") {
  const groups = new Map<string, LiftPoint[]>();
  for (const point of inferredLiftLog(athlete)) {
    if ((point.kind ?? "work") !== kind) continue;
    const bucket = groups.get(point.exerciseId) ?? [];
    bucket.push(point);
    groups.set(point.exerciseId, bucket);
  }
  return [...groups.entries()]
    .map(([exerciseId, points]) => {
      const chronological = [...points].sort((a, b) => a.date.localeCompare(b.date));
      const last = chronological[chronological.length - 1];
      const previous = chronological[chronological.length - 2];
      const exercise = resolveExercise(exerciseId, athlete);
      return {
        exerciseId,
        name: exercise.name,
        group: exercise.group,
        unit: last.unit ?? "kg",
        kind,
        last,
        previous,
        delta: previous ? Number((last.weight - previous.weight).toFixed(1)) : null,
        points: chronological,
      };
    })
    .sort((a, b) => b.last.date.localeCompare(a.last.date) || a.name.localeCompare(b.name));
}

export function liftsByExercise(athlete: AthleteDoc) {
  return groupLiftPoints(athlete, "work");
}

export function warmupsByExercise(athlete: AthleteDoc) {
  return groupLiftPoints(athlete, "warmup");
}

export function formatLiftPoint(point: LiftPoint) {
  if (point.unit === "min") return `${point.weight} min`;
  if (point.weight === 0) {
    return point.reps ? `BW × ${point.reps}` : "BW";
  }
  if (point.reps) return `${point.weight} ${point.unit ?? "kg"} × ${point.reps}`;
  return `${point.weight} ${point.unit ?? "kg"}`;
}
