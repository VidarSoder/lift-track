"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Pause, Play } from "lucide-react";
import { displayTags } from "@/data/exercise-tags";
import type { Exercise, LastLoad } from "@/lib/types";
import {
  mediaFor,
  mediaStartSrc,
  mediaSteps,
  type ExerciseMedia,
  youtubeThumb,
  youtubeWatch,
} from "@/data/media";
import { lastLoad } from "@/lib/session";
import { ExerciseMark, markEdge } from "@/components/exercise-mark";
import { CloseButton } from "@/components/close-button";
import { SwipeDismissRow } from "@/components/swipe-dismiss-row";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function FormLoop({
  media,
  alt,
  className,
  fit = "contain",
}: {
  media: ExerciseMedia;
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const steps = mediaSteps(media);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [broken, setBroken] = useState(false);
  const objectClass = fit === "cover" ? "object-cover" : "object-contain";

  useEffect(() => {
    setIndex(0);
  }, [media.slug, steps.length]);

  useEffect(() => {
    if (broken || !playing || steps.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % steps.length);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [broken, playing, steps.length]);

  if (broken || steps.length === 0) {
    return (
      <img
        src={youtubeThumb(media.youtube)}
        alt={alt}
        className={cn("h-full w-full bg-black object-cover", className)}
      />
    );
  }

  const active = steps[index] ?? steps[0];

  return (
    <div className={cn("relative h-full w-full bg-black", className)}>
      {steps.map((step, stepIndex) => (
        <img
          key={`${step.src}-${step.label}`}
          src={step.src}
          alt={`${alt} ${step.label}`}
          className={cn(
            "absolute inset-0 h-full w-full bg-black transition-opacity duration-200",
            objectClass,
            stepIndex === index ? "opacity-100" : "opacity-0",
          )}
          onError={() => setBroken(true)}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-white/85">
            {active.label}
          </p>
          {steps.length > 2 ? (
            <div className="mt-1.5 flex gap-1">
              {steps.map((step, stepIndex) => (
                <button
                  key={`dot-${step.label}`}
                  type="button"
                  aria-label={`Show ${step.label}`}
                  onClick={() => {
                    setPlaying(false);
                    setIndex(stepIndex);
                  }}
                  className={cn(
                    "pointer-events-auto size-1.5 rounded-full transition",
                    stepIndex === index ? "bg-white" : "bg-white/35",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
        {steps.length > 1 ? (
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label={playing ? "Pause form loop" : "Play form loop"}
          >
            {playing ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </button>
        ) : null}
      </div>
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
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <img
        src={youtubeThumb(media.youtube)}
        alt={name}
        className={cn("h-full w-full bg-black object-cover", className)}
      />
    );
  }
  return (
    <img
      src={mediaStartSrc(media)}
      alt={name}
      className={cn("h-full w-full bg-black object-cover", className)}
      onError={() => setBroken(true)}
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

function StepStrip({ media, alt }: { media: ExerciseMedia; alt: string }) {
  const steps = mediaSteps(media);
  const cols =
    steps.length >= 3 ? "grid-cols-3" : steps.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={cn("grid gap-2", cols)}>
      {steps.map((step) => (
        <figure key={`${step.label}-${step.src}`} className="overflow-hidden rounded-lg bg-black">
          <img
            src={step.src}
            alt={`${alt} ${step.label}`}
            className="aspect-[4/5] w-full object-contain"
          />
          <figcaption className="bg-secondary px-1.5 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {step.label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function ExerciseRow({
  exercise,
  open,
  onToggle,
  load,
  onDismiss,
}: {
  exercise: Exercise;
  open: boolean;
  onToggle: () => void;
  load?: LastLoad | null;
  onDismiss?: () => void;
}) {
  const media = mediaFor(exercise.id);
  const last = loadLabel(load ?? null);
  const tags = displayTags(exercise);

  const row = (
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
          {media ? (
            <ExerciseThumb exerciseId={exercise.id} name={exercise.name} />
          ) : null}
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
            <CloseButton onClick={onToggle} label="Close exercise guide" />
          </div>

          {media ? (
            <div className="aspect-[5/4] overflow-hidden rounded-xl bg-black">
              <FormLoop media={media} alt={exercise.name} />
            </div>
          ) : null}

          {media ? <StepStrip media={media} alt={exercise.name} /> : null}

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

  if (onDismiss) {
    return <SwipeDismissRow onDismiss={onDismiss}>{row}</SwipeDismissRow>;
  }
  return row;
}

export function ExerciseList({
  exercises,
  onDismissExercise,
}: {
  exercises: Exercise[];
  onDismissExercise?: (exerciseId: string) => void;
}) {
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
          onDismiss={
            onDismissExercise
              ? () => onDismissExercise(exercise.id)
              : undefined
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
          Close
        </button>
      </div>
      {media ? (
        <div className="aspect-[5/4] overflow-hidden rounded-xl bg-black">
          <FormLoop media={media} alt={exercise.name} />
        </div>
      ) : null}
      {media ? <StepStrip media={media} alt={exercise.name} /> : null}
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

export function WorkoutExercisePreview({
  exercises,
  onDismissExercise,
}: {
  exercises: Exercise[];
  onDismissExercise?: (exerciseId: string) => void;
}) {
  return (
    <ExerciseList
      exercises={exercises}
      onDismissExercise={onDismissExercise}
    />
  );
}
