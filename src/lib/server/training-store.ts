import { formatDateISO } from "@/lib/dates";
import {
  applySessionDurationToAthlete,
  countSessionsFromDocs,
  createAthlete,
  isLiveSession,
  isStretchDay,
  isTrainingDay,
  summarizeSession,
  withSessionDuration,
} from "@/lib/session";
import { sessionDocId, isCompositeSessionId } from "@/lib/session-id";
import {
  setLogDocId,
  setLogEntriesFromSession,
  sessionFromSetLogs,
  type SetLogEntry,
} from "@/lib/set-logs";
import { athleteId } from "@/lib/server/secrets";
import { adminDb } from "@/lib/server/firebase-admin";
import { isAthletePayload, isSessionPayload } from "@/lib/server/validate-payload";
import type {
  AthleteDoc,
  CacheBundle,
  SessionSummary,
  WorkoutSession,
} from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SESSION_ID = /^\d{4}-\d{2}-\d{2}__.+/;

function dedupeCompletedSessions(sessions: WorkoutSession[]) {
  const withStart = sessions.filter(
    (session) => session.status === "completed" && session.startedAt,
  );
  const withoutStart = sessions.filter(
    (session) => session.status === "completed" && !session.startedAt,
  );
  const dayKeys = new Set(
    withStart.map((session) => `${session.date}|${session.dayId}`),
  );
  const unique = [...withStart];
  for (const session of withoutStart) {
    if (dayKeys.has(`${session.date}|${session.dayId}`)) continue;
    unique.push(session);
  }
  return unique;
}

function sortSummaries(a: SessionSummary, b: SessionSummary) {
  const dates = b.date.localeCompare(a.date);
  if (dates !== 0) return dates;
  return (b.startedAt ?? "").localeCompare(a.startedAt ?? "");
}

/** Prefer richer rows; keep recent entries when session docs were overwritten. */
export function mergeSessionSummaries(
  ...lists: Array<SessionSummary[] | undefined>
) {
  const map = new Map<string, SessionSummary>();
  for (const list of lists) {
    for (const item of list ?? []) {
      const dayKey = `${item.date}|${item.dayId}`;
      const key = item.startedAt
        ? `${dayKey}|${item.startedAt}`
        : dayKey;
      if (item.startedAt) {
        // Drop legacy same-day row without startedAt once a concrete one exists.
        map.delete(dayKey);
      } else if (
        [...map.keys()].some(
          (existing) =>
            existing.startsWith(`${dayKey}|`) && existing !== dayKey,
        )
      ) {
        continue;
      }
      map.set(key, item);
    }
  }
  return [...map.values()].sort(sortSummaries);
}

export function summaryCursor(summary: SessionSummary) {
  return `${summary.date}|${summary.dayId}|${summary.startedAt ?? ""}`;
}

export async function loadTrainingState(): Promise<CacheBundle> {
  const id = await athleteId();
  const today = formatDateISO();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const snap = await athleteRef.get();
  let athlete = snap.exists ? (snap.data() as AthleteDoc) : createAthlete(today);

  let todaySession: WorkoutSession | undefined;
  const sessions = athleteRef.collection("sessions");

  const allSessions = await sessions.get();
  if (!allSessions.empty) {
    const counted = countSessionsFromDocs(
      allSessions.docs.map((doc) => doc.data() as WorkoutSession),
    );
    if (
      counted.training !== athlete.sessionsCompleted ||
      counted.stretch !== (athlete.stretchSessionsCompleted ?? 0)
    ) {
      athlete = {
        ...athlete,
        sessionsCompleted: counted.training,
        stretchSessionsCompleted: counted.stretch,
        updatedAt: new Date().toISOString(),
      };
      await athleteRef.set(
        {
          sessionsCompleted: counted.training,
          stretchSessionsCompleted: counted.stretch,
          updatedAt: athlete.updatedAt,
        },
        { merge: true },
      );
    }
  }

  const inProgress = allSessions.docs
    .map((doc) => doc.data() as WorkoutSession)
    .find(
      (session) =>
        session.status === "in_progress" && isLiveSession(session, today),
    );
  if (inProgress) {
    todaySession = inProgress;
  } else {
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
  }

  return { athlete, today: todaySession };
}

