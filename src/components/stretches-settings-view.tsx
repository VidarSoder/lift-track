"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import { formatLiftPoint, stretchesByExercise } from "@/lib/lifts";

export function StretchesSettingsView() {
  const { athlete } = useTraining();
  const stretches = stretchesByExercise(athlete);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <BackLink href="/settings" label="Settings" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Stretches</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Stretch log by move. Open one for history and charts.
        </p>
      </header>

      {stretches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Finish a stretch session and moves show up here.
        </p>
      ) : (
        <div className="space-y-2">
          {stretches.map((item) => (
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
                      {formatLiftPoint(item.last)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
