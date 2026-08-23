import { cardioUnits, warmupById } from "@/data/warmup";
import { resolveExercise } from "@/lib/exercises";
import type { AthleteDoc, LiftPoint, WorkoutSession } from "@/lib/types";

const MAX_TOTAL = 240;
const MAX_PER_LIFT = 16;

export function liftUnit(exerciseId: string, athlete: AthleteDoc) {
  const preset = warmupById(exerciseId);
  const exercise = resolveExercise(exerciseId, athlete);
  if (preset?.kind === "walk" || exercise.group === "Walk") return "min";
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
  sets: { weight: number | null; reps: number | null; done: boolean }[],
): LiftPoint | null {
  const done = sets.filter((set) => set.done);
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
  if (!weight) return null;
  return {
    date,
    exerciseId,
    weight,
    reps: unit === "min" ? null : best.reps,
    sets: done.length,
    unit,
  };
}

export function mergeLiftLog(athlete: AthleteDoc, session: WorkoutSession): AthleteDoc {
  const incoming = session.exercises
    .map((exercise) =>
      pointFromSets(athlete, session.date, exercise.exerciseId, exercise.sets),
    )
    .filter((point): point is LiftPoint => point != null);
  if (incoming.length === 0) return athlete;

  const kept = liftLog(athlete).filter(
    (point) =>
      !(
        point.date === session.date &&
        incoming.some((item) => item.exerciseId === point.exerciseId)
      ),
  );
  const next = [...incoming, ...kept]
    .sort((a, b) => b.date.localeCompare(a.date))
    .reduce<LiftPoint[]>((list, point) => {
      const count = list.filter((item) => item.exerciseId === point.exerciseId).length;
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
    if (!load.weight) continue;
    points.push({
      date: load.date,
      exerciseId,
      weight: load.weight,
      reps: load.reps,
      sets: 1,
      unit: liftUnit(exerciseId, athlete),
    });
  }
  return points.sort((a, b) => b.date.localeCompare(a.date));
}

export function liftsByExercise(athlete: AthleteDoc) {
  const groups = new Map<string, LiftPoint[]>();
  for (const point of inferredLiftLog(athlete)) {
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
        last,
        previous,
        delta: previous ? Number((last.weight - previous.weight).toFixed(1)) : null,
        points: chronological,
      };
    })
    .sort((a, b) => b.last.date.localeCompare(a.last.date) || a.name.localeCompare(b.name));
}

export function formatLiftPoint(point: LiftPoint) {
  if (point.unit === "min") return `${point.weight} min`;
  if (point.reps) return `${point.weight} ${point.unit ?? "kg"} × ${point.reps}`;
  return `${point.weight} ${point.unit ?? "kg"}`;
}
