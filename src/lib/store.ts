import { doc, getDoc, setDoc } from "firebase/firestore";
import { ATHLETE_NAME } from "@/data/program";
import { athleteIdFromPassphrase } from "@/lib/auth";
import { formatDateISO } from "@/lib/dates";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { applyCompletedSession, createAthlete } from "@/lib/session";
import type { AthleteDoc, CacheBundle, WorkoutSession } from "@/lib/types";

const LOCAL_KEY = "training.cache";

type LocalCache = CacheBundle & { athleteId: string };

function readLocal(): LocalCache | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalCache;
  } catch {
    return null;
  }
}

function writeLocal(cache: LocalCache) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(cache));
}

async function athleteRef(passphrase: string) {
  const db = getFirebaseDb();
  if (!db) return null;
  const id = await athleteIdFromPassphrase(passphrase);
  return { db, id, athlete: doc(db, "athletes", id) };
}

export async function loadBundle(passphrase: string): Promise<CacheBundle> {
  const today = formatDateISO();
  const local = readLocal();
  const localFresh =
    local &&
    local.athlete.name === ATHLETE_NAME &&
    (!local.today || local.today.date === today)
      ? local
      : local
        ? {
            ...local,
            today:
              local.today && local.today.date === today ? local.today : undefined,
          }
        : null;

  if (!isFirebaseConfigured()) {
    if (localFresh) return { athlete: localFresh.athlete, today: localFresh.today };
    const athlete = createAthlete(today);
    writeLocal({ athleteId: "local", athlete });
    return { athlete };
  }

  const refs = await athleteRef(passphrase);
  if (!refs) {
    return localFresh ?? { athlete: createAthlete(today) };
  }

  const athleteSnap = await getDoc(refs.athlete);
  const athlete = athleteSnap.exists()
    ? (athleteSnap.data() as AthleteDoc)
    : createAthlete(today);

  let todaySession = localFresh?.today;
  const shouldReadToday =
    athlete.lastSessionDate === today &&
    (!todaySession || todaySession.updatedAt !== athlete.updatedAt);

  if (shouldReadToday) {
    const sessionSnap = await getDoc(
      doc(refs.db, "athletes", refs.id, "sessions", today),
    );
    if (sessionSnap.exists()) {
      todaySession = sessionSnap.data() as WorkoutSession;
    }
  }

  const bundle = { athlete, today: todaySession };
  writeLocal({ athleteId: refs.id, ...bundle });
  return bundle;
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { passphrase: string; bundle: CacheBundle } | null = null;

async function flushWrite() {
  if (!pending) return;
  const { passphrase, bundle } = pending;
  pending = null;
  const refs = await athleteRef(passphrase);
  if (!refs) return;
  const writes = [
    setDoc(refs.athlete, bundle.athlete, { merge: true }),
  ];
  if (bundle.today) {
    writes.push(
      setDoc(
        doc(refs.db, "athletes", refs.id, "sessions", bundle.today.date),
        bundle.today,
        { merge: true },
      ),
    );
  }
  await Promise.all(writes);
}

export function queueSave(passphrase: string, bundle: CacheBundle) {
  const id = readLocal()?.athleteId ?? "local";
  writeLocal({ athleteId: id, ...bundle });
  if (!isFirebaseConfigured()) return;
  pending = { passphrase, bundle };
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    void flushWrite();
  }, 1600);
}

export async function saveNow(passphrase: string, bundle: CacheBundle) {
  const id = readLocal()?.athleteId ?? "local";
  writeLocal({ athleteId: id, ...bundle });
  pending = { passphrase, bundle };
  if (writeTimer) clearTimeout(writeTimer);
  await flushWrite();
}

export function saveCompleted(
  passphrase: string,
  athlete: AthleteDoc,
  session: WorkoutSession,
) {
  const nextAthlete = applyCompletedSession(athlete, session);
  const bundle = { athlete: nextAthlete, today: session };
  void saveNow(passphrase, bundle);
  return bundle;
}
