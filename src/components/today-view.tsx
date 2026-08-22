"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BOOKMARK_HINT, FEEL_GUIDE, TIME_TIPS, dayByWeekday } from "@/data/program";
import {
  currentTimeOfDay,
  formatDateISO,
  formatNiceDate,
  programWeek,
  suggestedWindow,
  timeOfDayLabel,
  weekdayOf,
} from "@/lib/dates";
import { sessionSetCounts } from "@/lib/session";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TodayView() {
  const { athlete, todaySession } = useTraining();
  const today = formatDateISO();
  const scheduled = useMemo(() => dayByWeekday(weekdayOf()), []);
  const week = programWeek(athlete.programStartDate, today);
  const time = currentTimeOfDay();
  const last = athlete.lastByDay[scheduled.id];
  const counts = todaySession ? sessionSetCounts(todaySession) : null;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Week {week} of 6 · {timeOfDayLabel(time)}
        </p>
        <h1 className="font-heading text-[2.1rem] leading-none tracking-tight">
          {formatNiceDate(today)}
        </h1>
        <p className="text-sm text-muted-foreground">{scheduled.title}</p>
      </header>

      <Card className="border-primary/20 bg-primary/8">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">{scheduled.focus}</CardTitle>
            <Badge variant="secondary">{scheduled.durationMin} min</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {scheduled.coaching}
          </p>
          {counts && todaySession?.status === "in_progress" ? (
            <p className="text-sm">
              Session open · {counts.completedSets}/{counts.plannedSets} sets
            </p>
          ) : null}
          {todaySession?.status === "completed" ? (
            <p className="text-sm">Today is logged. Open it if you need to edit a set.</p>
          ) : null}
          {scheduled.id === "rest" ? (
            <Link
              href="/week"
              className={buttonVariants({
                size: "lg",
                variant: "secondary",
                className: "h-12 w-full",
              })}
            >
              See the week
            </Link>
          ) : (
            <Link
              href="/workout"
              className={buttonVariants({
                size: "lg",
                className: "h-12 w-full text-base",
              })}
            >
              {todaySession?.status === "in_progress"
                ? "Continue workout"
                : todaySession?.status === "completed"
                  ? "Review today"
                  : "Start workout"}
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">When to train</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p className="text-foreground">{suggestedWindow(time)}</p>
          {TIME_TIPS.map((tip) => (
            <div key={tip.id}>
              <p className="font-medium text-foreground">{tip.title}</p>
              <p>{tip.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {scheduled.warmup.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Warm-up</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm leading-6 text-muted-foreground">
              {scheduled.warmup.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How it should feel after</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>{FEEL_GUIDE.afterGood}</p>
          <p>{FEEL_GUIDE.afterBad}</p>
          <p>{FEEL_GUIDE.food}</p>
        </CardContent>
      </Card>

      {last ? (
        <p className="text-xs text-muted-foreground">
          Last {scheduled.id} session was {last.date}. Those weights will be
          filled in when you start.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          First time through this day — log the real loads and the next week
          will remember them.
        </p>
      )}

      <p className="text-xs leading-5 text-muted-foreground">{BOOKMARK_HINT}</p>
    </div>
  );
}
