import type { AthleteDoc, BikeStats } from "@/lib/types";

const MAX_ENTRIES = 80;

export function parseStat(raw: string) {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function bikeLog(athlete: AthleteDoc): BikeStats[] {
  return [...(athlete.bikeLog ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

export function latestBike(athlete: AthleteDoc) {
  return bikeLog(athlete)[0] ?? null;
}

export function cleanBikeStats(entry: BikeStats): BikeStats | null {
  const minutes = Math.min(180, Math.max(0, Number((entry.minutes ?? 0).toFixed(0))));
  const km =
    entry.km == null ? undefined : Math.min(80, Math.max(0, Number(entry.km.toFixed(2))));
  const kcal =
    entry.kcal == null ? undefined : Math.min(2000, Math.max(0, Math.round(entry.kcal)));
  const level =
    entry.level == null ? undefined : Math.min(30, Math.max(0, Math.round(entry.level)));
  const rpm =
    entry.rpm == null ? undefined : Math.min(200, Math.max(0, Math.round(entry.rpm)));
  if (!minutes && !km && !kcal) return null;
  return {
    date: entry.date,
    minutes: minutes || Math.round((km ?? 0) * 5) || 1,
    ...(km != null ? { km } : {}),
    ...(kcal != null ? { kcal } : {}),
    ...(level != null ? { level } : {}),
    ...(rpm != null ? { rpm } : {}),
  };
}

export function upsertBikeStats(athlete: AthleteDoc, entry: BikeStats): AthleteDoc {
  const cleaned = cleanBikeStats(entry);
  if (!cleaned) return athlete;
  const next = [
    cleaned,
    ...bikeLog(athlete).filter((item) => item.date !== cleaned.date),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ENTRIES);

  return {
    ...athlete,
    bikeLog: next,
    updatedAt: new Date().toISOString(),
  };
}

export function removeBikeStats(athlete: AthleteDoc, date: string): AthleteDoc {
  return {
    ...athlete,
    bikeLog: bikeLog(athlete).filter((item) => item.date !== date),
    updatedAt: new Date().toISOString(),
  };
}

export function bikeDelta(athlete: AthleteDoc) {
  const log = [...bikeLog(athlete)].reverse();
  if (log.length < 2) return null;
  const first = log[0];
  const last = log[log.length - 1];
  return {
    from: first,
    to: last,
    minutes: last.minutes - first.minutes,
    km: Number(((last.km ?? 0) - (first.km ?? 0)).toFixed(2)),
  };
}

export function formatBikeLine(entry: BikeStats) {
  const parts = [`${entry.minutes} min`];
  if (entry.km != null) parts.push(`${entry.km} km`);
  if (entry.kcal != null) parts.push(`${entry.kcal} kcal`);
  if (entry.level != null) parts.push(`lvl ${entry.level}`);
  if (entry.rpm != null) parts.push(`${entry.rpm} rpm`);
  return parts.join(" · ");
}
