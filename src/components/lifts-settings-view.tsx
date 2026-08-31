"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import { resolveExercise } from "@/lib/exercises";
import { formatLiftPoint, liftsByExercise } from "@/lib/lifts";

export function LiftsSettingsView() {
  const { athlete } = useTraining();
  const lifts = liftsByExercise(athlete);
  const prs = Object.entries(athlete.prs)
    .map(([id, pr]) => {
      const exercise = resolveExercise(id, athlete);
      return { id, name: exercise.name, group: exercise.group, ...pr };
    })
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <BackLink href="/settings" label="Settings" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Lifts</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Working-set history per lift. Open one for warm-up vs work charts.
          PRs need two loaded lifts in the same training session.
        </p>
      </header>

      {prs.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Personal records
          </p>
          {prs.map((pr) => (
            <Link
              key={pr.id}
              href={`/settings/lifts/detail?id=${encodeURIComponent(pr.id)}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="flex items-center justify-between gap-3 pt-4 pb-4">
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{pr.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pr.weight} kg × {pr.reps}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          All lifts
        </p>
        {lifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Finish a training session with logged sets and lifts show up here.
          </p>
        ) : (
          lifts.map((item) => (
            <Link
              key={item.exerciseId}
              href={`/settings/lifts/detail?id=${encodeURIComponent(item.exerciseId)}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <ExerciseMark id={item.exerciseId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.group} · {formatLiftPoint(item.last)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
