"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import {
  latestWeight,
  removeBodyWeight,
  upsertBodyWeight,
  weightDelta,
  weightLog,
} from "@/lib/weight";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function nudge(value: number, step: number) {
  return Math.max(30, Math.min(250, Number((value + step).toFixed(1))));
}

function WeightBars({ entries }: { entries: { date: string; kg: number }[] }) {
  const chronological = [...entries].reverse();
  const min = Math.min(...chronological.map((item) => item.kg));
  const max = Math.max(...chronological.map((item) => item.kg));
  const span = Math.max(0.4, max - min);

  return (
    <div className="flex h-24 items-end gap-1">
      {chronological.map((item) => {
        const height = 20 + ((item.kg - min) / span) * 80;
        return (
          <div
            key={item.date}
            className="flex-1 rounded-t-sm bg-primary/70"
            style={{ height: `${height}%` }}
            title={`${item.date}: ${item.kg} kg`}
          />
        );
      })}
    </div>
  );
}

export function SettingsView() {
  const { athlete, setAthlete } = useTraining();
  const log = weightLog(athlete);
  const current = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const [kg, setKg] = useState(current?.kg ?? 85);
  const [date, setDate] = useState(formatDateISO());
  const [start, setStart] = useState(athlete.programStartDate);

  function saveWeight() {
    const next = upsertBodyWeight(athlete, { date, kg });
    setAthlete(next, { immediate: true });
    toast.success(`Saved ${kg.toFixed(1)} kg`);
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">You</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Body weight over time, plus the few things the log needs. Weigh-ins
          live on your athlete document — no extra reads.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="font-heading text-4xl leading-none">
              {current ? `${current.kg.toFixed(1)}` : "—"}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                kg
              </span>
            </p>
            {delta ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {delta.kg > 0 ? "+" : ""}
                {delta.kg} kg since {formatNiceDate(delta.from.date)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Add a weigh-in to start the history.
              </p>
            )}
          </div>

          {log.length >= 2 ? <WeightBars entries={log.slice(0, 16)} /> : null}

          <div className="space-y-2">
            <Label htmlFor="kg">New weigh-in</Label>
            <div className="flex items-center justify-between rounded-xl bg-secondary px-1 py-1">
              <button
                type="button"
                className="grid size-11 place-items-center"
                onClick={() => setKg((value) => nudge(value, -0.1))}
              >
                <Minus className="size-4" />
              </button>
              <span className="text-lg font-semibold">
                {kg.toFixed(1)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  kg
                </span>
              </span>
              <button
                type="button"
                className="grid size-11 place-items-center"
                onClick={() => setKg((value) => nudge(value, 0.1))}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weigh-date">Date</Label>
            <Input
              id="weigh-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11"
            />
          </div>

          <Button size="lg" className="h-12 w-full" onClick={saveWeight}>
            Save weight
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-base font-medium">History</p>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet. Same date twice replaces that day.
            </p>
          ) : (
            log.map((item) => (
              <div
                key={item.date}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.kg.toFixed(1)} kg</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNiceDate(item.date)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() =>
                    setAthlete(removeBodyWeight(athlete, item.date), {
                      immediate: true,
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-base font-medium">Program start</p>
          <Label htmlFor="start">Week 1, day 1</Label>
          <Input
            id="start"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="h-11"
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setAthlete(
                {
                  ...athlete,
                  programStartDate: start,
                  updatedAt: new Date().toISOString(),
                },
                { immediate: true },
              );
              toast.success("Start date saved");
            }}
          >
            Save start date
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
