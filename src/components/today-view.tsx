"use client";

import Link from "next/link";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import { sessionSetCounts } from "@/lib/session";
import { lastDone, suggestWorkout, workoutCatalog } from "@/lib/suggest";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TodayView() {
  const { athlete, todaySession } = useTraining();
  const today = formatDateISO();
  const suggestion = suggestWorkout(athlete);
  const counts = todaySession ? sessionSetCounts(todaySession) : null;
  const open = todaySession && todaySession.status !== "completed";

  return (
    <div className="space-y-5">
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
            <p className="font-medium">{todaySession.title}</p>
            {counts ? (
              <p className="text-sm text-muted-foreground">
                {counts.completedSets} sets logged. Save whenever — you do not
                have to finish the list.
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
              Start this
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Or pick another</p>
        {workoutCatalog().map((workout) => {
          const last = lastDone(athlete, workout.id);
          const recommended = workout.id === suggestion.workout.id && !open;
          return (
            <Link
              key={workout.id}
              href={`/workout?pick=${workout.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="font-medium leading-tight">{workout.title}</p>
                <p className="text-xs text-muted-foreground">
                  {last ? `Last ${last}` : "Not logged yet"} · {workout.durationMin} min
                </p>
              </div>
              {recommended ? <Badge>Suggested</Badge> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
