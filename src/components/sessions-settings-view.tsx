"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import { formatNiceDate } from "@/lib/dates";
import { isStretchDay, isTrainingDay } from "@/lib/session";
import { sessionDocIdFromSummary } from "@/lib/session-id";

export function SessionsSettingsView() {
  const { athlete } = useTraining();
  const training = athlete.recent.filter((item) => isTrainingDay(item.dayId));
  const stretches = athlete.recent.filter((item) => isStretchDay(item.dayId));

  return (
    <div className="space-y-5 pb-4">
      <header>
        <BackLink href="/settings" label="Settings" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Sessions</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Training and stretch sessions stay separate. Open any for the set
          timeline.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Training</p>
            <p className="text-2xl font-semibold">{athlete.sessionsCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Stretch</p>
            <p className="text-2xl font-semibold">
              {athlete.stretchSessionsCompleted ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Training
        </p>
        {training.length === 0 ? (
          <p className="text-sm text-muted-foreground">No training sessions yet.</p>
        ) : (
          training.map((item, index) => {
            const docId = sessionDocIdFromSummary(item);
            const href = docId
              ? `/progress/session?id=${encodeURIComponent(docId)}`
              : `/progress/session?id=${encodeURIComponent(item.date)}`;
            return (
              <Link key={`${item.date}-${item.startedAt ?? index}`} href={href} className="block">
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between gap-3 pt-4 pb-4">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">
                        {item.title.split("·")[0].trim()}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatNiceDate(item.date)} · {item.durationMin} min
                        {item.volume > 0 ? ` · ${item.volume} kg` : ""}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Stretch sessions
        </p>
        {stretches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stretch sessions yet.</p>
        ) : (
          stretches.map((item, index) => {
            const docId = sessionDocIdFromSummary(item);
            const href = docId
              ? `/progress/session?id=${encodeURIComponent(docId)}`
              : `/progress/session?id=${encodeURIComponent(item.date)}`;
            return (
              <Link key={`st-${item.date}-${item.startedAt ?? index}`} href={href} className="block">
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between gap-3 pt-4 pb-4">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">
                        {item.title.split("·")[0].trim()}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatNiceDate(item.date)} · {item.durationMin} min
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
