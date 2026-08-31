"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CloseButton } from "@/components/close-button";
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
  displaySessionCounts,
  isStretchDay,
} from "@/lib/session";
import {
  sessionDocIdCandidates,
  sessionDocIdFromSummary,
} from "@/lib/session-id";
import { fetchSession } from "@/lib/store";
import type { SessionSummary } from "@/lib/types";
import { TrendChart } from "@/components/weight-chart";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function ExpandCard({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 pt-5 pb-5 text-left"
      >
        <div className="min-w-0">
          <p className="text-base font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
        {open ? (
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <CardContent className="space-y-3 border-t border-border pt-4 pb-5">
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function ProgressView() {
  const router = useRouter();
  const { athlete, todaySession, reopenEndedSession } = useTraining();
  const [group, setGroup] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [liftKind, setLiftKind] = useState<"work" | "warmup">("work");
  const [panel, setPanel] = useState<"lifts" | "stretches" | "warmups" | null>(
    null,
  );
  const sessionCounts = useMemo(() => displaySessionCounts(athlete), [athlete]);
  const lifts = useMemo(() => liftsByExercise(athlete), [athlete]);
  const stretches = useMemo(() => stretchesByExercise(athlete), [athlete]);
  const warmups = useMemo(() => warmupsByExercise(athlete), [athlete]);
  const groups = useMemo(
    () => ["all", ...new Set(lifts.map((item) => item.group))],
    [lifts],
  );
  const visible = lifts.filter(
    (item) => group === "all" || item.group === group,
  );
  const today = formatDateISO();
  const todaySummaries = athlete.recent.filter((item) => item.date === today);
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
    const matchToday =
      todaySession &&
      todaySession.date === summary.date &&
      todaySession.dayId === summary.dayId &&
      (!summary.startedAt || todaySession.startedAt === summary.startedAt) &&
      canReopenSession(todaySession);

    if (matchToday && todaySession) {
      reopenEndedSession(todaySession);
      router.push("/workout");
      return;
    }

    for (const docId of sessionDocIdCandidates(summary)) {
      const remote = await fetchSession(docId);
      if (!remote) continue;
      if (remote.dayId !== summary.dayId) continue;
      if (
        summary.startedAt &&
        remote.startedAt &&
        remote.startedAt !== summary.startedAt
      ) {
        continue;
      }
      if (!canReopenSession(remote)) {
        toast.message("That session is past the 24-hour reopen window.");
        return;
      }
      reopenEndedSession(remote);
      router.push("/workout");
      return;
    }

    toast.error("Couldn’t find that session to reopen.");
  }

  function sessionHref(summary: SessionSummary) {
    const docId = sessionDocIdFromSummary(summary);
    if (docId) return `/progress/session?id=${encodeURIComponent(docId)}`;
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
            ? "Today’s sessions sit at the top. Dig into lifts when you want detail."
            : "PRs up front. Open a card below when you want lift history."}
        </p>
      </header>

      {todaySummaries.length > 0 ? (
        <Card className="border-primary/25 bg-primary/8">
          <CardContent className="space-y-4 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              Today · {todaySummaries.length} session
              {todaySummaries.length === 1 ? "" : "s"}
            </p>
            {todaySummaries.map((item, index) => {
              const reopen = canReopenSummary(item);
              return (
                <div
                  key={`${item.dayId}-${item.startedAt ?? index}`}
                  className="space-y-2 border-t border-primary/15 pt-3 first:border-t-0 first:pt-0"
                >
                  <Link href={sessionHref(item)} className="block">
                    <p className="font-heading text-xl leading-none tracking-tight">
                      {isStretchDay(item.dayId)
                        ? "Stretch"
                        : item.title.split("·")[0].trim()}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.durationMin} min · {item.completedSets}/
                      {item.plannedSets} sets
                      {item.volume > 0 ? ` · ${item.volume} kg` : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      Open session →
                    </p>
                  </Link>
                  {reopen ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => void reopenSummary(item)}
                    >
                      Reopen{" "}
                      {isStretchDay(item.dayId)
                        ? "stretch"
                        : item.title.split("·")[0].trim()}
                    </Button>
                  ) : null}
                </div>
              );
            })}
            <p className="text-xs leading-5 text-muted-foreground">
              Within 24 hours you can reopen any of today’s sessions. Edit
              duration on the session page if the clock ran long.
            </p>
          </CardContent>
        </Card>
      ) : latest ? (
        <Card className="border-primary/25 bg-primary/8">
          <CardContent className="space-y-2 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              {isStretchDay(latest.dayId)
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
              <p className="mt-2 text-xs font-medium text-primary">
                Open session →
              </p>
            </Link>
            {canReopenSummary(latest) ? (
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-11 w-full"
                onClick={() => void reopenSummary(latest)}
              >
                Reopen session
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Sessions</p>
            <p className="text-2xl font-semibold">{sessionCounts.training}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Stretch</p>
            <p className="text-2xl font-semibold">{sessionCounts.stretch}</p>
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
            <p className="text-2xl font-semibold">
              {Object.keys(athlete.prs).length}
            </p>
          </CardContent>
        </Card>
      </div>

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

      <ExpandCard
        title="Lifts logged"
        summary={
          lifts.length > 0
            ? `${lifts.length} lift${lifts.length === 1 ? "" : "s"} · work & warm-up charts`
            : "Open when you want per-lift history"
        }
        open={panel === "lifts"}
        onToggle={() => setPanel((current) => (current === "lifts" ? null : "lifts"))}
      >
        {lifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Save a set on Push, Pull, or anywhere else. That lift shows up here.
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
              const unit =
                kindPoints[kindPoints.length - 1]?.unit ?? item.unit;
              return (
                <div
                  key={item.exerciseId}
                  className="rounded-2xl bg-secondary/60 px-3 py-3"
                >
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
                  ) : null}
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
                                  {point.sets > 1
                                    ? ` · ${point.sets} sets`
                                    : ""}
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
      </ExpandCard>

      <ExpandCard
        title="Stretch log"
        summary={
          stretches.length > 0
            ? `${stretches.length} stretch${stretches.length === 1 ? "" : "es"} tracked`
            : "Mobility moves from stretch sessions"
        }
        open={panel === "stretches"}
        onToggle={() =>
          setPanel((current) => (current === "stretches" ? null : "stretches"))
        }
      >
        {stretches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Finish a stretch session and moves show up here.
          </p>
        ) : (
          stretches.map((item) => (
            <Link
              key={`st-${item.exerciseId}`}
              href={`/settings/lifts/detail?id=${encodeURIComponent(item.exerciseId)}`}
              className="block rounded-xl bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/70"
            >
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.group} · {formatLiftPoint(item.last)}
              </p>
              {item.points.length >= 2 ? (
                <div className="mt-1.5 opacity-70">
                  <Spark points={item.points.slice(-8)} />
                </div>
              ) : null}
            </Link>
          ))
        )}
      </ExpandCard>

      <ExpandCard
        title="Warm-up trends"
        summary={
          warmups.length > 0
            ? `${warmups.length} lift${warmups.length === 1 ? "" : "s"} with warm-ups`
            : "Lighter loads from warm-up sets"
        }
        open={panel === "warmups"}
        onToggle={() =>
          setPanel((current) => (current === "warmups" ? null : "warmups"))
        }
      >
        {warmups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Log warm-up sets on a lift and the trend lands here.
          </p>
        ) : (
          warmups.map((item) => (
            <Link
              key={`wu-${item.exerciseId}`}
              href={`/settings/lifts/detail?id=${encodeURIComponent(item.exerciseId)}`}
              className="block rounded-xl bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/70"
            >
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatLiftPoint(item.last)}
              </p>
              {item.points.length >= 2 ? (
                <div className="mt-1.5 opacity-70">
                  <Spark points={item.points.slice(-8)} />
                </div>
              ) : null}
            </Link>
          ))
        )}
      </ExpandCard>

      <p className="text-center text-xs text-muted-foreground">
        Full photo timeline lives in{" "}
        <Link
          href="/settings/sessions"
          className="font-medium text-primary underline"
        >
          Settings → Sessions
        </Link>
        .
      </p>
    </div>
  );
}
