import { formatDateISO } from "@/lib/dates";
import { isLiveSession } from "@/lib/session";
import type { WorkoutSession } from "@/lib/types";

export function isOpenSession(
  session: WorkoutSession | undefined,
  today = formatDateISO(),
) {
  return Boolean(session && session.status === "in_progress" && isLiveSession(session, today));
}

export function todaysSession(
  session: WorkoutSession | undefined,
  today = formatDateISO(),
) {
  return isLiveSession(session, today) ? session : undefined;
}
