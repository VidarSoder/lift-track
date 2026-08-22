"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { exercisesByMuscle } from "@/data/program";
import { workoutCatalog } from "@/lib/suggest";
import { ExercisePreviewCard } from "@/components/exercise-guide";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Filter = "all" | string;

export function WeekView() {
  const workouts = workoutCatalog();
  const [filter, setFilter] = useState<Filter>("all");
  const groups = useMemo(() => exercisesByMuscle(), []);
  const selected = workouts.find((workout) => workout.id === filter);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Form book
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Every lift</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Tap a card for a video, start and finish photos, a looping GIF, and
          how to do the rep. Nothing starts until you say so.
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
            label={workout.title.split("·")[0].trim()}
          />
        ))}
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{selected.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.exercises.length} lifts · {selected.durationMin} min
              </p>
            </div>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{selected.focus}</p>
          <Link
            href={`/workout?pick=${selected.id}`}
            className={buttonVariants({
              size: "lg",
              className: "h-11 w-full",
            })}
          >
            Start this workout
          </Link>
          {selected.exercises.map((exercise) => (
            <ExercisePreviewCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.group} className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {group.group}
              </h2>
              {group.exercises.map((exercise) => (
                <ExercisePreviewCard key={exercise.id} exercise={exercise} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {label}
    </button>
  );
}
