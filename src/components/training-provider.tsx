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
import { createAthlete, mergeLoads } from "@/lib/session";
import { loadBundle, queueSave, saveCompleted, saveNow, unlockWithPassphrase } from "@/lib/store";
import type { AthleteDoc, WorkoutSession } from "@/lib/types";

type TrainingContextValue = {
  ready: boolean;
  unlocked: boolean;
  athlete: AthleteDoc;
  todaySession: WorkoutSession | undefined;
  unlock: (passphrase: string) => Promise<boolean>;
  setAthlete: (athlete: AthleteDoc) => void;
  setTodaySession: (session: WorkoutSession | undefined) => void;
  persistSession: (session: WorkoutSession) => void;
  completeSession: (session: WorkoutSession) => void;
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
      setTodaySessionState(bundle.today);
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
    setTodaySessionState(bundle.today);
    setUnlocked(true);
    return true;
  }, []);

  const persistSession = useCallback(
    (session: WorkoutSession) => {
      setTodaySessionState(session);
      const nextAthlete = {
        ...athlete,
        lastSessionDate: session.date,
        lastSessionStatus: session.status,
        lastLoads: mergeLoads(athlete.lastLoads, session),
        updatedAt: session.updatedAt,
      };
      setAthleteState(nextAthlete);
      queueSave({ athlete: nextAthlete, today: session });
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

  const setAthlete = useCallback(
    (next: AthleteDoc) => {
      setAthleteState(next);
      queueSave({ athlete: next, today: todaySession });
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
      completeSession,
      flush,
    }),
    [
      athlete,
      completeSession,
      flush,
      persistSession,
      ready,
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
