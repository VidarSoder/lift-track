import { DAYS, dayById } from "@/data/program";
import { formatDateISO } from "@/lib/dates";
import type { AthleteDoc, DayKind } from "@/lib/types";

const LIFTS = DAYS.filter((day) => day.exercises.length > 0);

function daysSince(iso: string | undefined, today = formatDateISO()) {
  if (!iso) return 99;
  const a = new Date(`${iso}T12:00:00Z`).getTime();
  const b = new Date(`${today}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function lastDone(athlete: AthleteDoc, id: DayKind) {
  return athlete.lastByDay[id]?.date ?? athlete.recent.find((item) => item.dayId === id)?.date;
}

export function suggestWorkout(athlete: AthleteDoc) {
  const recent = athlete.recent.slice(0, 6);
  const counts = Object.fromEntries(LIFTS.map((day) => [day.id, 0])) as Record<DayKind, number>;
  for (const item of recent) {
    counts[item.dayId] = (counts[item.dayId] ?? 0) + 1;
  }

  const lastTwo = recent.slice(0, 2).map((item) => item.dayId);
  const upperHeavy = lastTwo.every((id) =>
    ["push", "arms", "shoulders"].includes(id),
  );

  const ranked = LIFTS.map((day) => {
    const age = daysSince(lastDone(athlete, day.id));
    let score = age * 2 - (counts[day.id] ?? 0) * 3;
    if (upperHeavy && day.id === "legs") score += 8;
    if (upperHeavy && day.id === "pull") score += 5;
    if (lastTwo[0] === day.id) score -= 6;
    if (day.id === "warmup" || day.id === "stretch") score -= 8;
    return { day, age, score };
  }).sort((a, b) => b.score - a.score);

  const pick = ranked[0]?.day ?? LIFTS[0];
  const reason = suggestionCopy(athlete, pick.id, lastTwo, counts);
  return { workout: pick, reason };
}

function suggestionCopy(
  athlete: AthleteDoc,
  pick: DayKind,
  lastTwo: DayKind[],
  counts: Record<DayKind, number>,
) {
  const chosen = dayById(pick);
  if (lastTwo[0] === "arms" && pick !== "arms") {
    return `Arms were last. ${chosen?.title.split("·")[0].trim()} gives them a rest while you still train.`;
  }
  if ((counts.arms ?? 0) + (counts.push ?? 0) + (counts.shoulders ?? 0) >= 3 && pick === "legs") {
    return "Upper body has been getting most of the work. Legs would even it out.";
  }
  if ((counts.legs ?? 0) === 0 && pick === "legs") {
    return "No legs in the recent log. Worth doing if you have the energy.";
  }
  if (!athlete.recent.length) {
    return "Nothing logged yet. Pick whatever you want to do — this is only a starting point.";
  }
  return `${chosen?.title.split("·")[0].trim()} is the one you have done least lately.`;
}

export function workoutCatalog() {
  return LIFTS;
}
