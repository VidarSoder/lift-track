"use client";

import Link from "next/link";
import { DAYS, WEEKDAY_LABEL } from "@/data/program";
import { formatDateISO, weekDates } from "@/lib/dates";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WeekView() {
  const { athlete } = useTraining();
  const today = formatDateISO();
  const dates = weekDates(today);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          This week
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">The schedule</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Follow the days in order when you can. If you miss one, do that
          session the next time you get to the gym — do not skip arms to
          &quot;make up&quot; a random extra chest day.
        </p>
      </header>

      <div className="space-y-3">
        {DAYS.map((day, index) => {
          const date = dates[index];
          const isToday = date === today;
          const last = athlete.lastByDay[day.id];
          const doneThisWeek = last?.date && dates.includes(last.date);
          return (
            <Card
              key={day.id}
              className={cn(isToday && "border-primary/40 bg-primary/8")}
            >
              <CardContent className="flex items-start justify-between gap-3 pt-5">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {WEEKDAY_LABEL[day.weekday]} · {date.slice(8)}
                  </p>
                  <p className="font-medium leading-tight">{day.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {day.focus}
                  </p>
                  {doneThisWeek ? (
                    <p className="text-xs text-primary">Logged {last?.date}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={isToday ? "default" : "secondary"}>
                    {isToday ? "Today" : day.durationMin === "0" ? "Off" : `${day.exercises.length} lifts`}
                  </Badge>
                  {isToday ? (
                    <Link href="/workout" className="text-xs underline">
                      Open
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
