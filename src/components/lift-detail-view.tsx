"use client";

import { useMemo, useState } from "react";
import { BackLink } from "@/components/back-link";
import { ExerciseMark } from "@/components/exercise-mark";
import { TrendChart } from "@/components/weight-chart";
import { useTraining } from "@/components/training-provider";
import { formatNiceDate } from "@/lib/dates";
import { resolveExercise } from "@/lib/exercises";
import {
  formatLiftPoint,
  isStretchExercise,
  pointsForExercise,
} from "@/lib/lifts";
import { cn } from "@/lib/utils";

export function LiftDetailView({ exerciseId }: { exerciseId: string }) {
  const { athlete } = useTraining();
  const [kind, setKind] = useState<"work" | "warmup">("work");
  const exercise = resolveExercise(exerciseId, athlete);
  const stretch = isStretchExercise(exerciseId);
  const work = useMemo(
    () => pointsForExercise(athlete, exerciseId, "work"),
    [athlete, exerciseId],
  );
  const warmups = useMemo(
    () => pointsForExercise(athlete, exerciseId, "warmup"),
    [athlete, exerciseId],
  );
  const points = kind === "work" ? work : warmups;
  const chartPoints = points.map((point) => ({
    date: point.date,
    value: point.weight,
  }));
  const unit = points[points.length - 1]?.unit ?? "kg";
  const backHref = stretch ? "/settings/stretches" : "/settings/lifts";

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-2">
        <BackLink href={backHref} label={stretch ? "Stretches" : "Lifts"} />
        <div className="flex items-center gap-3">
          <ExerciseMark id={exerciseId} />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {stretch ? "Stretch" : exercise.group}
          </p>
        </div>
        <h1 className="font-heading text-3xl leading-none">{exercise.name}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Weight and reps over time. Switch between working sets and warm-ups.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(
          [
            ["work", "Working", work.length],
            ["warmup", "Warm-up", warmups.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn(
              "h-10 rounded-xl text-sm font-medium",
              kind === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {label}
            {count > 0 ? ` · ${count}` : ""}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {kind === "work"
            ? "No working sets logged for this one yet."
            : "No warm-up sets logged for this one yet."}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <p className="text-xs text-muted-foreground">
              {kind === "work" ? "Working load" : "Warm-up load"}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatLiftPoint(points[points.length - 1])}
            </p>
            {chartPoints.length >= 2 ? (
              <div className="mt-3">
                <TrendChart
                  points={chartPoints}
                  unit={unit}
                  decimals={unit === "kg" ? 1 : 0}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Log one more day to unlock the chart.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              History
            </p>
            {[...points].reverse().map((point) => (
              <div
                key={`${point.date}-${point.kind}-${point.weight}-${point.reps}-${point.sets}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{formatNiceDate(point.date)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {point.sets} set{point.sets === 1 ? "" : "s"} logged
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatLiftPoint(point)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
