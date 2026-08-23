"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateISO } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import {
  resetWorkoutClock,
  startWorkoutClock,
  stopWorkoutClock,
} from "@/lib/session";
import type { WorkoutSession } from "@/lib/types";
import { SessionClock } from "@/components/session-clock";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";

export function WorkoutBanner() {
  const { todaySession, persistSession } = useTraining();
  const open = isOpenSession(todaySession, formatDateISO());
  const [clearArmed, setClearArmed] = useState(false);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !todaySession?.startedAt) return;
    if (todaySession.clockStartedAt || todaySession.clockEndedAt) return;
    persistSession(startWorkoutClock(todaySession), { immediate: true });
  }, [open, persistSession, todaySession]);

  useEffect(() => {
    return () => {
      if (clearTimer.current != null) {
        window.clearTimeout(clearTimer.current);
      }
    };
  }, []);

  if (!open || !todaySession) return null;

  const session = todaySession;
  const startedAt = session.clockStartedAt ?? session.startedAt;
  const running = !session.clockEndedAt;

  function save(next: WorkoutSession) {
    persistSession(next, { immediate: true });
  }

  function armClear() {
    setClearArmed(true);
    if (clearTimer.current != null) {
      window.clearTimeout(clearTimer.current);
    }
    clearTimer.current = window.setTimeout(() => {
      setClearArmed(false);
      clearTimer.current = null;
    }, 4000);
  }

  function onClear() {
    if (!clearArmed) {
      armClear();
      return;
    }
    if (clearTimer.current != null) {
      window.clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    setClearArmed(false);
    save(resetWorkoutClock(session));
  }

  return (
    <div className="shrink-0 border-b border-border/60 bg-background px-3 pt-[max(1.5rem,calc(env(safe-area-inset-top,0px)+var(--app-top-gap)))] pb-1.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Workout
          </p>
          <SessionClock
            startedAt={startedAt}
            finishedAt={session.clockEndedAt}
            running={running}
            className="text-sm font-semibold leading-tight"
          />
        </div>
        {running ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 px-3"
            onClick={() => save(stopWorkoutClock(session))}
          >
            Pause
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-3"
              onClick={onClear}
            >
              {clearArmed ? "Clear?" : "Clear"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3"
              onClick={() => save(startWorkoutClock(session))}
            >
              Resume
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
