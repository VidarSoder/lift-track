import { formatDateISO } from "@/lib/dates";
import { createAthlete, isLiveSession } from "@/lib/session";
import { sessionDocId } from "@/lib/session-id";
import { setLogDocId, setLogEntriesFromSession } from "@/lib/set-logs";
import { athleteId } from "@/lib/server/secrets";
import { adminDb } from "@/lib/server/firebase-admin";
import { isAthletePayload, isSessionPayload } from "@/lib/server/validate-payload";
import type { AthleteDoc, CacheBundle, WorkoutSession } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SESSION_ID = /^\d{4}-\d{2}-\d{2}__.+/;

export async function loadTrainingState(): Promise<CacheBundle> {
  const id = await athleteId();
  const today = formatDateISO();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const snap = await athleteRef.get();
  const athlete = snap.exists ? (snap.data() as AthleteDoc) : createAthlete(today);

  let todaySession: WorkoutSession | undefined;
  const sessions = athleteRef.collection("sessions");

  // Prefer explicit multi-session id; fall back to legacy sessions/{date}.
  const candidates = [
    athlete.lastSessionId,
    athlete.lastSessionDate && DATE.test(athlete.lastSessionDate)
      ? athlete.lastSessionDate
      : null,
  ].filter((value): value is string => Boolean(value));

  for (const docId of candidates) {
    const sessionSnap = await sessions.doc(docId).get();
    if (!sessionSnap.exists) continue;
    const session = sessionSnap.data() as WorkoutSession;
    if (isLiveSession(session, today)) {
      todaySession = session;
      break;
    }
  }

  return { athlete, today: todaySession };
}

export async function loadSessionById(
  sessionId: string,
): Promise<WorkoutSession | null> {
  if (!SESSION_ID.test(sessionId) && !DATE.test(sessionId)) return null;
  const id = await athleteId();
  const snap = await adminDb()
    .collection("athletes")
    .doc(id)
    .collection("sessions")
    .doc(sessionId)
    .get();
  if (!snap.exists) return null;
  return snap.data() as WorkoutSession;
}

export async function saveTrainingState(bundle: CacheBundle) {
  if (!isAthletePayload(bundle.athlete)) {
    throw new Error("Invalid athlete payload");
  }
  if (bundle.today && !isSessionPayload(bundle.today)) {
    throw new Error("Invalid session payload");
  }
  const today = formatDateISO();
  if (
    bundle.today &&
    bundle.today.date !== today &&
    bundle.athlete.lastSessionDate !== bundle.today.date &&
    !isLiveSession(bundle.today, today)
  ) {
    throw new Error("Only the current session can be written");
  }

  const id = await athleteId();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const batch = db.batch();

  const athlete: AthleteDoc = bundle.today
    ? {
        ...bundle.athlete,
        lastSessionId: sessionDocId(bundle.today),
        lastSessionDate: bundle.today.date,
      }
    : bundle.athlete;

  batch.set(athleteRef, athlete, { merge: true });
  if (bundle.today) {
    const docId = sessionDocId(bundle.today);
    batch.set(athleteRef.collection("sessions").doc(docId), bundle.today, {
      merge: true,
    });
    // Append-only durable log: same set key can be updated, never deleted.
    for (const entry of setLogEntriesFromSession(bundle.today)) {
      const ref = athleteRef.collection("setLogs").doc(setLogDocId(entry));
      batch.set(ref, entry, { merge: true });
    }
  }
  await batch.commit();
  return { athlete, today: bundle.today };
}
