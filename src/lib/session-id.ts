import type { DayKind, SessionSummary, WorkoutSession } from "@/lib/types";

/** Stable Firestore doc id — allows multiple sessions on the same calendar day. */
export function sessionDocId(
  session: Pick<WorkoutSession, "date" | "dayId" | "startedAt">,
) {
  if (!session.startedAt) {
    throw new Error("sessionDocId requires startedAt — refusing date-only overwrite");
  }
  const started = session.startedAt.replace(/[:.]/g, "-");
  return `${session.date}__${session.dayId}__${started}`;
}

export function isCompositeSessionId(id: string) {
  return /^\d{4}-\d{2}-\d{2}__.+/.test(id);
}

export function sessionDocIdFromSummary(summary: SessionSummary) {
  if (!summary.startedAt) return null;
  return sessionDocId({
    date: summary.date,
    dayId: summary.dayId,
    startedAt: summary.startedAt,
  });
}

/**
 * Resolve a session doc. Prefer composite ids.
 * Legacy sessions/{date} is read-only fallback and must match dayId.
 */
export function sessionDocIdCandidates(summary: SessionSummary) {
  const ids: string[] = [];
  const composite = sessionDocIdFromSummary(summary);
  if (composite) ids.push(composite);
  // Legacy date doc only when we have no startedAt (old rows).
  if (!summary.startedAt && !ids.includes(summary.date)) {
    ids.push(summary.date);
  }
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
