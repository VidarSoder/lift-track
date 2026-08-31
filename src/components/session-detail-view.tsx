"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { ExerciseHowPanel, ExerciseThumb } from "@/components/exercise-guide";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNiceDate } from "@/lib/dates";
import { resolveExercise } from "@/lib/exercises";
import { isStretchExercise } from "@/lib/lifts";
import {
  canReopenSession,
  sessionDurationMin,
  sessionSetCounts,
  warmupSets,
  workingSets,
} from "@/lib/session";
import { sessionDocId } from "@/lib/session-id";
import { fetchSession, patchSessionDuration } from "@/lib/store";
import type { LoggedSet, WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatSet(set: LoggedSet, bodyweight: boolean) {
  if (bodyweight || set.weight == null || set.weight === 0) {
    return set.reps != null ? `${set.reps} reps` : "—";
  }
  if (set.reps != null) return `${set.weight} kg × ${set.reps}`;
  return `${set.weight} kg`;
}

export function SessionDetailView() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id")?.trim() ?? "";
  const { athlete, todaySession, reopenEndedSession, setAthlete } =
    useTraining();
  const [session, setSession] = useState<WorkoutSession | null | undefined>(
    undefined,
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setSession(null);
        return;
      }
      if (todaySession && sessionDocId(todaySession) === id) {
        setSession(todaySession);
        return;
      }
      const remote = await fetchSession(id);
      if (!cancelled) setSession(remote);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, todaySession]);

  useEffect(() => {
    if (!session) return;
    setMinutes(String(sessionDurationMin(session)));
  }, [session]);

  const counts = session ? sessionSetCounts(session) : null;
  const canReopen = canReopenSession(session);
  const canEditDuration = session?.status === "completed";
  const timeline = useMemo(() => {
    if (!session) return [];
    return session.exercises
      .map((logged) => {
        const exercise = resolveExercise(
          logged.exerciseId,
          athlete,
          logged.sets.length,
        );
        const warm = warmupSets(logged.sets).filter((set) => set.done);
        const work = workingSets(logged.sets).filter((set) => set.done);
        if (warm.length === 0 && work.length === 0) return null;
        return { logged, exercise, warm, work };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  }, [athlete, session]);

  async function saveDuration() {
    if (!session || !id) return;
    const value = Number(minutes);
    if (!Number.isFinite(value) || value < 1 || value > 600) {
      toast.error("Enter minutes between 1 and 600.");
      return;
    }
    setSaving(true);
    try {
      const result = await patchSessionDuration(id, value);
      setSession(result.session);
      setAthlete(result.athlete, { immediate: true });
      toast.success(`Duration set to ${Math.round(value)} min`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn’t save duration",
      );
    } finally {
      setSaving(false);
    }
  }

  if (session === undefined) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Loading session…
      </p>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4 py-6">
        <Link
          href="/progress"
          className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          Progress
        </Link>
        <p className="text-sm text-muted-foreground">
          That session isn’t available anymore. Older same-day sessions only keep
          a timeline after the multi-session update.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-2">
        <Link
          href="/progress"
          className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          Progress
        </Link>
        <div className="flex items-center gap-3">
          <ExerciseMark id={session.dayId} />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {session.status === "completed" ? "Logged session" : session.status}
          </p>
        </div>
        <h1 className="font-heading text-3xl leading-none">{session.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {formatNiceDate(session.date)}
          {counts
            ? ` · ${counts.completedSets}/${counts.plannedSets} sets done`
            : ""}
          {` · ${sessionDurationMin(session)} min`}
        </p>
      </header>

      {canEditDuration ? (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <div>
              <p className="text-xs text-muted-foreground">Session length</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Fix the clock if you forgot to finish. Start stays the same —
                only the end moves.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1 space-y-1.5">
                <span className="text-xs text-muted-foreground">Minutes</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                  className="h-11 text-base"
                />
              </label>
              <Button
                type="button"
                className="h-11 px-5"
                disabled={saving}
                onClick={() => void saveDuration()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[25, 31, 45, 60, 75].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMinutes(String(preset))}
                  className="h-8 rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground"
                >
                  {preset} min
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canReopen ? (
        <Button
          type="button"
          className="h-12 w-full"
          onClick={() => {
            reopenEndedSession(session);
            router.push("/workout");
          }}
        >
          Reopen this session
        </Button>
      ) : null}

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Timeline</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              What you logged, in order. Tap a lift for form notes.
            </p>
          </div>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed sets in this session.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.map(({ logged, exercise, warm, work }, index) => {
                const stretch = isStretchExercise(exercise.id);
                const open = openId === exercise.id;
                return (
                  <div
                    key={`${exercise.id}-${index}`}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId((current) =>
                          current === exercise.id ? null : exercise.id,
                        )
                      }
                      className="flex w-full items-start gap-3 px-3 py-3 text-left"
                    >
                      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <ExerciseThumb
                          exerciseId={exercise.id}
                          name={exercise.name}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-tight">
                          {exercise.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {stretch ? "Stretch" : exercise.group}
                          {warm.length > 0 ? ` · ${warm.length} warm-up` : ""}
                          {work.length > 0 ? ` · ${work.length} work` : ""}
                        </p>
                        <div className="mt-2 space-y-1">
                          {warm.map((set, setIndex) => (
                            <p
                              key={`w-${setIndex}`}
                              className="text-xs text-amber-100/90"
                            >
                              Warm-up {setIndex + 1}:{" "}
                              {formatSet(set, Boolean(exercise.bodyweight))}
                            </p>
                          ))}
                          {work.map((set, setIndex) => (
                            <p
                              key={`s-${setIndex}`}
                              className={cn(
                                "text-sm",
                                setIndex === 0
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              Set {setIndex + 1}:{" "}
                              {formatSet(set, Boolean(exercise.bodyweight))}
                            </p>
                          ))}
                        </div>
                      </div>
                    </button>
                    {open ? (
                      <div className="border-t border-border px-3 pb-3">
                        <ExerciseHowPanel
                          exercise={exercise}
                          open={open}
                          onClose={() => setOpenId(null)}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
