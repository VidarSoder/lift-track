"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BackLink } from "@/components/back-link";
import { CloseButton } from "@/components/close-button";
import { DangerConfirm } from "@/components/danger-confirm";
import { WeightChart, BmiChart } from "@/components/weight-chart";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ATHLETE_HEIGHT_CM,
  bmiForKg,
  bmiLogFromWeights,
  bmiMetricsForKg,
  type BmiMetrics,
} from "@/lib/bmi";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import {
  clampKg,
  bodyWeightForDate,
  latestWeight,
  parseKgInput,
  removeBodyWeight,
  upsertBodyWeight,
  weighInSliderBounds,
  weightDelta,
  weightLog,
} from "@/lib/weight";

function BmiDetails({ metrics }: { metrics: BmiMetrics }) {
  return (
    <div className="space-y-3 rounded-xl bg-secondary/60 px-3 py-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">BMI</p>
          <p className="font-heading text-2xl leading-none">{metrics.bmi}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="font-medium leading-snug">{metrics.categoryLabel}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          Healthy range at {ATHLETE_HEIGHT_CM} cm
        </p>
        <p className="mt-1 font-medium">
          {metrics.healthyMinKg.toFixed(1)}–{metrics.healthyMaxKg.toFixed(1)} kg
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          BMI 18.5–24.9 for your height.
        </p>
      </div>

      {metrics.kgToNormalMin != null ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {metrics.kgToNormalMin.toFixed(1)} kg below the normal range minimum.
        </p>
      ) : null}
      {metrics.kgToNormalMax != null ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {metrics.kgToNormalMax.toFixed(1)} kg above the normal range maximum.
        </p>
      ) : null}
    </div>
  );
}

function BmiHistoryRow({ date, kg }: { date: string; kg: number }) {
  const metrics = bmiMetricsForKg(kg);
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>{formatNiceDate(date)}</span>
      <span className="tabular-nums">
        BMI {metrics.bmi} · {metrics.categoryLabel.toLowerCase()}
      </span>
    </div>
  );
}

export function WeightSettingsView() {
  const { athlete, setAthlete } = useTraining();
  const log = weightLog(athlete);
  const bmiLog = bmiLogFromWeights(log);
  const current = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const metrics = current ? bmiMetricsForKg(current.kg) : null;
  const bmiDelta =
    delta != null
      ? Number(
          (
            bmiForKg(delta.to.kg) - bmiForKg(delta.from.kg)
          ).toFixed(1),
        )
      : null;
  const [kg, setKg] = useState(current?.kg ?? 85);
  const [typedKg, setTypedKg] = useState<string | null>(null);
  const [date, setDate] = useState(formatDateISO());
  const [editingHistory, setEditingHistory] = useState(false);
  const [showBmi, setShowBmi] = useState(false);
  const [editingToday, setEditingToday] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    date: string;
    kg: number;
  } | null>(null);
  const slider = weighInSliderBounds(kg);
  const todayStr = formatDateISO();
  const todayEntry = bodyWeightForDate(athlete, todayStr);
  const alreadyLoggedToday = todayEntry != null;

  function saveWeight() {
    const saveDate = editingToday || !alreadyLoggedToday ? todayStr : date;
    const next = upsertBodyWeight(athlete, { date: saveDate, kg });
    setAthlete(next, { immediate: true });
    setEditingToday(false);
    toast.success(`Saved ${kg.toFixed(1)} kg`);
  }

  return (
    <div className="space-y-5 pb-4">
      <header>
        <BackLink href="/settings" label="Settings" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Body weight
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Weigh-ins</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Log weight over time. BMI is calculated at {ATHLETE_HEIGHT_CM} cm —
          open details near the chart when you want it.
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
                {bmiDelta != null && bmiDelta !== 0 ? (
                  <>
                    {" "}
                    · BMI {bmiDelta > 0 ? "+" : ""}
                    {bmiDelta}
                  </>
                ) : null}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Add a weigh-in to start the history.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {alreadyLoggedToday && !editingToday ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="font-heading text-4xl leading-none">
                    {todayEntry!.kg.toFixed(1)}
                    <span className="ml-1 text-base font-normal text-muted-foreground">
                      kg
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You already logged today.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 w-full"
                  onClick={() => {
                    setKg(todayEntry!.kg);
                    setTypedKg(null);
                    setDate(todayStr);
                    setEditingToday(true);
                  }}
                >
                  Update?
                </Button>
              </>
            ) : (
              <>
                <Label htmlFor="kg">
                  {editingToday ? "Update today’s weigh-in" : "New weigh-in"}
                </Label>
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

                {editingToday ? (
                  <p className="text-xs text-muted-foreground">
                    Updating today’s entry ({formatNiceDate(todayStr)}).
                  </p>
                ) : (
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
                )}

                <div className="flex gap-2">
                  <Button size="lg" className="h-12 flex-1" onClick={saveWeight}>
                    {editingToday ? "Update weight" : "Save weight"}
                  </Button>
                  {editingToday ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12"
                      onClick={() => setEditingToday(false)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
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
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Weight (kg)</p>
                <WeightChart entries={log} />
                {current && metrics ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => setShowBmi((open) => !open)}
                      aria-expanded={showBmi}
                    >
                      {showBmi ? "Hide BMI details" : "BMI & details"}
                    </Button>
                  </div>
                ) : null}
                {showBmi && bmiLog.length > 0 ? (
                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      BMI trend · {ATHLETE_HEIGHT_CM} cm
                    </p>
                    <BmiChart entries={bmiLog} />
                  </div>
                ) : null}
                {showBmi && current && metrics ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        BMI details
                      </p>
                      <CloseButton
                        onClick={() => setShowBmi(false)}
                        label="Close BMI details"
                      />
                    </div>
                    <BmiDetails metrics={metrics} />
                    <div className="space-y-1.5 border-t border-border/60 pt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        BMI per weigh-in
                      </p>
                      {bmiLog
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((item) => (
                          <BmiHistoryRow
                            key={item.date}
                            date={item.date}
                            kg={item.kg}
                          />
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
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
    </div>
  );
}
