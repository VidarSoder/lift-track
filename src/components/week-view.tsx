"use client";

import Link from "next/link";
import { lastDone, suggestWorkout, workoutCatalog } from "@/lib/suggest";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function WeekView() {
  const { athlete } = useTraining();
  const suggestion = suggestWorkout(athlete);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Library
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Workouts</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Pick what you want. The suggestion only looks at what you have logged
          a lot of lately.
        </p>
      </header>

      <div className="space-y-3">
        {workoutCatalog().map((workout) => {
          const last = lastDone(athlete, workout.id);
          const recommended = workout.id === suggestion.workout.id;
          return (
            <Card key={workout.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium leading-tight">{workout.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {workout.exercises.length} lifts · {workout.durationMin} min
                    </p>
                  </div>
                  {recommended ? <Badge>Suggested</Badge> : null}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {workout.focus}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{last ? `Last ${last}` : "Not logged yet"}</span>
                  <Link href={`/workout?pick=${workout.id}`} className="underline">
                    Start
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
