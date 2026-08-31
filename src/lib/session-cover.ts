import { dayById } from "@/data/program";
import { mediaFor } from "@/data/media";
import { isStretchDay } from "@/lib/session";
import type { AthleteDoc, SessionSummary } from "@/lib/types";

/** Pick a representative lift photo for a session kind. */
export function sessionCoverExerciseId(dayId: string) {
  const day = dayById(dayId);
  if (!day?.exercises.length) return null;
  const withMedia = day.exercises.find((exercise) => mediaFor(exercise.id));
  return (withMedia ?? day.exercises[0]).id;
}

export type SessionBadge = {
  label: string;
  tone: "gold" | "mint" | "fire" | "sky" | "sand" | "primary";
};

export function sessionEventBadges(
  summary: SessionSummary,
  athlete: AthleteDoc,
  opts: {
    maxVolume: number;
    sameDayCount: number;
    canReopen: boolean;
  },
): SessionBadge[] {
  const badges: SessionBadge[] = [];

  if (isStretchDay(summary.dayId)) {
    badges.push({ label: "Stretch", tone: "mint" });
  } else if (summary.dayId === "warmup") {
    badges.push({ label: "Warm-up", tone: "sky" });
  }

  const prHits = Object.values(athlete.prs).filter(
    (pr) => pr.date === summary.date,
  ).length;
  if (prHits > 0 && !isStretchDay(summary.dayId)) {
    badges.push({
      label: prHits === 1 ? "PR day" : `${prHits} PRs`,
      tone: "gold",
    });
  }

  if (
    summary.volume > 0 &&
    opts.maxVolume > 0 &&
    summary.volume >= opts.maxVolume * 0.85
  ) {
    badges.push({ label: "Heavy day", tone: "fire" });
  }

  if (
    summary.plannedSets > 0 &&
    summary.completedSets >= summary.plannedSets &&
    summary.completedSets >= 6
  ) {
    badges.push({ label: "Full card", tone: "sand" });
  }

  if (opts.sameDayCount > 1) {
    badges.push({ label: "Double day", tone: "sky" });
  }

  if (opts.canReopen) {
    badges.push({ label: "Fresh", tone: "primary" });
  }

  return badges.slice(0, 3);
}

export function sessionShortTitle(summary: SessionSummary) {
  if (isStretchDay(summary.dayId)) return "Stretch";
  if (summary.dayId === "warmup") return "Warm-up";
  return summary.title.split("·")[0].trim();
}
