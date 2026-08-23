"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { displayTags } from "@/data/exercise-tags";
import type { Exercise, LastLoad } from "@/lib/types";
import { mediaFor, photoUrl, youtubeThumb, youtubeWatch } from "@/data/media";
import { lastLoad } from "@/lib/session";
import { ExerciseMark, markEdge } from "@/components/exercise-mark";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function FormLoop({
  slug,
  youtube,
  alt,
  className,
  fit = "contain",
}: {
  slug: string;
  youtube: string;
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [broken, setBroken] = useState(false);
  const objectClass = fit === "cover" ? "object-cover" : "object-contain";

  useEffect(() => {
    if (broken) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current === 0 ? 1 : 0));
    }, 750);
    return () => window.clearInterval(timer);
  }, [broken]);

  if (broken) {
    return (
      <img
        src={youtubeThumb(youtube)}
        alt={alt}
        className={cn("h-full w-full bg-black object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("relative h-full w-full bg-black", className)}>
      <img
        src={photoUrl(slug, 0)}
        alt={`${alt} start`}
        className={cn(
          "absolute inset-0 h-full w-full bg-black transition-opacity duration-200",
          objectClass,
          frame === 0 ? "opacity-100" : "opacity-0",
        )}
        onError={() => setBroken(true)}
      />
      <img
        src={photoUrl(slug, 1)}
        alt={`${alt} finish`}
        className={cn(
          "absolute inset-0 h-full w-full bg-black transition-opacity duration-200",
          objectClass,
          frame === 1 ? "opacity-100" : "opacity-0",
        )}
        onError={() => setBroken(true)}
      />
    </div>
  );
}

export function ExerciseThumb({
  exerciseId,
  name,
  className,
}: {
  exerciseId: string;
  name: string;
  className?: string;
}) {
  const media = mediaFor(exerciseId);
  if (!media) {
    return (
      <div className={cn("grid place-items-center bg-secondary", className)}>
        <ExerciseMark id={exerciseId} />
      </div>
    );
  }
  return (
    <img
      src={photoUrl(media.slug, 0)}
      alt={name}
      className={cn("h-full w-full bg-black object-cover", className)}
    />
  );
}

function StillPhoto({
  slug,
  alt,
  className,
}: {
  slug: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={photoUrl(slug, 0)}
      alt={alt}
      className={cn("h-full w-full bg-black object-cover", className)}
    />
  );
}

function loadLabel(load: LastLoad | null) {
  if (!load) return null;
  if (load.weight === 0) {
    return load.reps ? `Last BW × ${load.reps}` : "Last BW";
  }
  return load.reps
    ? `Last ${load.weight} kg × ${load.reps}`
    : `Last ${load.weight} kg`;
}

export function ExerciseRow({
  exercise,
  open,
  onToggle,
  load,
}: {
  exercise: Exercise;
  open: boolean;
  onToggle: () => void;
  load?: LastLoad | null;
}) {
  const media = mediaFor(exercise.id);
  const last = loadLabel(load ?? null);
  const tags = displayTags(exercise);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border border-l-2 bg-card",
        markEdge(exercise.id),
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {media ? <StillPhoto slug={media.slug} alt={exercise.name} /> : null}
        </div>
        <ExerciseMark id={exercise.id} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{exercise.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {exercise.group} · {exercise.sets} × {exercise.reps}
            {last ? ` · ${last}` : ""}
          </p>
          {tags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          {open ? "Close" : "GIF"}
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              How it moves
            </p>
            <button
              type="button"
              onClick={onToggle}
              className="text-xs font-medium text-primary"
            >
              Back
            </button>
          </div>

          {media ? (
            <div className="aspect-[5/4] overflow-hidden rounded-xl bg-black">
              <FormLoop
                slug={media.slug}
                youtube={media.youtube}
                alt={exercise.name}
              />
            </div>
          ) : null}

          {media ? (
            <div className="grid grid-cols-2 gap-2">
              <figure className="overflow-hidden rounded-lg bg-black">
                <img
                  src={photoUrl(media.slug, 0)}
                  alt={`${exercise.name} start`}
                  className="aspect-[4/5] w-full object-contain"
                />
                <figcaption className="bg-secondary px-2 py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  Start
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-lg bg-black">
                <img
                  src={photoUrl(media.slug, 1)}
                  alt={`${exercise.name} finish`}
                  className="aspect-[4/5] w-full object-contain"
                />
                <figcaption className="bg-secondary px-2 py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  Finish
                </figcaption>
              </figure>
            </div>
          ) : null}

          <div className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Setup. </span>
              {exercise.setup}
            </p>
            <p>
              <span className="font-medium text-foreground">The rep. </span>
              {exercise.how}
            </p>
          </div>

          {media ? (
            <a
              href={youtubeWatch(media.youtube)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline"
            >
              <ExternalLink className="size-3.5" />
              Short video on YouTube
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  const { athlete } = useTraining();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {exercises.map((exercise) => (
        <ExerciseRow
          key={exercise.id}
          exercise={exercise}
          load={lastLoad(athlete, exercise.id)}
          open={openId === exercise.id}
          onToggle={() =>
            setOpenId((current) => (current === exercise.id ? null : exercise.id))
          }
        />
      ))}
    </div>
  );
}

export function ExerciseBook({
  groups,
}: {
  groups: { group: string; exercises: Exercise[] }[];
}) {
  const { athlete } = useTraining();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.group} className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {group.group}
          </h2>
          {group.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              load={lastLoad(athlete, exercise.id)}
              open={openId === exercise.id}
              onToggle={() =>
                setOpenId((current) => (current === exercise.id ? null : exercise.id))
              }
            />
          ))}
        </section>
      ))}
    </div>
  );
}

export function ExerciseHowButton({
  open,
  onToggle,
  label = "How",
}: {
  open: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <Button type="button" size="sm" variant="ghost" onClick={onToggle}>
      {open ? "Close" : label}
    </Button>
  );
}

export function ExerciseHowPanel({
  exercise,
  open,
  onClose,
}: {
  exercise: Exercise;
  open: boolean;
  onClose: () => void;
}) {
  const media = mediaFor(exercise.id);
  if (!open) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          How it moves
        </p>
        <button type="button" onClick={onClose} className="text-xs font-medium text-primary">
          Back
        </button>
      </div>
      {media ? (
        <div className="aspect-[5/4] overflow-hidden rounded-xl bg-black">
          <FormLoop slug={media.slug} youtube={media.youtube} alt={exercise.name} />
        </div>
      ) : null}
      <p className="text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">The rep. </span>
        {exercise.how}
      </p>
      {media ? (
        <a
          href={youtubeWatch(media.youtube)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline"
        >
          <ExternalLink className="size-3.5" />
          Short video on YouTube
        </a>
      ) : null}
    </div>
  );
}

export function WorkoutExercisePreview({ exercises }: { exercises: Exercise[] }) {
  return <ExerciseList exercises={exercises} />;
}
