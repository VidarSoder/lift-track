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
