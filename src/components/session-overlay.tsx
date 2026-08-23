"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dumbbell, Timer } from "lucide-react";
import { formatDateISO } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import { sessionSetCounts } from "@/lib/session";
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
import { CloseButton } from "@/components/close-button";
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

function SessionOverlayInner() {
  const { todaySession } = useTraining();
  const pathname = usePathname();
  const pick = useSearchParams().get("pick");
  const today = formatDateISO();
  const open = isOpenSession(todaySession, today);
  const sessionDate = todaySession?.date ?? today;

  const onActivePage =
    pathname === "/workout" &&
    todaySession &&
    (!pick || pick === todaySession.dayId);

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

  if (!open || !todaySession) return null;

  const countingUp = state.mode === "up" && (state.running || state.elapsedMs > 0);
  const countingDown = state.mode === "down" && state.durationMs != null;
  const idle = isIdle(state);
  const label = formatTimer(remaining);
  const counts = sessionSetCounts(todaySession);
  const shortTitle = todaySession.title.split("·")[0].trim();

  function patch(next: SessionTimerState) {
    setState(next);
    setNow(Date.now());
    saveTimer(next);
  }

  function start() {
    if (countingDown && state.durationMs == null) return;
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
      mode: countingDown ? "down" : "up",
    });
  }

  function stop() {
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

  function addCountdown(ms: number) {
    if (state.running || countingUp) return;
    buzzed.current = false;
    const current =
      state.mode === "down" && state.durationMs != null && !done
        ? Math.max(0, state.durationMs - elapsedMs(state))
        : 0;
    patch({
      ...state,
      hidden: false,
      running: false,
      mode: "down",
      durationMs: current + ms,
      elapsedMs: 0,
      startedAt: null,
    });
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto max-w-md bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"
      aria-live="polite"
    >
      <div className="flex flex-col items-end gap-2 px-3">
        {!state.hidden ? (
          <div
            className="pointer-events-auto w-full max-w-[min(100%,20rem)] rounded-2xl border border-border/80 bg-card/95 p-3 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {countingDown ? "Countdown" : countingUp ? "Count up" : "Timer"}
                </p>
                <p
                  className={cn(
                    "font-heading text-3xl font-semibold tabular-nums tracking-tight",
                    (state.running || done) && "text-primary",
                  )}
                >
                  {label}
                </p>
              </div>
              <CloseButton
                onClick={() => patch({ ...state, hidden: true })}
                label="Hide timer"
              />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              {REST_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={state.running || countingUp}
                  onClick={() => addCountdown(preset.ms)}
                  className={cn(
                    "h-10 rounded-xl text-sm font-medium disabled:opacity-40",
                    countingDown && !countingUp
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  + {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
              {countingUp
                ? "Counting up. Clear to use a countdown."
                : countingDown
                  ? "Add time, then Start. Clear to count up instead."
                  : "Start to count up, or add 0:30 / 1:00, then Start."}
            </p>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button
                type="button"
                className="h-11"
                disabled={state.running || (countingDown && state.durationMs == null)}
                onClick={start}
              >
                Start
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11"
                disabled={!state.running}
                onClick={stop}
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
          </div>
        ) : null}

        <div className="pointer-events-auto flex items-center justify-end gap-2">
          {!onActivePage ? (
            <Link
              href="/workout"
              className="inline-flex size-16 flex-col items-center justify-center gap-0.5 rounded-full border border-border/80 bg-card/95 text-foreground shadow-md backdrop-blur-sm"
              aria-label={`Back to session · ${counts.completedSets}/${counts.plannedSets} sets`}
            >
              <Dumbbell className="size-5 text-primary" />
              <span className="max-w-[3.5rem] truncate text-[9px] font-medium leading-none">
                {shortTitle}
              </span>
              <span className="text-[10px] font-semibold tabular-nums leading-none text-muted-foreground">
                {counts.completedSets}/{counts.plannedSets}
              </span>
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => patch({ ...state, hidden: !state.hidden })}
            className={cn(
              "inline-flex size-16 flex-col items-center justify-center gap-0.5 rounded-full border shadow-md backdrop-blur-sm",
              "border-primary/45 bg-card/95 text-primary",
              !state.hidden && "border-primary ring-2 ring-primary/25",
              state.running && "border-primary text-primary",
            )}
            aria-expanded={!state.hidden}
            aria-label={state.hidden ? `Open timer ${label}` : "Hide timer"}
          >
            <Timer className="size-6" />
            <span className="text-[11px] font-semibold tabular-nums leading-none">
              {idle ? "Timer" : label}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function SessionOverlay() {
  return (
    <Suspense fallback={null}>
      <SessionOverlayInner />
    </Suspense>
  );
}
