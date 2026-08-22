"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { configuredPassphrase, isUnlocked, persistUnlock } from "@/lib/auth";
import { formatDateISO } from "@/lib/dates";
import { createAthlete } from "@/lib/session";
import { loadBundle, queueSave, saveCompleted, saveNow } from "@/lib/store";
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
  const [passphrase, setPassphrase] = useState(configuredPassphrase());

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!isUnlocked()) {
        setReady(true);
        return;
      }
      const key = configuredPassphrase();
      setPassphrase(key);
      const bundle = await loadBundle(key);
      if (cancelled) return;
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
    persistUnlock(value);
    const bundle = await loadBundle(value);
    setPassphrase(value);
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
        updatedAt: session.updatedAt,
      };
      setAthleteState(nextAthlete);
      queueSave(passphrase, { athlete: nextAthlete, today: session });
    },
    [athlete, passphrase],
  );

  const completeSession = useCallback(
    (session: WorkoutSession) => {
      const bundle = saveCompleted(passphrase, athlete, session);
      setAthleteState(bundle.athlete);
      setTodaySessionState(bundle.today);
    },
    [athlete, passphrase],
  );

  const setAthlete = useCallback(
    (next: AthleteDoc) => {
      setAthleteState(next);
      queueSave(passphrase, { athlete: next, today: todaySession });
    },
    [passphrase, todaySession],
  );

  const setTodaySession = useCallback((session: WorkoutSession | undefined) => {
    setTodaySessionState(session);
  }, []);

  const flush = useCallback(async () => {
    await saveNow(passphrase, { athlete, today: todaySession });
  }, [athlete, passphrase, todaySession]);

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
