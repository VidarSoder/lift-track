"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { exercisesByMuscle } from "@/data/program";
import { formatDateISO } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import { workoutCatalog } from "@/lib/suggest";
import { ExerciseBook, ExerciseList } from "@/components/exercise-guide";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Filter = "all" | string;

export function WeekView() {
  const { todaySession } = useTraining();
  const workouts = workoutCatalog();
  const [filter, setFilter] = useState<Filter>("all");
  const groups = useMemo(() => exercisesByMuscle(), []);
  const selected = workouts.find((workout) => workout.id === filter);
  const active = isOpenSession(todaySession, formatDateISO())
    ? todaySession
    : undefined;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Form book
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Every lift</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Photo and last weight on the list. Tap a row for the GIF on this page,
          then Back.
        </p>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All lifts"
        />
        {workouts.map((workout) => (
          <FilterChip
            key={workout.id}
            active={filter === workout.id}
            onClick={() => setFilter(workout.id)}
            id={workout.id}
            label={workout.title.split("·")[0].trim()}
          />
        ))}
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ExerciseMark id={selected.id} />
              <div>
                <p className="font-medium">{selected.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.exercises.length} lifts · {selected.durationMin} min
                </p>
              </div>
            </div>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{selected.focus}</p>
          {active && active.dayId === selected.id ? (
            <Link
              href="/workout"
              className={buttonVariants({
                size: "lg",
                className: "h-11 w-full",
              })}
            >
              Back to this session
            </Link>
          ) : active ? (
            <p className="rounded-xl bg-secondary/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
              Preview only. Use Back to session under the list.
            </p>
          ) : (
            <Link
              href={`/workout?pick=${selected.id}`}
              className={buttonVariants({
                size: "lg",
                className: "h-11 w-full",
              })}
            >
              Preview, then start
            </Link>
          )}
          <ExerciseList exercises={selected.exercises} />
        </div>
      ) : (
        <ExerciseBook groups={groups} />
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
  id,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  id?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {id ? (
        <ExerciseMark id={id} size="sm" className={active ? "bg-black/15" : undefined} />
      ) : null}
      {label}
    </button>
  );
}
