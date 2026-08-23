const STORAGE_KEY = "training_rest_timer";

export type SessionTimerState = {
  sessionDate: string;
  hidden: boolean;
  running: boolean;
  mode: "up" | "down";
  startedAt: number | null;
  elapsedMs: number;
  durationMs: number | null;
};

export const REST_PRESETS = [
  { label: "1:00", ms: 60_000 },
  { label: "1:30", ms: 90_000 },
  { label: "2:00", ms: 120_000 },
] as const;

export function emptyTimer(sessionDate: string): SessionTimerState {
  return {
    sessionDate,
    hidden: true,
    running: false,
    mode: "up",
    startedAt: null,
    elapsedMs: 0,
    durationMs: null,
  };
}

export function loadTimer(sessionDate: string): SessionTimerState {
  if (typeof window === "undefined") return emptyTimer(sessionDate);
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyTimer(sessionDate);
    const parsed = JSON.parse(raw) as SessionTimerState;
    if (parsed.sessionDate !== sessionDate) return emptyTimer(sessionDate);
    return { ...emptyTimer(sessionDate), ...parsed, sessionDate };
  } catch {
    return emptyTimer(sessionDate);
  }
}

export function saveTimer(state: SessionTimerState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearTimerStorage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function elapsedMs(state: SessionTimerState, now = Date.now()) {
  const live =
    state.running && state.startedAt != null ? now - state.startedAt : 0;
  return Math.max(0, state.elapsedMs + live);
}

export function displayMs(state: SessionTimerState, now = Date.now()) {
  const elapsed = elapsedMs(state, now);
  if (state.mode === "down" && state.durationMs != null) {
    return Math.max(0, state.durationMs - elapsed);
  }
  return elapsed;
}

export function formatTimer(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isIdle(state: SessionTimerState) {
  return !state.running && state.elapsedMs === 0 && state.durationMs == null;
}
