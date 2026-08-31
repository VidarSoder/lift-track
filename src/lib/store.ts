import { ATHLETE_NAME } from "@/data/program";
import { formatDateISO } from "@/lib/dates";
import {
  applyCompletedSession,
  applyReopenedSession,
  cancelWorkout,
  createAthlete,
  isLiveSession,
  rememberProgress,
  reopenSession,
} from "@/lib/session";
import type { AthleteDoc, CacheBundle, WorkoutSession } from "@/lib/types";

const LOCAL_KEY = "training.cache";

function readLocal(): CacheBundle | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheBundle;
  } catch {
    return null;
  }
}

function writeLocal(bundle: CacheBundle) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(bundle));
}

export async function unlockWithPassphrase(passphrase: string) {
  const response = await fetch("/api/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passphrase }),
  });
  if (!response.ok) return null;
  const bundle = (await response.json()) as CacheBundle;
  writeLocal(bundle);
  return bundle;
}

export async function loadBundle(): Promise<CacheBundle | null> {
  const today = formatDateISO();
  const local = readLocal();
  const localFresh =
    local && local.athlete.name === ATHLETE_NAME
      ? {
          athlete: local.athlete,
          today: isLiveSession(local.today, today) ? local.today : undefined,
        }
      : null;

  const response = await fetch("/api/state");
  if (response.status === 401) return null;
  if (!response.ok) {
    return localFresh ?? { athlete: createAthlete(today) };
  }
  const bundle = (await response.json()) as CacheBundle;
  writeLocal(bundle);
  return bundle;
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: CacheBundle | null = null;

async function flushWrite() {
  if (!pending) return;
  const bundle = pending;
  pending = null;
  await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
}

export function queueSave(bundle: CacheBundle) {
  writeLocal(bundle);
  pending = bundle;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    void flushWrite();
  }, 1600);
}

export async function saveNow(bundle: CacheBundle) {
  writeLocal(bundle);
  pending = bundle;
  if (writeTimer) clearTimeout(writeTimer);
  await flushWrite();
}

export function saveCompleted(athlete: AthleteDoc, session: WorkoutSession) {
  const nextAthlete = applyCompletedSession(athlete, session);
  const bundle = { athlete: nextAthlete, today: session };
  void saveNow(bundle);
  return bundle;
}

export function saveReopened(athlete: AthleteDoc, session: WorkoutSession) {
  const next = reopenSession(session);
  const nextAthlete = applyReopenedSession(athlete, next);
  const bundle = { athlete: nextAthlete, today: next };
  void saveNow(bundle);
  return bundle;
}

export function saveProgress(athlete: AthleteDoc, session: WorkoutSession) {
  const nextAthlete = rememberProgress(athlete, session);
  const bundle = { athlete: nextAthlete, today: session };
  void saveNow(bundle);
  return bundle;
}

export function abandonSession(
  athlete: AthleteDoc,
  session: WorkoutSession,
  keepProgress: boolean,
) {
  const bundle = cancelWorkout(athlete, session, keepProgress);
  void saveNow(bundle);
  return bundle;
}

export async function fetchSession(sessionId: string) {
  const response = await fetch(`/api/session?id=${encodeURIComponent(sessionId)}`);
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) return null;
  const body = (await response.json()) as { session?: WorkoutSession };
  return body.session ?? null;
}
