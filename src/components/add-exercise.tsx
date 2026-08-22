"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  customExerciseId,
  searchExercises,
} from "@/lib/exercises";
import type { AthleteDoc, CustomExercise, Exercise } from "@/lib/types";
import { ExerciseMark } from "@/components/exercise-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddExerciseButton({
  athlete,
  exclude,
  onPick,
  onCreate,
}: {
  athlete: AthleteDoc;
  exclude: string[];
  onPick: (exercise: Exercise) => void;
  onCreate: (custom: CustomExercise) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [name, setName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("8–10");

  const matches = useMemo(
    () => searchExercises(athlete, query, exclude).slice(0, 8),
    [athlete, exclude, query],
  );
  const showCustom = query.trim().length > 0 && matches.length === 0;

  function reset() {
    setQuery("");
    setCustomOpen(false);
    setName("");
    setSets(3);
    setReps("8–10");
  }

  function pick(exercise: Exercise) {
    onPick(exercise);
    setOpen(false);
    reset();
  }

  function create() {
    const title = (name.trim() || query.trim() || "Custom lift").slice(0, 48);
    let id = customExerciseId(title);
    if ((athlete.customExercises ?? []).some((item) => item.id === id)) {
      id = `${id}-${Date.now().toString(36).slice(-4)}`;
    }
    onCreate({
      id,
      name: title,
      group: "Custom",
      sets: Math.min(8, Math.max(1, sets)),
      reps: reps.trim() || "8–10",
    });
    setOpen(false);
    reset();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add a lift
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a lift</DialogTitle>
            <DialogDescription>
              Search the book first. If nothing matches, save your own — it
              stays on this program only.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCustomOpen(false);
              setName(event.target.value);
            }}
            placeholder="Search curls, laterals…"
            className="h-11"
            autoFocus
          />
          {matches.length > 0 ? (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {matches.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => pick(exercise)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-secondary"
                >
                  <ExerciseMark id={exercise.id} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{exercise.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {exercise.group} · {exercise.sets} × {exercise.reps}
                      {exercise.id.startsWith("custom:") ? " · yours" : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? "Nothing in the book or your saved lifts matches that."
                : "Type a name, or add a custom lift."}
            </p>
          )}
          {showCustom || customOpen ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="custom-name">Name</Label>
                <Input
                  id="custom-name"
                  value={name || query}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="custom-sets">Sets</Label>
                  <Input
                    id="custom-sets"
                    type="number"
                    min={1}
                    max={8}
                    value={sets}
                    onChange={(event) =>
                      setSets(Number(event.target.value) || 3)
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-reps">Reps</Label>
                  <Input
                    id="custom-reps"
                    value={reps}
                    onChange={(event) => setReps(event.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <Button className="h-11 w-full" onClick={create}>
                Save and add
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                setCustomOpen(true);
                setName(query);
              }}
            >
              Add custom
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
