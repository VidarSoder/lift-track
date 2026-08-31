"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SessionDaysChart } from "@/components/session-days-chart";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import { formatNiceDate } from "@/lib/dates";
import { displaySessionCounts } from "@/lib/session";
import { fetchSessionPage } from "@/lib/store";
import type { SessionSummary } from "@/lib/types";
import { latestWeight, weightDelta, weightLog } from "@/lib/weight";

export function SettingsView() {
  const { athlete } = useTraining();
  const log = weightLog(athlete);
  const current = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const sessionCounts = displaySessionCounts(athlete);
  const [sessions, setSessions] = useState<SessionSummary[]>(athlete.recent);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const page = await fetchSessionPage({ kind: "all", limit: 200 });
      if (cancelled || !page) return;
      setSessions(page.items.length > 0 ? page.items : athlete.recent);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [athlete.recent]);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">You</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Session cadence up top. Weight and the full session log below.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Session chart</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Cumulative days you trained — stretch as a second line when you
              want it.
            </p>
          </div>
          <SessionDaysChart sessions={sessions} />
        </CardContent>
      </Card>

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
                  {" · "}
                  timeline & filters
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
