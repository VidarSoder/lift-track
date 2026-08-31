"use client";

import { useMemo, useState } from "react";
import { formatChartDate, formatDateISO, addDaysISO } from "@/lib/dates";
import { isStretchDay, isTrainingDay } from "@/lib/session";
import type { SessionSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Range = "week" | "month" | "ytd" | "all";

function rangeStart(range: Range, today: string) {
  if (range === "week") return addDaysISO(today, -6);
  if (range === "month") return addDaysISO(today, -29);
  if (range === "ytd") return `${today.slice(0, 4)}-01-01`;
  return "1970-01-01";
}

function eachDay(from: string, to: string) {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addDaysISO(cursor, 1);
    if (days.length > 400) break;
  }
  return days;
}

/** Unique training/stretch days over a range — cumulative for the line. */
export function SessionDaysChart({
  sessions,
  className,
}: {
  sessions: SessionSummary[];
  className?: string;
}) {
  const [range, setRange] = useState<Range>("month");
  const [showStretch, setShowStretch] = useState(true);
  const today = formatDateISO();
  const start = rangeStart(range, today);

  const series = useMemo(() => {
    const days = eachDay(start, today);
    const trainingDays = new Set(
      sessions
        .filter((item) => isTrainingDay(item.dayId) && item.date >= start)
        .map((item) => item.date),
    );
    const stretchDays = new Set(
      sessions
        .filter((item) => isStretchDay(item.dayId) && item.date >= start)
        .map((item) => item.date),
    );
    let train = 0;
    let stretch = 0;
    return days.map((date) => {
      if (trainingDays.has(date)) train += 1;
      if (stretchDays.has(date)) stretch += 1;
      return { date, train, stretch };
    });
  }, [sessions, start, today]);

  const width = 320;
  const height = 168;
  const left = 28;
  const right = 12;
  const top = 18;
  const bottom = 28;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const max = Math.max(
    1,
    ...series.map((point) =>
      showStretch ? Math.max(point.train, point.stretch) : point.train,
    ),
  );
  const step = series.length <= 1 ? 0 : plotW / (series.length - 1);

  function pathFor(values: number[]) {
    return values
      .map((value, index) => {
        const x = left + index * step;
        const y = top + ((max - value) / max) * plotH;
        return `${index === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  const trainPath = pathFor(series.map((point) => point.train));
  const stretchPath = pathFor(series.map((point) => point.stretch));
  const last = series[series.length - 1];
  const first = series[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
          {(
            [
              ["week", "Week"],
              ["month", "Month"],
              ["ytd", "YTD"],
              ["all", "All"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={cn(
                "h-8 rounded-lg px-2 text-xs font-medium",
                range === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowStretch((value) => !value)}
          className={cn(
            "h-8 rounded-full px-3 text-xs font-medium",
            showStretch
              ? "bg-emerald-400/15 text-emerald-100"
              : "bg-secondary text-muted-foreground",
          )}
        >
          Stretch {showStretch ? "on" : "off"}
        </button>
      </div>

      {series.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Log a couple of days to unlock the session chart.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-40 w-full"
          role="img"
          aria-label="Session days over time"
        >
          <line
            x1={left}
            x2={width - right}
            y1={top + plotH}
            y2={top + plotH}
            className="stroke-border"
            strokeWidth="1"
          />
          <path
            d={trainPath}
            fill="none"
            className="stroke-primary"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showStretch ? (
            <path
              d={stretchPath}
              fill="none"
              className="stroke-emerald-300/80"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 3"
            />
          ) : null}
          <text x={4} y={top + 4} className="fill-muted-foreground" fontSize="10">
            {max}
          </text>
          <text
            x={4}
            y={top + plotH}
            className="fill-muted-foreground"
            fontSize="10"
          >
            0
          </text>
          {first ? (
            <text
              x={left}
              y={height - 8}
              className="fill-muted-foreground"
              fontSize="10"
            >
              {formatChartDate(first.date)}
            </text>
          ) : null}
          {last ? (
            <text
              x={width - right}
              y={height - 8}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {formatChartDate(last.date)}
            </text>
          ) : null}
        </svg>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Training days · {last?.train ?? 0}
        </span>
        {showStretch ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-300/80" />
            Stretch days · {last?.stretch ?? 0}
          </span>
        ) : null}
      </div>
    </div>
  );
}
