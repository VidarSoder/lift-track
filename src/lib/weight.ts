import type { AthleteDoc, BodyWeight } from "@/lib/types";

const MAX_ENTRIES = 80;

export function weightLog(athlete: AthleteDoc): BodyWeight[] {
  return [...(athlete.bodyWeight ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

export function latestWeight(athlete: AthleteDoc) {
  return weightLog(athlete)[0] ?? null;
}

export function upsertBodyWeight(athlete: AthleteDoc, entry: BodyWeight): AthleteDoc {
  const kg = Math.max(30, Math.min(250, Number(entry.kg.toFixed(1))));
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
