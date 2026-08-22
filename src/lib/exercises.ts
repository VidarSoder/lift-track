import { uniqueExercises } from "@/data/program";
import type { AthleteDoc, CustomExercise, Exercise } from "@/lib/types";

function customToExercise(custom: CustomExercise): Exercise {
  return {
    id: custom.id,
    name: custom.name,
    group: custom.group,
    sets: custom.sets,
    reps: custom.reps,
    restSec: 90,
    equipment: "Whatever you have",
    setup: "Set up the way this lift works for you.",
    how: "Log the sets. This one is yours.",
    mistakes: "",
    progress: "Add load when the last set is clean.",
  };
}

export function catalogExercises(athlete: AthleteDoc): Exercise[] {
  return [
    ...uniqueExercises(),
    ...(athlete.customExercises ?? []).map(customToExercise),
  ];
}

export function searchExercises(athlete: AthleteDoc, query: string, exclude: string[] = []) {
  const blocked = new Set(exclude);
  const needle = query.trim().toLowerCase();
  return catalogExercises(athlete).filter((exercise) => {
    if (blocked.has(exercise.id)) return false;
    if (!needle) return true;
    return (
      exercise.name.toLowerCase().includes(needle) ||
      exercise.group.toLowerCase().includes(needle)
    );
  });
}

export function resolveExercise(
  id: string,
  athlete: AthleteDoc,
  fallbackSets = 3,
): Exercise {
  const found = catalogExercises(athlete).find((exercise) => exercise.id === id);
  if (found) return found;
  const name = id.replace(/^custom:/, "").replace(/-/g, " ");
  return customToExercise({
    id,
    name: name || "Custom lift",
    group: "Custom",
    sets: fallbackSets,
    reps: "8–10",
  });
}

export function customExerciseId(name: string) {
  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "lift";
  return `custom:${slug}`;
}

export function rememberCustom(athlete: AthleteDoc, custom: CustomExercise): AthleteDoc {
  const list = athlete.customExercises ?? [];
  if (
    list.some(
      (item) =>
        item.id === custom.id ||
        item.name.toLowerCase() === custom.name.toLowerCase(),
    )
  ) {
    return athlete;
  }
  return {
    ...athlete,
    customExercises: [...list, custom].slice(0, 80),
    updatedAt: new Date().toISOString(),
  };
}

