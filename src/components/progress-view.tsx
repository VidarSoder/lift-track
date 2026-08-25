"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { CloseButton } from "@/components/close-button";
import { bikeDelta, bikeLog, formatBikeLine, latestBike } from "@/lib/bike";
import { formatDateISO, formatNiceDate } from "@/lib/dates";
import { formatLiftPoint, liftsByExercise } from "@/lib/lifts";
import { resolveExercise } from "@/lib/exercises";
import { canReopenSession } from "@/lib/session";
import { latestWeight, weightDelta, weightLog } from "@/lib/weight";
import { WeightChart } from "@/components/weight-chart";
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
  const groups = useMemo(
    () => ["all", ...new Set(lifts.map((item) => item.group))],
    [lifts],
  );
  const visible = lifts.filter((item) => group === "all" || item.group === group);
  const today = formatDateISO();
  const latest = athlete.recent[0];
  const latestIsToday = latest?.date === today;
  const canReopen =
    Boolean(todaySession) &&
    canReopenSession(todaySession) &&
    latest?.date === todaySession?.date &&
    latest?.dayId === todaySession?.dayId;
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
          {latestIsToday
            ? "Today’s session is at the top. The lifts below keep the longer history."
            : "Every set you save keeps a history for that lift. Filter to what you actually do and watch the load over time."}
        </p>
      </header>

      {latest ? (
        <Card className="border-primary/25 bg-primary/8">
          <CardContent className="space-y-2 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              {latestIsToday ? "Today" : "Latest session"}
            </p>
            <p className="font-heading text-2xl leading-none tracking-tight">
              {latest.title.split("·")[0].trim()}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {formatNiceDate(latest.date)} · {latest.durationMin} min ·{" "}
              {latest.completedSets}/{latest.plannedSets} sets
              {latest.volume > 0 ? ` · ${latest.volume} kg` : ""}
            </p>
            {latest.mood ? (
              <p className="text-sm text-muted-foreground">
                Mood {latest.mood}/5
                {latest.pump ? ` · pump ${latest.pump}/5` : ""}
              </p>
            ) : null}
            {canReopen && todaySession ? (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => {
                    reopenEndedSession(todaySession);
                    router.push("/workout");
                  }}
                >
                  Reopen session
                </Button>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Want to keep going? Reopen within 24 hours — Home and Workout
                  stay free for a new session.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
                        <div className="flex justify-end">
                          <CloseButton
                            onClick={() => setOpenId(null)}
                            label="Close lift history"
                          />
                        </div>
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
            athlete.recent.map((item, index) => (
              <div
                key={`${item.date}-${item.dayId}`}
                className={cn("space-y-1", index === 0 && "rounded-xl bg-primary/8 p-2")}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {index === 0 ? "Newest · " : ""}
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
