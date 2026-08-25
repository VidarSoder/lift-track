import { formatDateISO } from "@/lib/dates";
import { createAthlete, isLiveSession } from "@/lib/session";
import { setLogDocId, setLogEntriesFromSession } from "@/lib/set-logs";
import { athleteId } from "@/lib/server/secrets";
import { adminDb } from "@/lib/server/firebase-admin";
import { isAthletePayload, isSessionPayload } from "@/lib/server/validate-payload";
import type { AthleteDoc, CacheBundle, WorkoutSession } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function loadTrainingState(): Promise<CacheBundle> {
  const id = await athleteId();
  const today = formatDateISO();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const snap = await athleteRef.get();
  const athlete = snap.exists ? (snap.data() as AthleteDoc) : createAthlete(today);

  let todaySession: WorkoutSession | undefined;
  const lastDate = athlete.lastSessionDate;
  if (lastDate && DATE.test(lastDate)) {
    const sessionSnap = await athleteRef.collection("sessions").doc(lastDate).get();
    if (sessionSnap.exists) {
      const session = sessionSnap.data() as WorkoutSession;
      if (isLiveSession(session, today)) {
        todaySession = session;
      }
    }
  }

  return { athlete, today: todaySession };
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
  batch.set(athleteRef, bundle.athlete, { merge: true });
  if (bundle.today) {
    batch.set(athleteRef.collection("sessions").doc(bundle.today.date), bundle.today, {
      merge: true,
    });
    // Append-only durable log: same set key can be updated, never deleted.
    for (const entry of setLogEntriesFromSession(bundle.today)) {
      const ref = athleteRef.collection("setLogs").doc(setLogDocId(entry));
      batch.set(ref, entry, { merge: true });
    }
  }
  await batch.commit();
  return bundle;
}
