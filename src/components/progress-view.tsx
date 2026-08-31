"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { CloseButton } from "@/components/close-button";
import { bikeDelta, bikeLog, formatBikeLine, latestBike } from "@/lib/bike";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import {
  formatLiftPoint,
  liftsByExercise,
  pointsForExercise,
  stretchesByExercise,
  warmupsByExercise,
} from "@/lib/lifts";
import { resolveExercise } from "@/lib/exercises";
import {
  canReopenSession,
  canReopenSummary,
  isStretchDay,
} from "@/lib/session";
import { sessionDocId, sessionDocIdFromSummary } from "@/lib/session-id";
import { fetchSession } from "@/lib/store";
import { latestWeight, weightDelta, weightLog } from "@/lib/weight";
import type { SessionSummary } from "@/lib/types";
import { TrendChart, WeightChart } from "@/components/weight-chart";
import { useTraining } from "@/components/training-provider";
import { Button, buttonVariants } from "@/components/ui/button";
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
  const router = useRouter();
  const { athlete, todaySession, reopenEndedSession } = useTraining();
  const [group, setGroup] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [liftKind, setLiftKind] = useState<"work" | "warmup">("work");
  const body = latestWeight(athlete);
  const weighIns = weightLog(athlete);
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
  const stretches = useMemo(() => stretchesByExercise(athlete), [athlete]);
  const warmups = useMemo(() => warmupsByExercise(athlete), [athlete]);
  const groups = useMemo(
    () => ["all", ...new Set(lifts.map((item) => item.group))],
    [lifts],
  );
  const visible = lifts.filter((item) => group === "all" || item.group === group);
  const today = formatDateISO();
  const latest = athlete.recent[0];
  const latestIsToday = latest?.date === today;
  const namedPrs = Object.entries(athlete.prs)
    .map(([id, pr]) => {
      const exercise = resolveExercise(id, athlete);
      return { id, name: exercise.name, ...pr };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  async function reopenSummary(summary: SessionSummary) {
    const docId = sessionDocIdFromSummary(summary);
    if (!docId) return;
    if (todaySession && sessionDocId(todaySession) === docId && canReopenSession(todaySession)) {
      reopenEndedSession(todaySession);
      router.push("/workout");
      return;
    }
    const remote = await fetchSession(docId);
    if (!remote || !canReopenSession(remote)) return;
    reopenEndedSession(remote);
    router.push("/workout");
  }

  function sessionHref(summary: SessionSummary) {
    const docId = sessionDocIdFromSummary(summary);
    if (docId) return `/progress/session?id=${encodeURIComponent(docId)}`;
    // Legacy recent row without startedAt — best-effort date doc.
    return `/progress/session?id=${encodeURIComponent(summary.date)}`;
  }

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Tracking
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Progress</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {latestIsToday
            ? "Today’s session is at the top. The lifts below keep the longer history."
            : "Every set you save keeps a history for that lift. Filter to what you actually do and watch the load over time."}
        </p>
      </header>

      {latest ? (
        <Card className="border-primary/25 bg-primary/8">
          <CardContent className="space-y-2 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              {latestIsToday
                ? isStretchDay(latest.dayId)
                  ? "Today · stretch"
                  : "Today"
                : isStretchDay(latest.dayId)
                  ? "Latest stretch session"
                  : "Latest session"}
            </p>
            <Link href={sessionHref(latest)} className="block">
              <p className="font-heading text-2xl leading-none tracking-tight">
                {latest.title.split("·")[0].trim()}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {formatNiceDate(latest.date)} · {latest.durationMin} min ·{" "}
                {latest.completedSets}/{latest.plannedSets} sets
                {latest.volume > 0 ? ` · ${latest.volume} kg` : ""}
              </p>
              {latest.mood ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Mood {latest.mood}/5
                  {latest.pump ? ` · pump ${latest.pump}/5` : ""}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-primary">Open timeline →</p>
            </Link>
            {canReopenSummary(latest) ? (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => void reopenSummary(latest)}
                >
                  Reopen session
                </Button>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Within 24 hours you can reopen this one, or start another session
                  from Home / Workout.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Sessions</p>
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
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Lifts</p>
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
              Tap a lift for weight × reps history. Toggle warm-up vs working sets
              and open the full chart.
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
                const workPoints = pointsForExercise(
                  athlete,
                  item.exerciseId,
                  "work",
                );
                const warmupPoints = pointsForExercise(
                  athlete,
                  item.exerciseId,
                  "warmup",
                );
                const kindPoints =
                  liftKind === "work" ? workPoints : warmupPoints;
                const chartPoints = kindPoints.map((point) => ({
                  date: point.date,
                  value: point.weight,
                }));
                const unit = kindPoints[kindPoints.length - 1]?.unit ?? item.unit;
                return (
                  <div key={item.exerciseId} className="rounded-2xl bg-secondary/60 px-3 py-3">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      onClick={() => {
                        setOpenId(open ? null : item.exerciseId);
                        setLiftKind("work");
                      }}
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
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-background/80 p-1">
                            {(
                              [
                                ["work", "Work", workPoints.length],
                                ["warmup", "Warm-up", warmupPoints.length],
                              ] as const
                            ).map(([id, label, count]) => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setLiftKind(id)}
                                className={cn(
                                  "h-8 rounded-lg text-xs font-medium",
                                  liftKind === id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {label}
                                {count > 0 ? ` · ${count}` : ""}
                              </button>
                            ))}
                          </div>
                          <CloseButton
                            onClick={() => setOpenId(null)}
                            label="Close lift history"
                          />
                        </div>
                        {kindPoints.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {liftKind === "work"
                              ? "No working sets logged yet."
                              : "No warm-up sets logged yet."}
                          </p>
                        ) : (
                          <>
                            {chartPoints.length >= 2 ? (
                              <TrendChart
                                points={chartPoints}
                                unit={unit}
                                decimals={unit === "kg" ? 1 : 0}
                              />
                            ) : null}
                            <div className="space-y-1.5">
                              {[...kindPoints].reverse().map((point) => (
                                <div
                                  key={`${point.date}-${point.kind}-${point.weight}-${point.reps}-${point.sets}`}
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
                          </>
                        )}
                        <Link
                          href={`/settings/lifts/detail?id=${encodeURIComponent(item.exerciseId)}`}
                          className="block text-xs font-medium text-primary"
                        >
                          Open full lift page →
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {stretches.length > 0 ? (
        <Card>
          <CardContent className="space-y-2.5 pt-5">
            <div>
              <p className="text-xs text-muted-foreground">Stretch log</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Separate from strength lifts — by stretch region.
              </p>
            </div>
            {stretches.map((item) => (
              <Link
                key={`st-${item.exerciseId}`}
                href={`/settings/lifts/detail?id=${encodeURIComponent(item.exerciseId)}`}
                className="block rounded-xl bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.group} · {formatLiftPoint(item.last)}
                      {item.delta != null
                        ? ` · ${item.delta > 0 ? "+" : ""}${item.delta} ${item.unit}`
                        : ""}
                    </p>
                  </div>
                </div>
                {item.points.length >= 2 ? (
                  <div className="mt-1.5 opacity-70">
                    <Spark points={item.points.slice(-8)} />
                  </div>
                ) : null}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {warmups.length > 0 ? (
        <Card>
          <CardContent className="space-y-2.5 pt-5">
            <div>
              <p className="text-xs text-muted-foreground">Warm-up trends</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Lighter than working sets — top warm-up load each day.
              </p>
            </div>
            {warmups
              .filter((item) => group === "all" || item.group === group)
              .map((item) => (
                <Link
                  key={`wu-${item.exerciseId}`}
                  href={`/settings/lifts/detail?id=${encodeURIComponent(item.exerciseId)}`}
                  className="block rounded-xl bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatLiftPoint(item.last)}
                        {item.delta != null
                          ? ` · ${item.delta > 0 ? "+" : ""}${item.delta} ${item.unit}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  {item.points.length >= 2 ? (
                    <div className="mt-1.5 opacity-70">
                      <Spark points={item.points.slice(-8)} />
                    </div>
                  ) : null}
                </Link>
              ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 pt-5">
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
          {weighIns.length > 0 ? <WeightChart entries={weighIns} /> : null}
          <Link
            href="/settings/weight"
            className={buttonVariants({
              variant: "secondary",
              className: "w-full",
            })}
          >
            Open weigh-ins
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
            athlete.recent.map((item, index) => {
              const href = sessionHref(item);
              const reopen = canReopenSummary(item);
              return (
                <div
                  key={`${item.date}-${item.dayId}-${item.startedAt ?? index}`}
                  className={cn("space-y-1", index === 0 && "rounded-xl bg-primary/8 p-2")}
                >
                  <Link href={href} className="block space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {index === 0 ? "Newest · " : ""}
                        {item.date} ·{" "}
                        {isStretchDay(item.dayId)
                          ? "Stretch"
                          : item.title.split("·")[0]}
                      </span>
                      <span className="text-muted-foreground">
                        {item.volume > 0
                          ? `${item.volume} kg · `
                          : ""}
                        {item.completedSets}/{item.plannedSets}
                      </span>
                    </div>
                    <Bar value={item.volume} max={maxVolume} />
                    {item.mood ? (
                      <p className="text-[11px] text-muted-foreground">
                        Mood {item.mood}/5
                        {item.pump ? ` · pump ${item.pump}/5` : ""} ·{" "}
                        {item.durationMin} min
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        {item.durationMin} min · tap for timeline
                      </p>
                    )}
                  </Link>
                  {reopen ? (
                    <button
                      type="button"
                      onClick={() => void reopenSummary(item)}
                      className="text-[11px] font-medium text-primary underline"
                    >
                      Reopen within 24h
                    </button>
                  ) : null}
                </div>
              );
            })
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
              PRs need a training session with at least two loaded lifts.
            </p>
          ) : (
            namedPrs.map((pr) => (
              <Link
                key={pr.id}
                href={`/settings/lifts/detail?id=${encodeURIComponent(pr.id)}`}
                className="flex items-center justify-between text-sm hover:text-primary"
              >
                <span>{pr.name}</span>
                <span className="font-medium">
                  {pr.weight} kg × {pr.reps}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
