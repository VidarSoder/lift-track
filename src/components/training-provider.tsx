"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hasUnlockFlag, persistUnlock } from "@/lib/auth";
import { formatDateISO } from "@/lib/dates";
import { upsertBikeStats } from "@/lib/bike";
import { mergeLiftLog } from "@/lib/lifts";
import { createAthlete, isLiveSession, mergeLoads } from "@/lib/session";
import { abandonSession, loadBundle, queueSave, saveCompleted, saveNow, saveProgress, saveReopened, unlockWithPassphrase } from "@/lib/store";
import type { AthleteDoc, WorkoutSession } from "@/lib/types";

function hydrateToday(session?: WorkoutSession) {
  return isLiveSession(session) ? session : undefined;
}

type TrainingContextValue = {
  ready: boolean;
  unlocked: boolean;
  athlete: AthleteDoc;
  todaySession: WorkoutSession | undefined;
  unlock: (passphrase: string) => Promise<boolean>;
  setAthlete: (athlete: AthleteDoc, options?: { immediate?: boolean }) => void;
  setTodaySession: (session: WorkoutSession | undefined) => void;
  persistSession: (
    session: WorkoutSession,
    options?: { immediate?: boolean; athlete?: AthleteDoc },
  ) => void;
  saveSessionProgress: (session: WorkoutSession) => void;
  completeSession: (session: WorkoutSession) => void;
  cancelSession: (session: WorkoutSession, keepProgress: boolean) => void;
  reopenEndedSession: (session: WorkoutSession) => void;
  reload: () => Promise<void>;
  flush: () => Promise<void>;
};

const TrainingContext = createContext<TrainingContextValue | null>(null);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [athlete, setAthleteState] = useState<AthleteDoc>(() =>
    createAthlete(formatDateISO()),
  );
  const [todaySession, setTodaySessionState] = useState<WorkoutSession>();

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!hasUnlockFlag()) {
        setReady(true);
        return;
      }
      const bundle = await loadBundle();
      if (cancelled) return;
      if (!bundle) {
        setReady(true);
        return;
      }
      setAthleteState(bundle.athlete);
      setTodaySessionState(hydrateToday(bundle.today));
      setUnlocked(true);
      setReady(true);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const unlock = useCallback(async (value: string) => {
    const bundle = await unlockWithPassphrase(value);
    if (!bundle) return false;
    persistUnlock();
    setAthleteState(bundle.athlete);
    setTodaySessionState(hydrateToday(bundle.today));
    setUnlocked(true);
    return true;
  }, []);

  const persistSession = useCallback(
    (
      session: WorkoutSession,
      options?: { immediate?: boolean; athlete?: AthleteDoc },
    ) => {
      setTodaySessionState(session);
      const base = options?.athlete ?? athlete;
      const withLoads = mergeLiftLog(
        {
          ...base,
          lastSessionDate: session.date,
          lastSessionStatus: session.status,
          lastLoads: mergeLoads(base.lastLoads, session),
          updatedAt: session.updatedAt,
        },
        session,
      );
      const nextAthlete = session.bikeStats
        ? upsertBikeStats(withLoads, { ...session.bikeStats, date: session.date })
        : withLoads;
      setAthleteState(nextAthlete);
      const bundle = { athlete: nextAthlete, today: session };
      if (options?.immediate) void saveNow(bundle);
      else queueSave(bundle);
    },
    [athlete],
  );

  const saveSessionProgress = useCallback(
    (session: WorkoutSession) => {
      const next = { ...session, updatedAt: new Date().toISOString() };
      const bundle = saveProgress(athlete, next);
      setAthleteState(bundle.athlete);
      setTodaySessionState(bundle.today);
    },
    [athlete],
  );

  const completeSession = useCallback(
    (session: WorkoutSession) => {
      const bundle = saveCompleted(athlete, session);
      setAthleteState(bundle.athlete);
      setTodaySessionState(bundle.today);
    },
    [athlete],
  );

  const cancelSession = useCallback(
    (session: WorkoutSession, keepProgress: boolean) => {
      const bundle = abandonSession(athlete, session, keepProgress);
      setAthleteState(bundle.athlete);
      setTodaySessionState(undefined);
    },
    [athlete],
  );

  const reopenEndedSession = useCallback(
    (session: WorkoutSession) => {
      const bundle = saveReopened(athlete, session);
      setAthleteState(bundle.athlete);
      setTodaySessionState(bundle.today);
    },
    [athlete],
  );

  const reload = useCallback(async () => {
    const bundle = await loadBundle();
    if (!bundle) return;
    setAthleteState(bundle.athlete);
    setTodaySessionState(hydrateToday(bundle.today));
  }, []);

  const setAthlete = useCallback(
    (next: AthleteDoc, options?: { immediate?: boolean }) => {
      setAthleteState(next);
      const bundle = { athlete: next, today: todaySession };
      if (options?.immediate) void saveNow(bundle);
      else queueSave(bundle);
    },
    [todaySession],
  );

  const setTodaySession = useCallback((session: WorkoutSession | undefined) => {
    setTodaySessionState(session);
  }, []);

  const flush = useCallback(async () => {
    await saveNow({ athlete, today: todaySession });
  }, [athlete, todaySession]);

  const value = useMemo(
    () => ({
      ready,
      unlocked,
      athlete,
      todaySession,
      unlock,
      setAthlete,
      setTodaySession,
      persistSession,
      saveSessionProgress,
      completeSession,
      cancelSession,
      reopenEndedSession,
      reload,
      flush,
    }),
    [
      athlete,
      cancelSession,
      completeSession,
      flush,
      reload,
      persistSession,
      ready,
      reopenEndedSession,
      saveSessionProgress,
      setAthlete,
      setTodaySession,
      todaySession,
      unlock,
      unlocked,
    ],
  );

  return (
    <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>
  );
}

export function useTraining() {
  const value = useContext(TrainingContext);
  if (!value) throw new Error("useTraining must be used inside TrainingProvider");
  return value;
}
