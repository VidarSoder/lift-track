"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatDateISO } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import {
  REST_PRESETS,
  clearTimerStorage,
  displayMs,
  elapsedMs,
  emptyTimer,
  formatTimer,
  isIdle,
  loadTimer,
  saveTimer,
  type SessionTimerState,
} from "@/lib/session-timer";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buzz() {
  try {
    window.navigator.vibrate?.([180, 80, 180]);
  } catch {
    /* ignore */
  }
}

export function SessionTimer() {
  const { todaySession } = useTraining();
  const today = formatDateISO();
  const open = isOpenSession(todaySession, today);
  const sessionDate = todaySession?.date ?? today;
  const [state, setState] = useState<SessionTimerState>(() =>
    emptyTimer(sessionDate),
  );
  const [now, setNow] = useState(() => Date.now());
  const buzzed = useRef(false);

  useEffect(() => {
    if (!open) {
      clearTimerStorage();
      setState(emptyTimer(sessionDate));
      return;
    }
    setState(loadTimer(sessionDate));
  }, [open, sessionDate]);

  useEffect(() => {
    if (!open || !state.running) return;
    const tick = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(tick);
  }, [open, state.running]);

  const remaining = displayMs(state, now);
  const done =
    state.mode === "down" &&
    state.durationMs != null &&
    remaining === 0 &&
    elapsedMs(state, now) >= state.durationMs;

  useEffect(() => {
    if (!state.running || !done || buzzed.current) return;
    buzzed.current = true;
    buzz();
    setState((current) => {
      const next = {
        ...current,
        running: false,
        startedAt: null,
        elapsedMs: current.durationMs ?? elapsedMs(current),
      };
      saveTimer(next);
      return next;
    });
  }, [done, state.running]);

  if (!open) return null;

  function patch(next: SessionTimerState) {
    setState(next);
    setNow(Date.now());
    saveTimer(next);
  }

  function start() {
    buzzed.current = false;
    const finished =
      state.mode === "down" &&
      state.durationMs != null &&
      elapsedMs(state) >= state.durationMs;
    patch({
      ...state,
      running: true,
      startedAt: Date.now(),
      elapsedMs: finished ? 0 : elapsedMs(state),
      mode: state.durationMs != null ? "down" : "up",
    });
  }

  function end() {
    if (!state.running) return;
    patch({
      ...state,
      running: false,
      startedAt: null,
      elapsedMs: elapsedMs(state),
    });
  }

  function clear() {
    buzzed.current = false;
    patch({
      ...emptyTimer(sessionDate),
      hidden: state.hidden,
    });
  }

  function startRest(ms: number) {
    buzzed.current = false;
    patch({
      ...state,
      hidden: false,
      running: true,
      mode: "down",
      durationMs: ms,
      elapsedMs: 0,
      startedAt: Date.now(),
    });
  }

  const label = formatTimer(remaining);
  const idle = isIdle(state);

  if (state.hidden) {
    return (
      <div className="flex shrink-0 justify-end border-t border-border/60 bg-background px-3 py-1.5">
        <button
          type="button"
          onClick={() => patch({ ...state, hidden: false })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums",
            state.running
              ? "bg-primary text-primary-foreground"
              : done
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-secondary-foreground",
          )}
          aria-label={`Open timer ${label}`}
        >
          <Timer className="size-3.5" />
          {idle ? "Timer" : label}
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border/60 bg-background px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "font-heading text-3xl font-semibold tabular-nums tracking-tight",
            (state.running || done) && "text-primary",
          )}
        >
          {label}
        </p>
        <button
          type="button"
          className="h-9 rounded-full px-3 text-sm text-muted-foreground"
          onClick={() => patch({ ...state, hidden: true })}
        >
          Hide
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Button
          type="button"
          className="h-11"
          disabled={state.running}
          onClick={start}
        >
          Start
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11"
          disabled={!state.running}
          onClick={end}
        >
          Stop
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={idle}
          onClick={clear}
        >
          Clear
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {REST_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => startRest(preset.ms)}
            className={cn(
              "h-10 rounded-xl text-sm font-medium",
              state.mode === "down" &&
                state.durationMs === preset.ms &&
                (state.running || done)
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
