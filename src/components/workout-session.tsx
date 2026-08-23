"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronLeft, Flame, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { FEEL_GUIDE, dayById } from "@/data/program";
import { isOpenSession, todaysSession } from "@/lib/active-session";
import { formatDateISO, suggestedWindow } from "@/lib/dates";
import { workoutCatalog } from "@/lib/suggest";
import {
  blankSets,
  createSession,
  emptyAfter,
  insertWarmupSet,
  lastCardioLoad,
  lastLoad,
  liftIsDone,
  previousSets,
  previousWarmupSets,
  sessionSetCounts,
  suggestedWarmup,
  warmupSets,
  workingSets,
} from "@/lib/session";
import { cardioKind, cardioUnits, firstNumber, warmupById } from "@/data/warmup";
import { rememberCustom, resolveExercise } from "@/lib/exercises";
import type { LoggedSet, PinnedExercise, TimeOfDay, WorkoutSession } from "@/lib/types";
import {
  ExerciseHowButton,
  ExerciseHowPanel,
  ExerciseThumb,
  WorkoutExercisePreview,
} from "@/components/exercise-guide";
import { AddExerciseButton } from "@/components/add-exercise";
import { DangerConfirm } from "@/components/danger-confirm";
import { CardioRide } from "@/components/cardio-ride";
import { Stepper } from "@/components/stepper";
import { BikeStatsCard } from "@/components/bike-stats";
import { WarmupCard } from "@/components/warmup-picker";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { ScoreRow } from "@/components/score-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIMES: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

