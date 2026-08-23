"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronLeft, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { FEEL_GUIDE, dayById } from "@/data/program";
import { isOpenSession, todaysSession } from "@/lib/active-session";
import { formatDateISO, suggestedWindow } from "@/lib/dates";
import { workoutCatalog } from "@/lib/suggest";
import {
  blankSets,
  createSession,
  emptyAfter,
  lastLoad,
  liftIsDone,
  previousSets,
  sessionSetCounts,
} from "@/lib/session";
import { cardioUnits, firstNumber, warmupById } from "@/data/warmup";
import { rememberCustom, resolveExercise } from "@/lib/exercises";
import type { LoggedSet, PinnedExercise, TimeOfDay, WorkoutSession } from "@/lib/types";
import {
  ExerciseHowButton,
  ExerciseHowPanel,
  ExerciseThumb,
  WorkoutExercisePreview,
} from "@/components/exercise-guide";
import { AddExerciseButton } from "@/components/add-exercise";
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

function nudge(value: number | null, step: number, fallback: number) {
  const next = (value ?? fallback) + step;
  return Math.max(0, Number(next.toFixed(1)));
}

function Stepper({
  value,
  unit,
  onMinus,
  onPlus,
}: {
  value: number | null;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between rounded-lg bg-background px-1 py-1">
      <button type="button" className="grid size-9 shrink-0 place-items-center" onClick={onMinus}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-0 text-center text-sm font-semibold">
        {value ?? "—"}
        <span className="block text-[10px] font-normal text-muted-foreground">{unit}</span>
      </span>
      <button type="button" className="grid size-9 shrink-0 place-items-center" onClick={onPlus}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function SetRow({
  index,
  set,
  previous,
  lastKg,
  extra,
  units = cardioUnits(""),
  onChange,
  onRemove,
}: {
  index: number;
  set: LoggedSet;
  previous?: LoggedSet;
  lastKg?: number | null;
  extra?: boolean;
  units?: ReturnType<typeof cardioUnits>;
  onChange: (set: LoggedSet) => void;
  onRemove?: () => void;
}) {
  const startWeight = previous?.weight ?? lastKg ?? units.fallbackLoad;
  const startReps =
    previous?.reps ??
    (units.only === "work" ? units.fallbackLoad : units.work === "min" ? 6 : 8);
  const durationOnly = units.only === "work";
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  function cancelClear() {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setConfirmClear(false);
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
        set.done
          ? "border-primary/35 bg-primary/10"
          : "border-transparent bg-secondary/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center text-xs font-medium text-muted-foreground">
          {index + 1}
        </span>
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
              onMinus={() => {
                cancelClear();
                onChange({
                  ...set,
                  weight: nudge(set.weight, -units.loadStep, startWeight),
                });
              }}
              onPlus={() => {
                cancelClear();
                onChange({
                  ...set,
                  weight: nudge(set.weight, units.loadStep, startWeight),
                });
              }}
            />
          )}
          <Stepper
            value={set.reps}
            unit={units.work}
            onMinus={() => {
              cancelClear();
              onChange({
                ...set,
                reps: nudge(set.reps, -units.workStep, startReps),
              });
            }}
            onPlus={() => {
              cancelClear();
              onChange({
                ...set,
                reps: nudge(set.reps, units.workStep, startReps),
              });
            }}
          />
        </div>
        {extra && onRemove ? (
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground"
            aria-label={`Remove extra set ${index + 1}`}
            onClick={onRemove}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {previous?.weight || lastKg || extra ? (
        <p className="px-1 text-[11px] text-muted-foreground">
          {extra ? "Extra set · " : ""}
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
          {confirmClear ? "Tap again" : "Clear set"}
        </Button>
        <Button
          type="button"
          variant={set.done ? "default" : "outline"}
          className="h-11 min-w-0 flex-1"
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
          {set.done ? "Saved" : "Save set"}
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
      const fallback = lastLoad(athlete, exercise.exerciseId);
      const preset = warmupById(exercise.exerciseId);
      if (preset) {
        exercise.sets = preset.steps.map((step, index) => ({
          weight:
            prev[index]?.weight ?? fallback?.weight ?? firstNumber(step.pace),
          reps: prev[index]?.reps ?? step.minutes,
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
                ? "This is its own session. Walk, run, bike, or the arm-care circuit. Add extras if you want, then start a lift later the same day."
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
        const fromProgram = day.exercises.some((item) => item.id === exercise.id);
        const prev = previousSets(athlete, session.dayId, exercise.id);
        const load = lastLoad(athlete, exercise.id);
        const howOpen = openHow === exercise.id;
        const done = liftIsDone(logged);
        const open = isExpanded(exercise.id, done, exerciseIndex === 0);
        const doneSets = logged.sets.filter((set) => set.done).length;
        function toggleHow() {
          setOpenHow((current) => (current === exercise.id ? null : exercise.id));
        }

        const extraCount = Math.max(0, logged.sets.length - exercise.sets);
        const units = cardioUnits(exercise.group);

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
                    {doneSets}/{logged.sets.length} sets
                    {extraCount > 0 ? ` · +${extraCount} extra` : ""}
                    {load ? ` · last ${load.weight} ${units.load}` : ""}
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
                          const startWeight = load?.weight ?? prev[0]?.weight ?? 20;
                          const startReps = prev[0]?.reps ?? 8;
                          const exercises = session.exercises.map((item) =>
                            item.exerciseId === exercise.id
                              ? {
                                  ...item,
                                  done: true,
                                  sets: item.sets.map((set) => ({
                                    ...set,
                                    weight: set.weight ?? startWeight,
                                    reps: set.reps ?? startReps,
                                    done: true,
                                  })),
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
                {logged.sets.map((set, index) => (
                  <SetRow
                    key={`${exercise.id}-${index}`}
                    index={index}
                    set={set}
                    previous={prev[index] ?? (index > 0 ? logged.sets[index - 1] : undefined)}
                    lastKg={load?.weight}
                    extra={index >= exercise.sets}
                    units={units}
                    onRemove={
                      index >= exercise.sets
                        ? () => {
                            const exercises = session.exercises.map((item) => {
                              if (item.exerciseId !== exercise.id) return item;
                              const sets = item.sets.filter((_, setIndex) => setIndex !== index);
                              return {
                                ...item,
                                sets,
                                done: sets.length > 0 && sets.every((entry) => entry.done),
                              };
                            });
                            patch({ ...session, exercises }, true);
                          }
                        : undefined
                    }
                    onChange={(nextSet) => {
                      const exercises = session.exercises.map((item) => {
                        if (item.exerciseId !== exercise.id) return item;
                        const sets = item.sets.map((current, setIndex) =>
                          setIndex === index ? nextSet : current,
                        );
                        const allDone = sets.every((entry) => entry.done);
                        return { ...item, sets, done: allDone };
                      });
                      const nowDone = Boolean(
                        exercises.find((item) => item.exerciseId === exercise.id)
                          ?.done,
                      );
                      patch({ ...session, exercises }, nextSet.done);
                      if (nextSet.done && nowDone && !done) {
                        celebrateDone(exercise.name, exercise.id);
                        setExpanded((current) => ({
                          ...current,
                          [exercise.id]: false,
                        }));
                      }
                    }}
                  />
                ))}
                {session.status !== "completed" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full min-w-0"
                    onClick={() => {
                      if (logged.sets.length >= exercise.sets + 8) {
                        toast.message("That's enough extra sets for this lift.");
                        return;
                      }
                      const last = logged.sets[logged.sets.length - 1];
                      const startWeight =
                        last?.weight ?? load?.weight ?? prev[0]?.weight ?? 20;
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this session?</DialogTitle>
            <DialogDescription>
              Finish always saves. This is only if you want to drop the session.
              Default is keep the kg you already logged.
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
                cancelSession(session, false);
                setCancelOpen(false);
                toast.success("Session removed.");
                router.replace("/");
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
