"use client";

import { useRouter } from "next/navigation";
import { formatDateISO } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import {
  clearWorkoutClock,
  startWorkoutClock,
  stopWorkoutClock,
} from "@/lib/session";
import type { WorkoutSession } from "@/lib/types";
import { SessionClock } from "@/components/session-clock";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";

export function WorkoutBanner() {
  const router = useRouter();
  const { todaySession, persistSession } = useTraining();
  const open = isOpenSession(todaySession, formatDateISO());
  if (!open || !todaySession) return null;

  const started = Boolean(todaySession.clockStartedAt);
  const running = started && !todaySession.clockEndedAt;

  function save(next: WorkoutSession) {
    persistSession(next, { immediate: true });
  }

  return (
    <div className="shrink-0 border-b border-border/60 bg-background px-3 pt-[max(1.5rem,calc(env(safe-area-inset-top,0px)+var(--app-top-gap)))] pb-1.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Workout
          </p>
          {started ? (
            <SessionClock
              startedAt={todaySession.clockStartedAt!}
              finishedAt={todaySession.clockEndedAt}
              running={running}
              className="text-sm font-semibold leading-tight"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Start when you begin</p>
          )}
        </div>
        {running ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 px-3"
            onClick={() => save(stopWorkoutClock(todaySession))}
          >
            Pause
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-8 px-3"
            onClick={() => save(startWorkoutClock(todaySession))}
          >
            {started ? "Resume" : "Start"}
          </Button>
        )}
        {started && !running ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-muted-foreground"
            onClick={() => save(clearWorkoutClock(todaySession))}
          >
            Clear
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-3"
          onClick={() => {
            save(stopWorkoutClock(todaySession));
            router.push("/workout?end=1");
          }}
        >
          End
        </Button>
      </div>
    </div>
  );
}