function SetRow({
  label,
  set,
  previous,
  lastKg,
  kind = "work",
  units = cardioUnits(""),
  fallbackLoad,
  onChange,
  onRemove,
}: {
  label: string;
  set: LoggedSet;
  previous?: LoggedSet;
  lastKg?: number | null;
  kind?: "work" | "warmup" | "extra";
  units?: ReturnType<typeof cardioUnits>;
  fallbackLoad?: number;
  onChange: (set: LoggedSet) => void;
  onRemove?: () => void;
}) {
  const startWeight = previous?.weight ?? lastKg ?? fallbackLoad ?? units.fallbackLoad;
  const startReps =
    previous?.reps ??
    (units.only === "work" ? units.fallbackLoad : units.work === "min" ? 6 : 8);
  const durationOnly = units.only === "work";
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  function cancelClear() {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setConfirmClear(false);
    setConfirmRemove(false);
  }

  function requestClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => {
        setConfirmClear(false);
        confirmTimer.current = null;
      }, 2500);
      return;
    }
    cancelClear();
    onChange({ weight: null, reps: null, done: false });
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border p-2.5",
        kind === "warmup"
          ? set.done
            ? "border-amber-600/45 bg-amber-500/15"
            : "border-amber-800/35 bg-amber-950/40"
          : set.done
            ? "border-primary/35 bg-primary/10"
            : "border-transparent bg-secondary/60",
      )}
    >
      {kind === "warmup" ? (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100">
            <Flame className="size-3.5" />
            Warm-up {label.replace(/^W/i, "")}
          </span>
        </div>
      ) : null}
      <div className="flex min-w-0 items-center gap-2">
        {kind === "warmup" ? null : (
          <span className="grid size-8 shrink-0 place-items-center text-xs font-medium text-muted-foreground">
            {label}
          </span>
        )}
        <div
          className={cn(
            "grid min-w-0 flex-1 gap-2",
            durationOnly ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {durationOnly ? null : (
            <Stepper
              value={set.weight}
              unit={units.load}
              step={units.loadStep}
              fallback={startWeight}
              onChange={(weight) => {
                cancelClear();
                onChange({ ...set, weight });
              }}
            />
          )}
          <Stepper
            value={set.reps}
            unit={units.work}
            step={units.workStep}
            fallback={startReps}
            onChange={(reps) => {
              cancelClear();
              onChange({ ...set, reps });
            }}
          />
        </div>
        {onRemove ? (
          <button
            type="button"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground",
              confirmRemove && "bg-destructive/15 text-destructive",
            )}
            aria-label={
              confirmRemove
                ? `Tap again to remove ${kind === "warmup" ? "warm-up" : "extra"} set ${label}`
                : `Remove ${kind === "warmup" ? "warm-up" : "extra"} set ${label}`
            }
            onClick={() => {
              if (!confirmRemove) {
                setConfirmRemove(true);
                setConfirmClear(false);
                if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
                confirmTimer.current = window.setTimeout(() => {
                  setConfirmRemove(false);
                  confirmTimer.current = null;
                }, 2500);
                return;
              }
              cancelClear();
              onRemove();
            }}
          >
            {confirmRemove ? (
              <span className="text-[10px] font-medium">Again</span>
            ) : (
              <X className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      {kind === "warmup" ? (
        <p className="px-1 text-[11px] font-medium text-amber-100/70">
          Lighter ramp-up · not a working set
        </p>
      ) : previous?.weight || lastKg || kind === "extra" ? (
        <p className="px-1 text-[11px] text-muted-foreground">
          {kind === "extra" ? "Extra set · " : ""}
          {durationOnly && (previous?.reps || lastKg)
            ? `Last ${previous?.reps ?? lastKg} min`
            : previous?.weight || lastKg
              ? `Last ${previous?.weight ?? lastKg} ${units.load}${previous?.reps ? ` × ${previous.reps} ${units.work}` : ""}`
              : "Copied from the set above"}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={confirmClear ? "destructive" : "outline"}
          className="h-9 shrink-0 px-2.5 text-xs"
          onClick={requestClear}
        >
          {confirmClear ? "Tap again" : kind === "warmup" ? "Clear warm-up" : "Clear set"}
        </Button>
        <Button
          type="button"
          variant={set.done ? "default" : "outline"}
          className={cn(
            "h-11 min-w-0 flex-1",
            kind === "warmup" && !set.done && "border-amber-700/50 text-amber-100",
          )}
          onClick={() => {
            cancelClear();
            onChange({
              ...set,
              weight: set.weight ?? startWeight,
              reps: set.reps ?? startReps,
              done: !set.done,
            });
          }}
        >
          {set.done ? <Check className="size-4" /> : null}
          {set.done
            ? kind === "warmup"
              ? "Warm-up saved"
              : "Saved"
            : kind === "warmup"
              ? "Save warm-up"
              : "Save set"}
        </Button>
      </div>
    </div>
  );
}

export function WorkoutSessionView() {
  const {
    athlete,
    todaySession,
    persistSession,
    setAthlete,
    saveSessionProgress,
    completeSession,
    cancelSession,
  } = useTraining();
  const router = useRouter();
  const today = formatDateISO();
  const pick = useSearchParams().get("pick");
  const [openHow, setOpenHow] = useState<string | null>(null);
  const [beforeOpen, setBeforeOpen] = useState<boolean | undefined>(undefined);
  const [afterOpen, setAfterOpen] = useState<boolean | undefined>(undefined);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelWipeOpen, setCancelWipeOpen] = useState(false);
  const [askAfter, setAskAfter] = useState(false);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [pendingExtras, setPendingExtras] = useState<PinnedExercise[]>([]);
  const afterRef = useRef<HTMLDivElement>(null);

  function celebrateDone(name: string, id: string) {
    setJustDone(id);
    toast.success(`${name} done`, {
      description: "All sets logged. Add another if you still have more in the tank.",
    });
    window.setTimeout(() => {
      setJustDone((current) => (current === id ? null : current));
    }, 2400);
  }

  const session = todaysSession(todaySession, today);
  const picked = pick ? dayById(pick) : undefined;
  const viewingSession =
    Boolean(session) && (!picked || picked.id === session?.dayId);
  const day = viewingSession
    ? dayById(session?.dayId ?? "") ?? picked
    : picked;
  const counts = session && viewingSession ? sessionSetCounts(session) : null;

  function startWorkout(id: string) {
    const nextDay = dayById(id);
    if (!nextDay) return;
    const next = createSession(nextDay, today, pendingExtras);
    for (const exercise of next.exercises) {
      const prev = previousSets(athlete, nextDay.id, exercise.exerciseId);
      const ride = cardioKind(exercise.exerciseId);
      const fallback = ride
        ? lastCardioLoad(athlete, ride) ?? lastLoad(athlete, exercise.exerciseId)
        : lastLoad(athlete, exercise.exerciseId);
      const preset = warmupById(exercise.exerciseId);
      if (preset) {
        exercise.sets = preset.steps.map((step, index) => ({
          weight:
            prev[index]?.weight ?? fallback?.weight ?? firstNumber(step.pace),
          reps: prev[index]?.reps ?? fallback?.reps ?? step.minutes,
          done: false,
        }));
        continue;
      }
      exercise.sets = exercise.sets.map((set, index) => ({
        ...set,
        weight: prev[index]?.weight ?? fallback?.weight ?? null,
        reps: prev[index]?.reps ?? fallback?.reps ?? null,
      }));
    }
    persistSession(next);
  }

  function patch(next: WorkoutSession, immediate = false) {
    persistSession(
      { ...next, updatedAt: new Date().toISOString() },
      { immediate },
    );
  }

  function isExpanded(id: string, done: boolean, isFirst: boolean) {
    if (id in expanded) return expanded[id];
    if (done) return false;
    return isFirst;
  }

  function finishSession(current = session) {
    if (!current) return;
    const finished: WorkoutSession = {
      ...current,
      status: "completed",
      finishedAt: new Date().toISOString(),
      feelingAfter: current.feelingAfter ?? emptyAfter(),
      feelingAfterSaved: true,
      updatedAt: new Date().toISOString(),
    };
    completeSession(finished);
    toast.success("Session finished.");
  }

  if (!viewingSession) {
    if (day) {
      const locked = isOpenSession(session, today);
      return (
        <div className="flex grow flex-col">
          <div className="space-y-5">
            <header>
              <Link
                href="/"
                className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
              >
                <ChevronLeft className="size-4" />
                Back
              </Link>
              <div className="flex items-center gap-3">
                <ExerciseMark id={day.id} />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  {day.exercises.length} lifts · preview
                </p>
              </div>
              <h1 className="mt-2 font-heading text-3xl leading-none">{day.title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{day.focus}</p>
            </header>
            <p className="text-sm leading-6 text-muted-foreground">
              {day.id === "warmup"
                ? "This is its own session. Walk, run, or bike. Add extras if you want, then start a lift later the same day."
                : "Still photos and last kg on the list. Tap a row for the GIF on this page, then Back."}
            </p>
            <WorkoutExercisePreview
              exercises={[
                ...day.exercises,
                ...pendingExtras.map((item) =>
                  resolveExercise(item.exerciseId, athlete, item.sets),
                ),
              ]}
            />
            {locked ? null : (
              <AddExerciseButton
                athlete={athlete}
                exclude={[
                  ...day.exercises.map((exercise) => exercise.id),
                  ...pendingExtras.map((item) => item.exerciseId),
                ]}
                onPick={(exercise) => {
                  setPendingExtras((current) => [
                    ...current,
                    {
                      exerciseId: exercise.id,
                      sets: exercise.sets,
                      reps: exercise.reps,
                    },
                  ]);
                  toast.success(`${exercise.name} added to this session`);
                }}
                onCreate={(custom) => {
                  setAthlete(rememberCustom(athlete, custom), { immediate: true });
                  setPendingExtras((current) => [
                    ...current,
                    {
                      exerciseId: custom.id,
                      sets: custom.sets,
                      reps: custom.reps,
                    },
                  ]);
                  toast.success(`${custom.name} saved. Search it next time.`);
                }}
              />
            )}
          </div>
          <div className="sticky bottom-0 z-10 -mx-4 mt-auto bg-transparent px-4 pt-3 pb-2">
            {locked ? (
              <p className="rounded-xl bg-secondary/80 px-3 py-2 text-center text-xs leading-5 text-muted-foreground">
                Preview only. Your current session stays open — use the floating
                button to go back.
              </p>
            ) : (
              <Button size="lg" className="h-12 w-full text-base shadow-lg" onClick={() => startWorkout(day.id)}>
                Start this workout
              </Button>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4 pb-4">
        <header>
          <h1 className="font-heading text-3xl leading-none">Pick a workout</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preview first. You can leave and come back after you start.
          </p>
        </header>
        {workoutCatalog().map((workout) => (
          <Link
            key={workout.id}
            href={`/workout?pick=${workout.id}`}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left"
          >
            <ExerciseMark id={workout.id} />
            <div>
              <p className="font-medium">{workout.title}</p>
              <p className="text-xs text-muted-foreground">
                {workout.exercises.length} lifts · {workout.durationMin} min
              </p>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (!session || !day) return null;

  const bikeMinutes = session.exercises.reduce((sum, logged) => {
    const exercise = resolveExercise(logged.exerciseId, athlete, logged.sets.length);
    if (exercise.group !== "Bike" && warmupById(logged.exerciseId)?.kind !== "bike") {
      return sum;
    }
    return (
      sum +
      logged.sets.reduce((inner, set) => inner + (set.done && set.reps ? set.reps : 0), 0)
    );
  }, 0);
  const hasBike = session.exercises.some((logged) => {
    const exercise = resolveExercise(logged.exerciseId, athlete, logged.sets.length);
    return exercise.group === "Bike" || warmupById(logged.exerciseId)?.kind === "bike";
  });

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {session.status === "completed" ? "Logged" : "In session"}
          </p>
          {counts ? (
            <Badge variant="secondary">
              {counts.completedSets}/{counts.plannedSets} sets
            </Badge>
          ) : null}
        </div>
        <h1 className="font-heading text-3xl leading-none">{day.title}</h1>
        <div className="flex items-center justify-between gap-3">
          <Link href="/week" className="text-sm text-muted-foreground underline">
            Browse other lifts
          </Link>
          {session.status === "in_progress" ? (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="text-sm text-muted-foreground underline"
            >
              Cancel session
            </button>
          ) : null}
        </div>
      </header>

      <Card>
        <button
          type="button"
          onClick={() =>
            setBeforeOpen((value) =>
              !(value ?? !session.feelingBeforeSaved),
            )
          }
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div>
            <p className="text-base font-medium">Before you lift</p>
            {!(beforeOpen ?? !session.feelingBeforeSaved) ? (
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                {session.feelingBeforeSaved ? "Saved · " : ""}
                {session.timeOfDay} · energy {session.feelingBefore.energy}/5
              </p>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              (beforeOpen ?? !session.feelingBeforeSaved) && "rotate-180",
            )}
          />
        </button>
        {(beforeOpen ?? !session.feelingBeforeSaved) ? (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-4 gap-1.5">
              {TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => patch({ ...session, timeOfDay: time })}
                  className={cn(
                    "h-10 rounded-lg text-[11px] font-medium capitalize",
                    session.timeOfDay === time
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {suggestedWindow(session.timeOfDay)}
            </p>
            <ScoreRow
              label="Energy"
              value={session.feelingBefore.energy}
              onChange={(energy) =>
                patch({
                  ...session,
                  feelingBefore: { ...session.feelingBefore, energy },
                })
              }
              low="Flat"
              high="Ready"
            />
            <ScoreRow
              label="Sleep last night"
              value={session.feelingBefore.sleep}
              onChange={(sleep) =>
                patch({
                  ...session,
                  feelingBefore: { ...session.feelingBefore, sleep },
                })
              }
              low="Rough"
              high="Deep"
            />
            <ScoreRow
              label="Soreness"
              value={session.feelingBefore.soreness}
              onChange={(soreness) =>
                patch({
                  ...session,
                  feelingBefore: { ...session.feelingBefore, soreness },
                })
              }
              low="Fresh"
              high="Beat up"
            />
            <Textarea
              placeholder="Anything that should change the plan today?"
              value={session.feelingBefore.notes}
              onChange={(event) =>
                patch({
                  ...session,
                  feelingBefore: {
                    ...session.feelingBefore,
                    notes: event.target.value,
                  },
                })
              }
            />
            <Button
              className="h-11 w-full"
              onClick={() => {
                patch({ ...session, feelingBeforeSaved: true }, true);
                setBeforeOpen(false);
                toast.success("Check-in saved");
              }}
            >
              Save check-in
            </Button>
          </CardContent>
        ) : null}
      </Card>

      {session.warmup ? (
        <WarmupCard
          warmup={session.warmup}
          onDone={() =>
            patch({ ...session, warmup: { ...session.warmup!, done: true } }, true)
          }
        />
      ) : null}

      {session.exercises.map((logged, exerciseIndex) => {
        const exercise = resolveExercise(
          logged.exerciseId,
          athlete,
          logged.sets.length,
        );
        const live = session;
        const fromProgram = day.exercises.some((item) => item.id === exercise.id);
        const prev = previousSets(athlete, session.dayId, exercise.id);
        const load = lastLoad(athlete, exercise.id);
        const howOpen = openHow === exercise.id;
        const done = liftIsDone(logged);
        const open = isExpanded(exercise.id, done, exerciseIndex === 0);
        function toggleHow() {
          setOpenHow((current) => (current === exercise.id ? null : exercise.id));
        }

        const workLogged = workingSets(logged.sets);
        const warmLogged = warmupSets(logged.sets);
        const extraCount = Math.max(0, workLogged.length - exercise.sets);
        const units = cardioUnits(exercise.group);
        const ride = cardioKind(exercise.id, exercise.group);
        const rideLoad = ride ? lastCardioLoad(athlete, ride) ?? load : load;
        const allowWarmup = units.only !== "work" && !ride;
        const seedKg = load?.weight ?? prev[0]?.weight ?? exercise.defaultLoad ?? units.fallbackLoad;
        const warmupGuess = suggestedWarmup(
          seedKg,
          logged.sets,
          units.loadStep,
        );
        const prevWarm = previousWarmupSets(athlete, session.dayId, exercise.id);

        return (
          <Card
            key={exercise.id}
            className={cn(
              "transition-[box-shadow,background-color,ring-color]",
              done && "bg-primary/[0.06] ring-primary/25",
              justDone === exercise.id && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={toggleHow}
                className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary"
                aria-label={`How to do ${exercise.name}`}
              >
                <ExerciseThumb exerciseId={exercise.id} name={exercise.name} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setExpanded((current) => ({
                    ...current,
                    [exercise.id]: !open,
                  }))
                }
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {exerciseIndex + 1} · {exercise.group}
                    {fromProgram ? "" : " · added"}
                  </p>
                  <p className="truncate font-medium leading-tight">{exercise.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ride
                      ? `${workLogged.length} ${workLogged.length === 1 ? "block" : "blocks"} · ${workLogged.reduce((sum, set) => sum + (set.reps ?? 0), 0) || "—"} min`
                      : `${workLogged.filter((set) => set.done).length}/${workLogged.length} sets`}
                    {warmLogged.length > 0 ? ` · ${warmLogged.length} warm-up` : ""}
                    {extraCount > 0 ? ` · +${extraCount} extra` : ""}
                    {ride && rideLoad
                      ? ride === "bike"
                        ? ` · last lvl ${rideLoad.weight}`
                        : ` · last ${rideLoad.weight} km/h`
                      : load
                        ? load.weight === 0
                          ? ` · last BW${load.reps ? ` × ${load.reps}` : ""}`
                          : ` · last ${load.weight} ${units.load}`
                      : ""}
                  </p>
                </div>
                {done ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    <Check className="size-3.5" />
                    Done
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>
            </div>
            {howOpen ? (
              <div className="px-4 pb-3">
                <ExerciseHowPanel
                  exercise={exercise}
                  open={howOpen}
                  onClose={() => setOpenHow(null)}
                />
              </div>
            ) : null}
            {open ? (
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center justify-between gap-3">
                  <ExerciseMark id={exercise.id} size="sm" />
                  <div className="flex items-center gap-2">
                    <ExerciseHowButton
                      open={howOpen}
                      onToggle={toggleHow}
                    />
                    {done ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                        <Check className="size-4" />
                        Marked done
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => {
                          const startWeight =
                            (ride ? rideLoad?.weight : load?.weight) ??
                            prev[0]?.weight ??
                            exercise.defaultLoad ??
                            units.fallbackLoad;
                          const startReps = ride
                            ? prev[0]?.reps ?? rideLoad?.reps ?? 10
                            : prev[0]?.reps ?? 8;
                          const exercises = session.exercises.map((item) =>
                            item.exerciseId === exercise.id
                              ? {
                                  ...item,
                                  done: true,
                                  sets: item.sets.map((set) =>
                                    set.warmup
                                      ? set
                                      : {
                                          ...set,
                                          weight: set.weight ?? startWeight,
                                          reps: set.reps ?? startReps,
                                          done: true,
                                        },
                                  ),
                                }
                              : item,
                          );
                          patch({ ...session, exercises }, true);
                          celebrateDone(exercise.name, exercise.id);
                          setExpanded((current) => ({
                            ...current,
                            [exercise.id]: false,
                          }));
                          setOpenHow(null);
                        }}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
                {ride ? (
                  <CardioRide
                    kind={ride}
                    sets={logged.sets}
                    lastLoad={rideLoad?.weight}
                    lastMinutes={rideLoad?.reps}
                    locked={session.status === "completed"}
                    onChange={(sets) => {
                      const exercises = session.exercises.map((item) =>
                        item.exerciseId === exercise.id
                          ? {
                              ...item,
                              sets,
                              done: liftIsDone({ ...item, sets, done: false }),
                            }
                          : item,
                      );
                      const nowDone = Boolean(
                        exercises.find((item) => item.exerciseId === exercise.id)
                          ?.done,
                      );
                      patch({ ...session, exercises }, nowDone);
                      if (nowDone && !done) {
                        celebrateDone(exercise.name, exercise.id);
                        setExpanded((current) => ({
                          ...current,
                          [exercise.id]: false,
                        }));
                      }
                    }}
                  />
                ) : null}
                {session.status !== "completed" && allowWarmup ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 w-full min-w-0"
                    onClick={() => {
                      if (warmLogged.length >= 6) {
                        toast.message("That's enough warm-up sets for this lift.");
                        return;
                      }
                      const guess = suggestedWarmup(
                        seedKg,
                        logged.sets,
                        units.loadStep,
                      );
                      const lastWarm = warmLogged[warmLogged.length - 1];
                      const remembered = prevWarm[warmLogged.length];
                      const exercises = session.exercises.map((item) =>
                        item.exerciseId === exercise.id
                          ? {
                              ...item,
                              sets: insertWarmupSet(item.sets, {
                                weight:
                                  remembered?.weight ??
                                  lastWarm?.weight ??
                                  guess.weight,
                                reps:
                                  remembered?.reps ??
                                  lastWarm?.reps ??
                                  guess.reps,
                                done: false,
                                warmup: true,
                              }),
                            }
                          : item,
                      );
                      patch({ ...session, exercises });
                      setExpanded((current) => ({
                        ...current,
                        [exercise.id]: true,
                      }));
                    }}
                  >
                    <Flame className="size-4" />
                    Warm-up set
                    {warmupGuess.weight === 0
                      ? " · BW"
                      : warmupGuess.weight
                        ? ` · ${warmupGuess.weight} ${units.load}`
                        : ""}
                  </Button>
                ) : null}
                {ride
                  ? null
                  : (() => {
                      function rowFor(set: LoggedSet, index: number) {
                        const warmupIndex = set.warmup
                          ? logged.sets.slice(0, index).filter((entry) => entry.warmup)
                              .length
                          : -1;
                        const workIndex = set.warmup
                          ? -1
                          : logged.sets.slice(0, index).filter((entry) => !entry.warmup)
                              .length;
                        const kind = set.warmup
                          ? "warmup"
                          : workIndex >= exercise.sets
                            ? "extra"
                            : "work";
                        const previous = set.warmup
                          ? prevWarm[warmupIndex] ??
                            (warmupIndex > 0 ? warmLogged[warmupIndex - 1] : undefined)
                          : prev[workIndex] ??
                            (workIndex > 0 ? workLogged[workIndex - 1] : undefined);
                        return (
                          <SetRow
                            key={
                              set.warmup
                                ? `${exercise.id}-wu-${warmupIndex}`
                                : `${exercise.id}-work-${workIndex}`
                            }
                            label={
                              set.warmup
                                ? String(warmupIndex + 1)
                                : String(workIndex + 1)
                            }
                            set={set}
                            previous={previous}
                            lastKg={set.warmup ? null : load?.weight}
                            kind={kind}
                            units={units}
                            fallbackLoad={exercise.defaultLoad ?? units.fallbackLoad}
                            onRemove={
                              kind === "work"
                                ? undefined
                                : () => {
                                    const exercises = live.exercises.map((item) => {
                                      if (item.exerciseId !== exercise.id) return item;
                                      const sets = item.sets.filter(
                                        (_, setIndex) => setIndex !== index,
                                      );
                                      return {
                                        ...item,
                                        sets,
                                        done: liftIsDone({ ...item, sets, done: false }),
                                      };
                                    });
                                    patch({ ...live, exercises }, true);
                                  }
                            }
                            onChange={(nextSet) => {
                              const exercises = live.exercises.map((item) => {
                                if (item.exerciseId !== exercise.id) return item;
                                const sets = item.sets.map((current, setIndex) =>
                                  setIndex === index
                                    ? { ...nextSet, warmup: Boolean(set.warmup) }
                                    : current,
                                );
                                return {
                                  ...item,
                                  sets,
                                  done: liftIsDone({ ...item, sets, done: false }),
                                };
                              });
                              const nowDone = Boolean(
                                exercises.find((item) => item.exerciseId === exercise.id)
                                  ?.done,
                              );
                              patch({ ...live, exercises }, nextSet.done);
                              if (nextSet.done && nowDone && !done) {
                                celebrateDone(exercise.name, exercise.id);
                                setExpanded((current) => ({
                                  ...current,
                                  [exercise.id]: false,
                                }));
                              }
                            }}
                          />
                        );
                      }
                      const warmupRows = logged.sets.flatMap((set, index) =>
                        set.warmup ? [rowFor(set, index)] : [],
                      );
                      const workRows = logged.sets.flatMap((set, index) =>
                        set.warmup ? [] : [rowFor(set, index)],
                      );
                      return (
                        <>
                          {warmupRows.length > 0 ? (
                            <div className="space-y-2 rounded-2xl border border-amber-700/30 bg-amber-950/25 p-2">
                              <p className="flex items-center gap-1.5 px-1 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/85">
                                <Flame className="size-3.5" />
                                Warm-up
                              </p>
                              {warmupRows}
                            </div>
                          ) : null}
                          {workRows.length > 0 && warmupRows.length > 0 ? (
                            <p className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Working sets
                            </p>
                          ) : null}
                          {workRows}
                        </>
                      );
                    })()}
                {session.status !== "completed" && !ride ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full min-w-0"
                    onClick={() => {
                      if (workLogged.length >= exercise.sets + 8) {
                        toast.message("That's enough extra sets for this lift.");
                        return;
                      }
                      const last = workLogged[workLogged.length - 1];
                      const startWeight =
                        last?.weight ??
                        load?.weight ??
                        prev[0]?.weight ??
                        exercise.defaultLoad ??
                        units.fallbackLoad;
                      const startReps = last?.reps ?? prev[0]?.reps ?? 8;
                      const exercises = session.exercises.map((item) =>
                        item.exerciseId === exercise.id
                          ? {
                              ...item,
                              done: false,
                              sets: [
                                ...item.sets,
                                {
                                  weight: startWeight,
                                  reps: startReps,
                                  done: false,
                                },
                              ],
                            }
                          : item,
                      );
                      patch({ ...session, exercises });
                      setExpanded((current) => ({
                        ...current,
                        [exercise.id]: true,
                      }));
                    }}
                  >
                    <Plus className="size-4" />
                    Add a set
                  </Button>
                ) : null}
              </CardContent>
            ) : null}
          </Card>
        );
      })}

      {hasBike ? (
        <BikeStatsCard
          date={session.date}
          stats={session.bikeStats}
          minutesGuess={bikeMinutes || undefined}
          onSave={(bikeStats) => patch({ ...session, bikeStats }, true)}
        />
      ) : null}

      {session.status !== "completed" ? (
        <AddExerciseButton
          athlete={athlete}
          exclude={session.exercises.map((item) => item.exerciseId)}
          onPick={(exercise) => {
            const prev = previousSets(athlete, session.dayId, exercise.id);
            const fallback = lastLoad(athlete, exercise.id);
            persistSession(
              {
                ...session,
                exercises: [
                  ...session.exercises,
                  {
                    exerciseId: exercise.id,
                    sets: blankSets(exercise.sets).map((set, index) => ({
                      ...set,
                      weight: prev[index]?.weight ?? fallback?.weight ?? null,
                      reps: prev[index]?.reps ?? fallback?.reps ?? null,
                    })),
                  },
                ],
                updatedAt: new Date().toISOString(),
              },
              { immediate: true },
            );
            setExpanded((current) => ({ ...current, [exercise.id]: true }));
            toast.success(`${exercise.name} added to this session`);
          }}
          onCreate={(custom) => {
            persistSession(
              {
                ...session,
                exercises: [
                  ...session.exercises,
                  { exerciseId: custom.id, sets: blankSets(custom.sets) },
                ],
                updatedAt: new Date().toISOString(),
              },
              {
                athlete: rememberCustom(athlete, custom),
                immediate: true,
              },
            );
            setExpanded((current) => ({ ...current, [custom.id]: true }));
            toast.success(`${custom.name} saved. Search it next time.`);
          }}
        />
      ) : null}

      {(counts && counts.completedSets > 0) ||
      session.status === "completed" ||
      askAfter ||
      session.feelingAfterSaved ? (
        <div ref={afterRef}>
        <Card>
          <button
            type="button"
            onClick={() =>
              setAfterOpen((value) => !(value ?? askAfter))
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div>
              <p className="text-base font-medium">How you feel after</p>
              {!(afterOpen ?? askAfter) ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {session.feelingAfterSaved
                    ? `Saved · pump ${session.feelingAfter?.pump ?? 3}/5`
                    : "Tap when you are done"}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                (afterOpen ?? askAfter) && "rotate-180",
              )}
            />
          </button>
          {(afterOpen ?? askAfter) ? (
          <CardContent className="space-y-4 pt-0">
            <ScoreRow
              label="Pump"
              value={session.feelingAfter?.pump ?? 3}
              onChange={(pump) =>
                patch({
                  ...session,
                  feelingAfter: { ...(session.feelingAfter ?? emptyAfter()), pump },
                })
              }
              low="None"
              high="Skin tight"
            />
            <ScoreRow
              label="Joints"
              value={session.feelingAfter?.joints ?? 2}
              onChange={(joints) =>
                patch({
                  ...session,
                  feelingAfter: {
                    ...(session.feelingAfter ?? emptyAfter()),
                    joints,
                  },
                })
              }
              low="Quiet"
              high="Angry"
            />
            <ScoreRow
              label="Fatigue"
              value={session.feelingAfter?.fatigue ?? 3}
              onChange={(fatigue) =>
                patch({
                  ...session,
                  feelingAfter: {
                    ...(session.feelingAfter ?? emptyAfter()),
                    fatigue,
                  },
                })
              }
              low="Could do more"
              high="Cooked"
            />
            <ScoreRow
              label="Mood"
              value={session.feelingAfter?.mood ?? 3}
              onChange={(mood) =>
                patch({
                  ...session,
                  feelingAfter: { ...(session.feelingAfter ?? emptyAfter()), mood },
                })
              }
              low="Off"
              high="Locked in"
            />
            <Textarea
              placeholder="Elbows, pump quality, what felt strong…"
              value={session.feelingAfter?.notes ?? ""}
              onChange={(event) =>
                patch({
                  ...session,
                  feelingAfter: {
                    ...(session.feelingAfter ?? emptyAfter()),
                    notes: event.target.value,
                  },
                })
              }
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {FEEL_GUIDE.afterGood} {FEEL_GUIDE.food}
            </p>
            {session.status !== "completed" ? (
              <Button
                className="h-11 w-full"
                onClick={() => {
                  const next = {
                    ...session,
                    feelingAfter: session.feelingAfter ?? emptyAfter(),
                    feelingAfterSaved: true,
                  };
                  patch(next, true);
                  setAfterOpen(false);
                  setAskAfter(false);
                  if (askAfter) finishSession(next);
                  else toast.success("After check-in saved");
                }}
              >
                {askAfter ? "Save and finish" : "Save after check-in"}
              </Button>
            ) : null}
          </CardContent>
          ) : null}
        </Card>
        </div>
      ) : null}

      {session.status !== "completed" ? (
        <div className="space-y-2">
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full text-base"
            onClick={() => {
              saveSessionProgress(session);
              toast.success("Progress saved. Session stays open.");
            }}
          >
            Save progress
          </Button>
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={() => {
              if (!session.feelingAfterSaved) {
                setAskAfter(true);
                setAfterOpen(true);
                toast.message("How did that feel?");
                window.setTimeout(() => {
                  afterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
                return;
              }
              finishSession();
            }}
          >
            Finish session
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            {counts?.completedSets ?? 0} sets. Save progress keeps it open.
            Finish asks how you feel after, then always saves. Cancel is only if
            you want out.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Saved. Those loads come back the next time you run this workout.
          </p>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-secondary text-sm font-medium"
          >
            Start another session
          </Link>
        </div>
      )}

      <DangerConfirm
        open={cancelWipeOpen}
        onOpenChange={setCancelWipeOpen}
        title="Throw away today's kg?"
        description="This drops the session and deletes today's last loads, lift history, and bike stats for this date. Older days stay."
        confirmLabel="Delete today's progress"
        onConfirm={() => {
          cancelSession(session, false);
          toast.success("Session removed.");
          router.replace("/");
        }}
      />
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this session?</DialogTitle>
            <DialogDescription>
              Finish always saves. This is only if you want to drop the session.
              Default is keep the kg you already logged. Removing progress asks
              twice — that can wipe today’s last loads.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="h-11 w-full"
              onClick={() => {
                cancelSession(session, true);
                setCancelOpen(false);
                toast.success("Session closed. Progress kept.");
                router.replace("/");
              }}
            >
              Save progress and close
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                setCancelOpen(false);
                setCancelWipeOpen(true);
              }}
            >
              Remove progress
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full"
              onClick={() => setCancelOpen(false)}
            >
              Keep training
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
