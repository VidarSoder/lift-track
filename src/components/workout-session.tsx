"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { FEEL_GUIDE, dayById, dayByWeekday } from "@/data/program";
import {
  currentTimeOfDay,
  formatDateISO,
  suggestedWindow,
  timeOfDayLabel,
  weekdayOf,
} from "@/lib/dates";
import {
  createSession,
  emptyAfter,
  previousSets,
  sessionSetCounts,
} from "@/lib/session";
import type { LoggedSet, TimeOfDay, WorkoutSession } from "@/lib/types";
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
  onChange,
}: {
  index: number;
  set: LoggedSet;
  previous?: LoggedSet;
  onChange: (set: LoggedSet) => void;
}) {
  const startWeight = previous?.weight ?? 20;
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
      {previous?.weight ? (
        <p className="col-span-4 px-1 text-[11px] text-muted-foreground">
          Last time: {previous.weight} kg × {previous.reps ?? "?"}
        </p>
      ) : null}
    </div>
  );
}

export function WorkoutSessionView() {
  const { athlete, todaySession, persistSession, completeSession } =
    useTraining();
  const today = formatDateISO();
  const scheduled = dayByWeekday(weekdayOf());
  const [openHow, setOpenHow] = useState<string | null>(null);

  const session = todaySession && todaySession.date === today ? todaySession : undefined;
  const day = session ? dayById(session.dayId) ?? scheduled : scheduled;
  const counts = session ? sessionSetCounts(session) : null;
  const showAfter =
    session?.status === "completed" ||
    (counts !== null && counts.completedSets >= Math.max(1, counts.plannedSets - 1));

  const started = useMemo(() => {
    if (!athlete.programStartDate) return;
    return athlete.programStartDate;
  }, [athlete.programStartDate]);

  function startDay() {
    if (day.exercises.length === 0) {
      const rest = createSession(day, today);
      rest.status = "completed";
      rest.finishedAt = new Date().toISOString();
      rest.feelingAfter = emptyAfter();
      completeSession(rest);
      return;
    }
    const next = createSession(day, today);
    for (const exercise of next.exercises) {
      const prev = previousSets(athlete, day.id, exercise.exerciseId);
      exercise.sets = exercise.sets.map((set, index) => ({
        ...set,
        weight: prev[index]?.weight ?? null,
        reps: prev[index]?.reps ?? null,
      }));
    }
    persistSession(next);
  }

  function patch(next: WorkoutSession) {
    persistSession({ ...next, updatedAt: new Date().toISOString() });
  }

  if (!session) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {day.source}
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-none">{day.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{day.coaching}</p>
        </header>
        <Card>
          <CardContent className="space-y-3 pt-5 text-sm leading-6 text-muted-foreground">
            <p className="text-foreground">
              {timeOfDayLabel(currentTimeOfDay())} · {suggestedWindow(currentTimeOfDay())}
            </p>
            <p>{day.exercises.length} exercises · {day.durationMin} min</p>
            {started ? (
              <p className="text-xs">Program start date {started}. Change it on Progress if needed.</p>
            ) : null}
          </CardContent>
        </Card>
        <Button size="lg" className="h-12 w-full text-base" onClick={startDay}>
          {day.id === "rest" ? "Mark rest day" : "Start this workout"}
        </Button>
      </div>
    );
  }

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
        const open = openHow === exercise.id;
        return (
          <Card key={exercise.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
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
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenHow(open ? null : exercise.id)}
                >
                  How
                  {open ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {open ? (
                <div className="space-y-2 rounded-xl bg-secondary/70 p-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Setup. </span>
                    {exercise.setup}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Make the rep. </span>
                    {exercise.how}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Don&apos;t. </span>
                    {exercise.mistakes}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Add weight when. </span>
                    {exercise.progress}
                  </p>
                </div>
              ) : null}
              {logged.sets.map((set, index) => (
                <SetRow
                  key={`${exercise.id}-${index}`}
                  index={index}
                  set={set}
                  previous={prev[index]}
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

      {(showAfter || session.status === "completed") && (
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
      )}

      {session.status !== "completed" ? (
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
          Finish and save
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Saved. Next {day.id} day will start from these loads.
        </p>
      )}
    </div>
  );
}
