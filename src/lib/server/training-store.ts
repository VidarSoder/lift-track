import { formatDateISO } from "@/lib/dates";
import { createAthlete } from "@/lib/session";
import { athleteId } from "@/lib/server/secrets";
import { adminDb } from "@/lib/server/firebase-admin";
import type { AthleteDoc, CacheBundle, WorkoutSession } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isAthlete(value: unknown): value is AthleteDoc {
  if (!value || typeof value !== "object") return false;
  const data = value as AthleteDoc;
  return (
    typeof data.name === "string" &&
    typeof data.timezone === "string" &&
    typeof data.programStartDate === "string" &&
    typeof data.sessionsCompleted === "number" &&
    typeof data.streak === "number" &&
    typeof data.updatedAt === "string" &&
    Array.isArray(data.recent) &&
    data.recent.length <= 12
  );
}

function isSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== "object") return false;
  const data = value as WorkoutSession;
  return (
    DATE.test(data.date) &&
    typeof data.dayId === "string" &&
    typeof data.title === "string" &&
    ["in_progress", "completed", "skipped"].includes(data.status) &&
    Array.isArray(data.exercises)
  );
}

export async function loadTrainingState(): Promise<CacheBundle> {
  const id = await athleteId();
  const today = formatDateISO();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const snap = await athleteRef.get();
  const athlete = snap.exists ? (snap.data() as AthleteDoc) : createAthlete(today);

  let todaySession: WorkoutSession | undefined;
  if (athlete.lastSessionDate === today) {
    const sessionSnap = await athleteRef.collection("sessions").doc(today).get();
    if (sessionSnap.exists) {
      todaySession = sessionSnap.data() as WorkoutSession;
    }
  }

  return { athlete, today: todaySession };
}

export async function saveTrainingState(bundle: CacheBundle) {
  if (!isAthlete(bundle.athlete)) {
    throw new Error("Invalid athlete payload");
  }
  if (bundle.today && !isSession(bundle.today)) {
    throw new Error("Invalid session payload");
  }
  if (bundle.today && bundle.today.date !== formatDateISO()) {
    throw new Error("Only today's session can be written");
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
  }
  await batch.commit();
  return bundle;
}
