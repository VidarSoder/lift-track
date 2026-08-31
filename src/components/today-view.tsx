"use client";

import Link from "next/link";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import { canReopenSession, sessionSetCounts } from "@/lib/session";
import { lastDone, suggestWorkout, workoutCatalog } from "@/lib/suggest";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TodayView() {
  const { athlete, todaySession } = useTraining();
  const today = formatDateISO();
  const suggestion = suggestWorkout(athlete);
  const counts = todaySession ? sessionSetCounts(todaySession) : null;
  const open = isOpenSession(todaySession, today);
  const finishedToday =
    !open &&
    todaySession?.status === "completed" &&
    todaySession.date === today &&
    canReopenSession(todaySession);

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Choose a workout
        </p>
        <h1 className="font-heading text-[2.1rem] leading-none tracking-tight">
          {formatNiceDate(today)}
        </h1>
      </header>

      {open ? (
        <Card className="border-primary/20 bg-primary/8">
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm text-muted-foreground">In progress</p>
            <p className="font-medium">{todaySession?.title}</p>
            {counts ? (
              <p className="text-sm text-muted-foreground">
                {counts.completedSets} sets logged. Finish whenever — even a
                short session counts.
              </p>
            ) : null}
            <Link
              href="/workout"
              className={buttonVariants({
                size: "lg",
                className: "h-12 w-full text-base",
              })}
            >
              Continue
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20 bg-primary/8">
          <CardContent className="space-y-3 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Suggestion
            </p>
            <p className="font-medium">{suggestion.workout.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {suggestion.reason}
            </p>
            <Link
              href={`/workout?pick=${suggestion.workout.id}`}
              className={buttonVariants({
                size: "lg",
                className: "h-12 w-full text-base",
              })}
            >
              Start training
            </Link>
            {finishedToday && todaySession ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Latest finish today: {todaySession.title.split("·")[0].trim()}.
                Start something new above, or reopen any of today’s sessions on{" "}
                <Link href="/progress" className="font-medium text-primary underline">
                  Progress
                </Link>
                .
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Link
        href="/week"
        className="block rounded-2xl border border-border bg-card px-4 py-3"
      >
        <p className="font-medium">Preview every lift first</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Still photos and last kg. Tap a row for the GIF on the page, then Back.
        </p>
      </Link>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {open ? "Preview another workout" : "Or pick another"}
        </p>
        {workoutCatalog().map((workout) => {
          const last = lastDone(athlete, workout.id);
          const recommended = workout.id === suggestion.workout.id && !open;
          const current = open && todaySession?.dayId === workout.id;
          return (
            <Link
              key={workout.id}
              href={current ? "/workout" : `/workout?pick=${workout.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ExerciseMark id={workout.id} />
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{workout.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {current
                      ? "Open session"
                      : last
                        ? `Last ${last}`
                        : "Not logged yet"}{" "}
                    · {workout.durationMin} min
                  </p>
                </div>
              </div>
              {recommended ? <Badge>Suggested</Badge> : null}
              {current ? <Badge variant="secondary">Now</Badge> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
