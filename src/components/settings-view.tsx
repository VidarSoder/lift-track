"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import { formatNiceDate } from "@/lib/dates";
import { liftsByExercise, stretchesByExercise } from "@/lib/lifts";
import { displaySessionCounts } from "@/lib/session";
import { latestWeight, weightDelta, weightLog } from "@/lib/weight";

export function SettingsView() {
  const { athlete } = useTraining();
  const log = weightLog(athlete);
  const current = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const lifts = liftsByExercise(athlete);
  const stretches = stretchesByExercise(athlete);
  const sessionCounts = displaySessionCounts(athlete);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">You</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Open a card to dig into weight, lifts, stretches, or session history.
        </p>
      </header>

      <div className="space-y-2">
        <Link href="/settings/weight" className="block">
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between gap-3 pt-5 pb-5">
              <div className="min-w-0">
                <p className="text-base font-medium">Body weight</p>
                <p className="mt-1 text-2xl font-semibold">
                  {current ? `${current.kg.toFixed(1)} kg` : "Not logged"}
                </p>
                {delta ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {delta.kg > 0 ? "+" : ""}
                    {delta.kg} kg since {formatNiceDate(delta.from.date)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.length > 0
                      ? `${log.length} weigh-in${log.length === 1 ? "" : "s"} logged`
                      : "Add a weigh-in and start the history."}
                  </p>
                )}
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/lifts" className="block">
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between gap-3 pt-5 pb-5">
              <div className="min-w-0">
                <p className="text-base font-medium">Lifts & PRs</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lifts.length > 0
                    ? `${lifts.length} lift${lifts.length === 1 ? "" : "s"} · ${Object.keys(athlete.prs).length} PR${Object.keys(athlete.prs).length === 1 ? "" : "s"}`
                    : "Working sets, warm-ups, and charts per lift."}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/stretches" className="block">
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between gap-3 pt-5 pb-5">
              <div className="min-w-0">
                <p className="text-base font-medium">Stretch log</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stretches.length > 0
                    ? `${stretches.length} stretch${stretches.length === 1 ? "" : "es"} tracked`
                    : "Mobility moves from stretch sessions."}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/sessions" className="block">
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between gap-3 pt-5 pb-5">
              <div className="min-w-0">
                <p className="text-base font-medium">Sessions</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sessionCounts.training} training
                  {sessionCounts.stretch > 0
                    ? ` · ${sessionCounts.stretch} stretch`
                    : ""}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
