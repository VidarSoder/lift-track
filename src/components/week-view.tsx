"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, X } from "lucide-react";
import { matchesExerciseQuery } from "@/data/exercise-tags";
import { exercisesByMuscle } from "@/data/program";
import { formatDateISO } from "@/lib/dates";
import { catalogExercises } from "@/lib/exercises";
import { isOpenSession } from "@/lib/active-session";
import { workoutCatalog } from "@/lib/suggest";
import { ExerciseBook, ExerciseList } from "@/components/exercise-guide";
import { ExerciseMark } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Filter = "all" | string;

export function WeekView() {
  const { athlete, todaySession } = useTraining();
  const workouts = workoutCatalog().filter(
    (workout) => workout.id !== "warmup" && workout.id !== "stretch",
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const groups = useMemo(() => exercisesByMuscle(), []);
  const selected = workouts.find((workout) => workout.id === filter);
  const active = isOpenSession(todaySession, formatDateISO())
    ? todaySession
    : undefined;
  const searching = query.trim().length > 0;
  const dayIds = selected
    ? new Set(selected.exercises.map((exercise) => exercise.id))
    : null;
  const matches = catalogExercises(athlete).filter((exercise) => {
    if (dayIds && !dayIds.has(exercise.id)) return false;
    return matchesExerciseQuery(exercise, query);
  });

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Form book
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Every lift</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Search in Swedish or English. Tags on every lift — bänkpress,
          latsdrag, knäböj, sidolyft. Photo and last weight stay on the row.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sök bänkpress, latsdrag, knäböj…"
          className="h-12 pr-11 pl-10"
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Sök lyft"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground"
            aria-label="Rensa sök"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

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
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
          >
            <ChevronLeft className="size-4" />
            All lifts
          </button>
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
          {searching ? (
            matches.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {matches.length} lyft · {query.trim()}
                </p>
                <ExerciseList exercises={matches} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Inget matchar “{query.trim()}” i {selected.title.split("·")[0].trim()}.
                Prova bröst, rodd, axelpress — eller byt till All lifts.
              </p>
            )
          ) : (
            <ExerciseList exercises={selected.exercises} />
          )}
        </div>
      ) : searching ? (
        matches.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{matches.length} lyft</p>
            <ExerciseList exercises={matches} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Inget matchar “{query.trim()}”. Prova bröst, rodd, axelpress eller
            det svenska namnet.
          </p>
        )
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
