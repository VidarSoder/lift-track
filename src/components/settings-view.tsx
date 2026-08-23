"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import { formatNiceDate } from "@/lib/dates";
import { latestWeight, weightDelta, weightLog } from "@/lib/weight";

export function SettingsView() {
  const { athlete } = useTraining();
  const log = weightLog(athlete);
  const current = latestWeight(athlete);
  const delta = weightDelta(athlete);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">You</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Body weight and the few things the log needs.
        </p>
      </header>

      <Link href="/settings/weight" className="block">
        <Card className="transition-colors hover:bg-muted/30">
          <CardContent className="flex items-center justify-between gap-3 pt-5">
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
                    : "Tap to add a weigh-in and start the history."}
                </p>
              )}
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
