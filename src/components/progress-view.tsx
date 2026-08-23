"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { bikeDelta, bikeLog, formatBikeLine, latestBike } from "@/lib/bike";
import { formatNiceDate } from "@/lib/dates";
import { formatLiftPoint, liftsByExercise } from "@/lib/lifts";
import { resolveExercise } from "@/lib/exercises";
import { latestWeight, weightDelta } from "@/lib/weight";
import { useTraining } from "@/components/training-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Bar({ value, max }: { value: number; max: number }) {
  const width = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div className="h-full bg-primary" style={{ width: `${width}%` }} />
    </div>
  );
}

function Spark({ points }: { points: { weight: number }[] }) {
  const values = points.map((point) => point.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.1, max - min);
  return (
    <div className="flex h-10 items-end gap-0.5">
      {values.map((value, index) => {
        const height = 22 + ((value - min) / span) * 78;
        return (
          <div
            key={`${value}-${index}`}
            className="flex-1 rounded-t-sm bg-primary/70"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

export function ProgressView() {
  const { athlete } = useTraining();
  const [group, setGroup] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const body = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const bikes = bikeLog(athlete);
  const lastBike = latestBike(athlete);
  const bikeChange = bikeDelta(athlete);
  const maxBike = Math.max(
    1,
    ...bikes.map((item) => item.km ?? item.minutes / 10),
  );
  const maxVolume = Math.max(1, ...athlete.recent.map((item) => item.volume));
  const lifts = useMemo(() => liftsByExercise(athlete), [athlete]);
  const groups = useMemo(
    () => ["all", ...new Set(lifts.map((item) => item.group))],
    [lifts],
  );
  const visible = lifts.filter((item) => group === "all" || item.group === group);
  const namedPrs = Object.entries(athlete.prs)
    .map(([id, pr]) => {
      const exercise = resolveExercise(id, athlete);
      return { id, name: exercise.name, ...pr };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Tracking
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Progress</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Every set you save keeps a history for that lift. Filter to what you
          actually do and watch the load over time.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Sessions</p>
            <p className="text-2xl font-semibold">{athlete.sessionsCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Lifts tracked</p>
            <p className="text-2xl font-semibold">{lifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">PRs</p>
            <p className="text-2xl font-semibold">{Object.keys(athlete.prs).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Lifts you have logged</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Last working set each day. Tap a row for the dates.
            </p>
          </div>
          {lifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Save a set on Push, Pull, or anywhere else. That lift shows up
              here with a trend the next time you log it.
            </p>
          ) : (
            <>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {groups.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGroup(item)}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3 text-xs font-medium",
                      group === item
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {item === "all" ? "All" : item}
                  </button>
                ))}
              </div>
              {visible.map((item) => {
                const open = openId === item.exerciseId;
                return (
                  <div key={item.exerciseId} className="rounded-2xl bg-secondary/60 px-3 py-3">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      onClick={() =>
                        setOpenId(open ? null : item.exerciseId)
                      }
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.group} · {formatLiftPoint(item.last)}
                          {item.delta != null
                            ? ` · ${item.delta > 0 ? "+" : ""}${item.delta} ${item.unit}`
                            : ""}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                    {item.points.length >= 2 ? (
                      <div className="mt-2">
                        <Spark points={item.points.slice(-10)} />
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Log it again to see the trend.
                      </p>
                    )}
                    {open ? (
                      <div className="mt-3 space-y-1.5">
                        {[...item.points].reverse().map((point) => (
                          <div
                            key={`${point.date}-${point.weight}-${point.reps}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <p className="text-muted-foreground">
                              {formatNiceDate(point.date)}
                            </p>
                            <p className="font-medium">
                              {formatLiftPoint(point)}
                              {point.sets > 1 ? ` · ${point.sets} sets` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-5">
          <p className="text-xs text-muted-foreground">Body weight</p>
          <p className="text-2xl font-semibold">
            {body ? `${body.kg.toFixed(1)} kg` : "Not logged"}
          </p>
          {delta ? (
            <p className="text-sm text-muted-foreground">
              {delta.kg > 0 ? "+" : ""}
              {delta.kg} kg since the first weigh-in
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add weigh-ins in Settings to see the trend.
            </p>
          )}
          <Link
            href="/settings"
            className={buttonVariants({
              variant: "secondary",
              className: "w-full",
            })}
          >
            Open settings
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-xs text-muted-foreground">Bike</p>
          {lastBike ? (
            <>
              <p className="text-base font-medium leading-6">
                {formatBikeLine(lastBike)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatNiceDate(lastBike.date)}
                {bikeChange && lastBike.km != null
                  ? ` · ${bikeChange.km > 0 ? "+" : ""}${bikeChange.km} km since the first ride`
                  : bikeChange
                    ? ` · ${bikeChange.minutes > 0 ? "+" : ""}${bikeChange.minutes} min since the first ride`
                    : ""}
              </p>
              {bikes.length >= 2 ? (
                <div className="flex h-20 items-end gap-1">
                  {[...bikes].reverse().slice(-12).map((item) => {
                    const value = item.km ?? item.minutes / 10;
                    const height = 20 + (value / maxBike) * 80;
                    return (
                      <div
                        key={item.date}
                        className="flex-1 rounded-t-sm bg-primary/70"
                        style={{ height: `${height}%` }}
                        title={formatBikeLine(item)}
                      />
                    );
                  })}
                </div>
              ) : null}
              <div className="space-y-2">
                {bikes.slice(0, 6).map((item) => (
                  <div
                    key={item.date}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <p className="text-muted-foreground">
                      {formatNiceDate(item.date)}
                    </p>
                    <p className="text-right font-medium leading-5">
                      {formatBikeLine(item)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              After a bike, type time, km, kcal, and level from the console.
              That history shows up here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent volume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {athlete.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Finish a session and the bar chart shows up here.
            </p>
          ) : (
            athlete.recent.map((item) => (
              <div key={`${item.date}-${item.dayId}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {item.date} · {item.title.split("·")[0]}
                  </span>
                  <span className="text-muted-foreground">
                    {item.volume} kg · {item.completedSets}/{item.plannedSets}
                  </span>
                </div>
                <Bar value={item.volume} max={maxVolume} />
                {item.mood ? (
                  <p className="text-[11px] text-muted-foreground">
                    Mood {item.mood}/5
                    {item.pump ? ` · pump ${item.pump}/5` : ""} · {item.durationMin} min
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Heaviest logged</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {namedPrs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              PRs appear after you finish a session with saved sets.
            </p>
          ) : (
            namedPrs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between text-sm">
                <span>{pr.name}</span>
                <span className="font-medium">
                  {pr.weight} kg × {pr.reps}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
