"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import {
  clampKg,
  latestWeight,
  parseKgInput,
  removeBodyWeight,
  upsertBodyWeight,
  weighInSliderBounds,
  weightDelta,
  weightLog,
} from "@/lib/weight";
import { DangerConfirm } from "@/components/danger-confirm";
import { WeightChart } from "@/components/weight-chart";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function SettingsView() {
  const { athlete, setAthlete } = useTraining();
  const log = weightLog(athlete);
  const current = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const [kg, setKg] = useState(current?.kg ?? 85);
  const [typedKg, setTypedKg] = useState<string | null>(null);
  const [date, setDate] = useState(formatDateISO());
  const [start, setStart] = useState(athlete.programStartDate);
  const [editingHistory, setEditingHistory] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    date: string;
    kg: number;
  } | null>(null);
  const slider = weighInSliderBounds(kg);

  function saveWeight() {
    const next = upsertBodyWeight(athlete, { date, kg });
    setAthlete(next, { immediate: true });
    toast.success(`Saved ${kg.toFixed(1)} kg`);
  }

  return (
    <div className="space-y-5 pb-4">
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

          <div className="space-y-3">
            <Label htmlFor="kg">New weigh-in</Label>
            <div className="rounded-2xl bg-secondary px-4 py-4">
              <div className="flex items-baseline justify-center gap-1.5">
                <input
                  id="kg"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={typedKg ?? kg.toFixed(1)}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTypedKg(next);
                    const parsed = parseKgInput(next);
                    if (parsed != null) setKg(parsed);
                  }}
                  onBlur={() => setTypedKg(null)}
                  aria-label="Body weight in kilograms"
                  className="font-heading w-36 bg-transparent text-center text-5xl font-semibold tracking-tight tabular-nums outline-none"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
              <Slider
                className="mt-5"
                min={slider.min}
                max={slider.max}
                step={0.1}
                value={[kg]}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value;
                  if (typeof next !== "number") return;
                  setTypedKg(null);
                  setKg(clampKg(next));
                }}
                aria-label="Body weight slider"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                <span>{slider.min.toFixed(0)}</span>
                <span>Slide or type · 0.1 kg</span>
                <span>{slider.max.toFixed(0)}</span>
              </div>
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-medium">History</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Chart first. Removing a weigh-in takes two confirms so a
                stray tap cannot wipe it.
              </p>
            </div>
            {log.length > 0 ? (
              <Button
                type="button"
                variant={editingHistory ? "secondary" : "outline"}
                size="sm"
                onClick={() => setEditingHistory((open) => !open)}
              >
                {editingHistory ? "Done" : "Edit"}
              </Button>
            ) : null}
          </div>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet. Same date twice replaces that day.
            </p>
          ) : (
            <>
              <WeightChart entries={log} />
              {log.map((item) => (
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
                  {editingHistory ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() =>
                        setPendingRemove({ date: item.date, kg: item.kg })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <DangerConfirm
        open={pendingRemove != null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        title={
          pendingRemove
            ? `Remove ${pendingRemove.kg.toFixed(1)} kg?`
            : "Remove weigh-in?"
        }
        description={
          pendingRemove
            ? `This deletes the ${pendingRemove.kg.toFixed(1)} kg weigh-in from ${formatNiceDate(pendingRemove.date)}. The rest of the history stays.`
            : "This deletes that weigh-in from your history."
        }
        confirmLabel="Delete weigh-in"
        onConfirm={() => {
          if (!pendingRemove) return;
          setAthlete(removeBodyWeight(athlete, pendingRemove.date), {
            immediate: true,
          });
          toast.success("Weigh-in removed");
          setPendingRemove(null);
          if (log.length <= 1) setEditingHistory(false);
        }}
      />

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
