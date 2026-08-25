import type { AthleteDoc, BodyWeight, WorkoutSession } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEIGHT_MIN = 30;
const WEIGHT_MAX = 250;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isDateString(value: unknown) {
  return typeof value === "string" && DATE.test(value);
}

function isFiniteNumber(value: unknown, min?: number, max?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function isBodyWeightEntry(value: unknown): value is BodyWeight {
  if (!isRecord(value)) return false;
  return isDateString(value.date) && isFiniteNumber(value.kg, WEIGHT_MIN, WEIGHT_MAX);
}

function isBodyWeightLog(value: unknown) {
  if (value == null) return true;
  if (!Array.isArray(value) || value.length > 80) return false;
  return value.every(isBodyWeightEntry);
}

function isBikeEntry(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDateString(value.date) &&
    isFiniteNumber(value.minutes, 0, 600) &&
    (value.km == null || isFiniteNumber(value.km, 0, 500)) &&
    (value.kcal == null || isFiniteNumber(value.kcal, 0, 5000)) &&
    (value.level == null || isFiniteNumber(value.level, 0, 30)) &&
    (value.rpm == null || isFiniteNumber(value.rpm, 0, 200))
  );
}

function isLiftPoint(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isDateString(value.date) &&
    typeof value.exerciseId === "string" &&
    value.exerciseId.length > 0 &&
    value.exerciseId.length <= 80 &&
    isFiniteNumber(value.weight, 0, WEIGHT_MAX) &&
    (value.reps == null || isFiniteNumber(value.reps, 0, 500)) &&
    isFiniteNumber(value.sets, 1, 50) &&
    (value.kind == null || value.kind === "work" || value.kind === "warmup")
  );
}

function isLoggedSet(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    (value.weight == null || isFiniteNumber(value.weight, 0, WEIGHT_MAX)) &&
    (value.reps == null || isFiniteNumber(value.reps, 0, 500)) &&
    typeof value.done === "boolean" &&
    (value.warmup == null || typeof value.warmup === "boolean")
  );
}

function isSessionExercise(value: unknown) {
  if (!isRecord(value)) return false;
  if (
    typeof value.exerciseId !== "string" ||
    value.exerciseId.length === 0 ||
    value.exerciseId.length > 80
  ) {
    return false;
  }
  if (!Array.isArray(value.sets) || value.sets.length > 40) return false;
  return value.sets.every(isLoggedSet);
}

export function isAthletePayload(value: unknown): value is AthleteDoc {
  if (!isRecord(value)) return false;
  const data = value as AthleteDoc;
  return (
    typeof data.name === "string" &&
    data.name.length <= 120 &&
    typeof data.timezone === "string" &&
    data.timezone.length <= 80 &&
    isDateString(data.programStartDate) &&
    (data.lastSessionDate == null || isDateString(data.lastSessionDate)) &&
    isFiniteNumber(data.sessionsCompleted, 0, 10000) &&
    isFiniteNumber(data.streak, 0, 10000) &&
    typeof data.updatedAt === "string" &&
    Array.isArray(data.recent) &&
    data.recent.length <= 12 &&
    isBodyWeightLog(data.bodyWeight) &&
    (data.bikeLog == null ||
      (Array.isArray(data.bikeLog) && data.bikeLog.length <= 80 && data.bikeLog.every(isBikeEntry))) &&
    (data.liftLog == null ||
      (Array.isArray(data.liftLog) && data.liftLog.length <= 320 && data.liftLog.every(isLiftPoint))) &&
    (data.customExercises == null ||
      (Array.isArray(data.customExercises) && data.customExercises.length <= 80))
  );
}

export function isSessionPayload(value: unknown): value is WorkoutSession {
  if (!isRecord(value)) return false;
  const data = value as WorkoutSession;
  return (
    isDateString(data.date) &&
    typeof data.dayId === "string" &&
    data.dayId.length <= 40 &&
    typeof data.title === "string" &&
    data.title.length <= 200 &&
    ["in_progress", "completed", "skipped"].includes(data.status) &&
    typeof data.startedAt === "string" &&
    typeof data.updatedAt === "string" &&
    Array.isArray(data.exercises) &&
    data.exercises.length <= 40 &&
    data.exercises.every(isSessionExercise)
  );
}
