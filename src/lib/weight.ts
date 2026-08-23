import type { AthleteDoc, BodyWeight } from "@/lib/types";

const MAX_ENTRIES = 80;
export const WEIGHT_MIN_KG = 30;
export const WEIGHT_MAX_KG = 250;

export function clampKg(value: number) {
  return Math.max(WEIGHT_MIN_KG, Math.min(WEIGHT_MAX_KG, Number(value.toFixed(1))));
}

export function parseKgInput(raw: string) {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return clampKg(value);
}

export function weighInSliderBounds(kg: number) {
  return {
    min: Math.min(50, Math.max(WEIGHT_MIN_KG, Math.floor(kg) - 5)),
    max: Math.max(140, Math.min(WEIGHT_MAX_KG, Math.ceil(kg) + 5)),
  };
}

export function weightLog(athlete: AthleteDoc): BodyWeight[] {
  return [...(athlete.bodyWeight ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

export function latestWeight(athlete: AthleteDoc) {
  return weightLog(athlete)[0] ?? null;
}

export function bodyWeightForDate(athlete: AthleteDoc, date: string) {
  return weightLog(athlete).find((item) => item.date === date) ?? null;
}

export function upsertBodyWeight(athlete: AthleteDoc, entry: BodyWeight): AthleteDoc {
  const kg = clampKg(entry.kg);
  const next = [
    { date: entry.date, kg },
    ...weightLog(athlete).filter((item) => item.date !== entry.date),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ENTRIES);

  return {
    ...athlete,
    bodyWeight: next,
    updatedAt: new Date().toISOString(),
  };
}

export function removeBodyWeight(athlete: AthleteDoc, date: string): AthleteDoc {
  return {
    ...athlete,
    bodyWeight: weightLog(athlete).filter((item) => item.date !== date),
    updatedAt: new Date().toISOString(),
  };
}

export function weightDelta(athlete: AthleteDoc) {
  const log = [...weightLog(athlete)].reverse();
  if (log.length < 2) return null;
  const first = log[0];
  const last = log[log.length - 1];
  return {
    from: first,
    to: last,
    kg: Number((last.kg - first.kg).toFixed(1)),
  };
}