export async function loadSessionById(
  sessionId: string,
): Promise<WorkoutSession | null> {
  if (!SESSION_ID.test(sessionId) && !DATE.test(sessionId)) return null;
  const id = await athleteId();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const snap = await athleteRef.collection("sessions").doc(sessionId).get();
  if (snap.exists) {
    const session = snap.data() as WorkoutSession;
    // Legacy date-only docs are read-only; never treat them as the live write target.
    return session;
  }

  // Recover from setLogs when a composite id is missing (same-day overwrite).
  if (!isCompositeSessionId(sessionId)) return null;
  const parts = sessionId.split("__");
  if (parts.length < 3) return null;
  const [date, dayId] = parts;
  const startedSlug = parts.slice(2).join("__");
  const logSnap = await athleteRef
    .collection("setLogs")
    .where("date", "==", date)
    .where("dayId", "==", dayId)
    .get();
  const entries = logSnap.docs.map((doc) => doc.data() as SetLogEntry);
  const exact = entries.filter(
    (entry) => entry.sessionStartedAt.replace(/[:.]/g, "-") === startedSlug,
  );
  const rebuilt = sessionFromSetLogs(exact.length > 0 ? exact : entries);
  if (!rebuilt) return null;
  await athleteRef.collection("sessions").doc(sessionId).set(rebuilt, {
    merge: true,
  });
  return rebuilt;
}

export async function listSessionSummaries(options: {
  kind?: "all" | "training" | "stretch";
  limit?: number;
  cursor?: string | null;
}): Promise<{ items: SessionSummary[]; nextCursor: string | null }> {
  const kind = options.kind ?? "all";
  const limit = Math.max(1, Math.min(40, options.limit ?? 12));
  const id = await athleteId();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const [athleteSnap, sessionsSnap] = await Promise.all([
    athleteRef.get(),
    athleteRef.collection("sessions").get(),
  ]);
  const athlete = athleteSnap.exists
    ? (athleteSnap.data() as AthleteDoc)
    : null;
  const fromDocs = dedupeCompletedSessions(
    sessionsSnap.docs.map((doc) => doc.data() as WorkoutSession),
  ).map(summarizeSession);
  // recent fills gaps when a later same-day session overwrote the date doc.
  let summaries = mergeSessionSummaries(fromDocs, athlete?.recent);

  if (kind === "training") {
    summaries = summaries.filter((item) => isTrainingDay(item.dayId));
  } else if (kind === "stretch") {
    summaries = summaries.filter((item) => isStretchDay(item.dayId));
  }

  let start = 0;
  if (options.cursor) {
    const index = summaries.findIndex(
      (item) => summaryCursor(item) === options.cursor,
    );
    start = index >= 0 ? index + 1 : 0;
  }
  const page = summaries.slice(start, start + limit);
  const next =
    start + limit < summaries.length
      ? summaryCursor(page[page.length - 1]!)
      : null;
  return { items: page, nextCursor: next };
}

export async function patchSessionDuration(
  sessionId: string,
  durationMin: number,
): Promise<{ session: WorkoutSession; athlete: AthleteDoc } | null> {
  if (!SESSION_ID.test(sessionId) && !DATE.test(sessionId)) return null;
  if (!Number.isFinite(durationMin) || durationMin < 1 || durationMin > 600) {
    throw new Error("Duration must be between 1 and 600 minutes");
  }
  const id = await athleteId();
  const db = adminDb();
  const athleteRef = db.collection("athletes").doc(id);
  const sessionRef = athleteRef.collection("sessions").doc(sessionId);
  const [athleteSnap, sessionSnap] = await Promise.all([
    athleteRef.get(),
    sessionRef.get(),
  ]);
  if (!sessionSnap.exists || !athleteSnap.exists) return null;
  const current = sessionSnap.data() as WorkoutSession;
  if (current.status !== "completed") {
    throw new Error("Only completed sessions can change duration");
  }
  const session = withSessionDuration(current, durationMin);
  const athlete = applySessionDurationToAthlete(
    athleteSnap.data() as AthleteDoc,
    session,
  );
  // Always write duration to a composite id — never mutate legacy date docs in place.
  const writeId =
    isCompositeSessionId(sessionId) && session.startedAt
      ? sessionId
      : session.startedAt
        ? sessionDocId(session)
        : null;
  if (!writeId) {
    throw new Error(
      "Cannot edit duration on a legacy session without startedAt",
    );
  }
  const batch = db.batch();
  batch.set(athleteRef.collection("sessions").doc(writeId), session, {
    merge: true,
  });
  batch.set(
    athleteRef,
    { recent: athlete.recent, updatedAt: athlete.updatedAt },
    { merge: true },
  );
  await batch.commit();
  return { session, athlete };
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
    if (!bundle.today.startedAt) {
      throw new Error("Session is missing startedAt — refusing to save");
    }
    const docId = sessionDocId(bundle.today);
    // Hard guard: never write sessions/{YYYY-MM-DD} — that overwrote same-day work.
    if (!isCompositeSessionId(docId) || docId === bundle.today.date) {
      throw new Error(`Refusing non-composite session id: ${docId}`);
    }
    batch.set(athleteRef.collection("sessions").doc(docId), bundle.today, {
      merge: true,
    });
    for (const entry of setLogEntriesFromSession(bundle.today)) {
      const ref = athleteRef.collection("setLogs").doc(setLogDocId(entry));
      batch.set(ref, entry, { merge: true });
    }
  }
  await batch.commit();
  return { athlete, today: bundle.today };
}
