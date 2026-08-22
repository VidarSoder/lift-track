import { formatDateISO } from "@/lib/dates";
import type { WorkoutSession } from "@/lib/types";

export function isOpenSession(
  session: WorkoutSession | undefined,
  today = formatDateISO(),
) {
  return Boolean(
    session && session.date === today && session.status === "in_progress",
  );
}

export function todaysSession(
  session: WorkoutSession | undefined,
  today = formatDateISO(),
) {
  if (!session || session.date !== today || session.status === "skipped") {
    return undefined;
  }
  return session;
}
