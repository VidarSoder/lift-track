"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { FEEL_GUIDE, dayById } from "@/data/program";
import { isOpenSession } from "@/lib/active-session";
import { formatDateISO, suggestedWindow } from "@/lib/dates";
import { workoutCatalog } from "@/lib/suggest";
import {
  createSession,
  emptyAfter,
  lastLoad,
  previousSets,
  sessionSetCounts,
} from "@/lib/session";
import type { LoggedSet, TimeOfDay, WorkoutSession } from "@/lib/types";
import {
  ExerciseHowButton,
  ExerciseHowPanel,
  WorkoutExercisePreview,
} from "@/components/exercise-guide";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { ScoreRow } from "@/components/score-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIMES: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

function nudge(value: number | null, step: number, fallback: number) {
  const next = (value ?? fallback) + step;
  return Math.max(0, Number(next.toFixed(1)));
}

function SetRow({
  index,
  set,
  previous,
  lastKg,
  onChange,
}: {
  index: number;
  set: LoggedSet;
  previous?: LoggedSet;
  lastKg?: number | null;
  onChange: (set: LoggedSet) => void;
}) {
  const startWeight = previous?.weight ?? lastKg ?? 20;
  const startReps = previous?.reps ?? 8;

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_auto] items-center gap-2 rounded-xl p-2",
        set.done ? "bg-primary/10" : "bg-secondary/60",
      )}
    >
      <span className="text-center text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>
      <div className="flex items-center justify-between rounded-lg bg-background px-1 py-1">
        <button
          type="button"
          className="grid size-9 place-items-center"
          onClick={() =>
            onChange({ ...set, weight: nudge(set.weight, -2.5, startWeight) })
          }
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-12 text-center text-sm font-semibold">
          {set.weight ?? "—"}
          <span className="block text-[10px] font-normal text-muted-foreground">
            kg
          </span>
        </span>
        <button
          type="button"
          className="grid size-9 place-items-center"
          onClick={() =>
            onChange({ ...set, weight: nudge(set.weight, 2.5, startWeight) })
          }
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-background px-1 py-1">
        <button
          type="button"
          className="grid size-9 place-items-center"
          onClick={() =>
            onChange({ ...set, reps: nudge(set.reps, -1, startReps) })
          }
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-10 text-center text-sm font-semibold">
          {set.reps ?? "—"}
          <span className="block text-[10px] font-normal text-muted-foreground">
            reps
          </span>
        </span>
        <button
          type="button"
          className="grid size-9 place-items-center"
          onClick={() =>
            onChange({ ...set, reps: nudge(set.reps, 1, startReps) })
          }
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button
        type="button"
        size="sm"
        variant={set.done ? "default" : "outline"}
        className="h-10 px-3"
        onClick={() =>
          onChange({
            ...set,
            weight: set.weight ?? startWeight,
            reps: set.reps ?? startReps,
            done: !set.done,
          })
        }
      >
        {set.done ? "Done" : "Log"}
      </Button>
      {previous?.weight || lastKg ? (
        <p className="col-span-4 px-1 text-[11px] text-muted-foreground">
          Last time: {previous?.weight ?? lastKg} kg
          {previous?.reps ? ` × ${previous.reps}` : ""}
        </p>
      ) : null}
    </div>
  );
}

export function WorkoutSessionView() {
  const { athlete, todaySession, persistSession, completeSession } =
    useTraining();
  const today = formatDateISO();
  const pick = useSearchParams().get("pick");
  const [openHow, setOpenHow] = useState<string | null>(null);

  const session = isOpenSession(todaySession, today)
    ? todaySession
    : todaySession && todaySession.date === today
      ? todaySession
      : undefined;
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
    const next = createSession(nextDay, today);
    for (const exercise of next.exercises) {
      const prev = previousSets(athlete, nextDay.id, exercise.exerciseId);
      const fallback = lastLoad(athlete, exercise.exerciseId);
      exercise.sets = exercise.sets.map((set, index) => ({
        ...set,
        weight: prev[index]?.weight ?? fallback?.weight ?? null,
        reps: prev[index]?.reps ?? fallback?.reps ?? null,
      }));
    }
    persistSession(next);
  }

  function patch(next: WorkoutSession) {
    persistSession({ ...next, updatedAt: new Date().toISOString() });
  }

  if (!viewingSession) {
    if (day) {
      const locked = isOpenSession(session, today);
      return (
        <div className="space-y-5">
          <header>
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
            Still photos and last kg on the list. Tap a row for the GIF on this
            page, then Back.
          </p>
          <WorkoutExercisePreview exercises={day.exercises} />
          <div className="sticky bottom-24 z-10 space-y-2">
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
      <div className="space-y-4">
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

  return (
    <div className="space-y-5">
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
        <Link href="/week" className="inline-block text-sm text-muted-foreground underline">
          Browse other lifts
        </Link>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Before you lift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {day.exercises.map((exercise, exerciseIndex) => {
        const logged = session.exercises.find(
          (item) => item.exerciseId === exercise.id,
        );
        if (!logged) return null;
        const prev = previousSets(athlete, session.dayId, exercise.id);
        const load = lastLoad(athlete, exercise.id);
        const howOpen = openHow === exercise.id;
        return (
          <Card key={exercise.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <ExerciseMark id={exercise.id} />
                  <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {exerciseIndex + 1} · {exercise.group}
                    {exercise.supersetWith ? " · pair" : ""}
                  </p>
                  <CardTitle className="text-lg leading-tight">
                    {exercise.name}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {exercise.sets} × {exercise.reps}
                    {exercise.tempo ? ` · tempo ${exercise.tempo}` : ""}
                    {exercise.restSec ? ` · rest ${exercise.restSec}s` : ""}
                    {load ? ` · last ${load.weight} kg` : ""}
                  </p>
                  </div>
                </div>
                <ExerciseHowButton
                  open={howOpen}
                  onToggle={() =>
                    setOpenHow((current) =>
                      current === exercise.id ? null : exercise.id,
                    )
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <ExerciseHowPanel
                exercise={exercise}
                open={howOpen}
                onClose={() => setOpenHow(null)}
              />
              {logged.sets.map((set, index) => (
                <SetRow
                  key={`${exercise.id}-${index}`}
                  index={index}
                  set={set}
                  previous={prev[index]}
                  lastKg={load?.weight}
                  onChange={(nextSet) => {
                    const exercises = session.exercises.map((item) =>
                      item.exerciseId === exercise.id
                        ? {
                            ...item,
                            sets: item.sets.map((current, setIndex) =>
                              setIndex === index ? nextSet : current,
                            ),
                          }
                        : item,
                    );
                    patch({ ...session, exercises });
                  }}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      {(counts && counts.completedSets > 0) || session.status === "completed" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How you feel after</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      ) : null}

      {session.status !== "completed" ? (
        <div className="space-y-2">
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={() => {
              const finished: WorkoutSession = {
                ...session,
                status: "completed",
                finishedAt: new Date().toISOString(),
                feelingAfter: session.feelingAfter ?? emptyAfter(),
                updatedAt: new Date().toISOString(),
              };
              completeSession(finished);
            }}
          >
            Save progress
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            {counts?.completedSets ?? 0} sets logged. Unfinished lifts are fine —
            only the sets you marked are saved.
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Saved. Those loads come back the next time you run this workout.
        </p>
      )}
    </div>
  );
}
