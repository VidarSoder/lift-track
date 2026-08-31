import type { DayKind, SessionSummary, WorkoutSession } from "@/lib/types";

/** Stable Firestore doc id — allows multiple sessions on the same calendar day. */
export function sessionDocId(
  session: Pick<WorkoutSession, "date" | "dayId" | "startedAt">,
) {
  const started = session.startedAt.replace(/[:.]/g, "-");
  return `${session.date}__${session.dayId}__${started}`;
}

export function sessionDocIdFromSummary(summary: SessionSummary) {
  if (!summary.startedAt) return null;
  return sessionDocId({
    date: summary.date,
    dayId: summary.dayId,
    startedAt: summary.startedAt,
  });
}

/** Try composite id first, then legacy sessions/{date}. */
export function sessionDocIdCandidates(summary: SessionSummary) {
  const ids: string[] = [];
  const composite = sessionDocIdFromSummary(summary);
  if (composite) ids.push(composite);
  if (!ids.includes(summary.date)) ids.push(summary.date);
  return ids;
}

/** Match the same workout occurrence (multi-session days need startedAt). */
export function sameSessionOccurrence(
  a: { date: string; dayId: DayKind | string; startedAt?: string },
  b: { date: string; dayId: DayKind | string; startedAt?: string },
) {
  if (a.date !== b.date || a.dayId !== b.dayId) return false;
  if (a.startedAt && b.startedAt) return a.startedAt === b.startedAt;
  // Legacy summaries without startedAt: one slot per day+dayId.
  if (!a.startedAt && !b.startedAt) return true;
  return false;
}
