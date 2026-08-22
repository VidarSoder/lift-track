"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { Exercise } from "@/lib/types";
import {
  mediaFor,
  photoUrl,
  youtubeEmbed,
  youtubeThumb,
  youtubeWatch,
} from "@/data/media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function Still({
  slug,
  frame,
  label,
  alt,
}: {
  slug: string;
  frame: 0 | 1;
  label: string;
  alt: string;
}) {
  return (
    <figure className="overflow-hidden rounded-xl bg-black">
      <img
        src={photoUrl(slug, frame)}
        alt={`${alt} ${label.toLowerCase()}`}
        className="aspect-[4/5] w-full object-contain"
      />
      <figcaption className="bg-secondary px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

export function ExerciseGuide({
  exercise,
  open,
  onOpenChange,
}: {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const media = mediaFor(exercise.id);
  const [playing, setPlaying] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPlaying(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg">{exercise.name}</DialogTitle>
          <DialogDescription>
            {exercise.group} · {exercise.sets} × {exercise.reps}
            {exercise.restSec ? ` · rest ${exercise.restSec}s` : ""}
          </DialogDescription>
        </DialogHeader>

        {media ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl bg-black">
              {playing ? (
                <div className="aspect-video">
                  <iframe
                    title={`${exercise.name} form video`}
                    src={youtubeEmbed(media.youtube)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="relative block aspect-video w-full"
                >
                  <img
                    src={youtubeThumb(media.youtube)}
                    alt={`${exercise.name} video`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-black/35" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                      <Play className="size-4 fill-black" />
                      Play video
                    </span>
                  </span>
                </button>
              )}
            </div>

            <a
              href={youtubeWatch(media.youtube)}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-medium"
            >
              <ExternalLink className="size-4" />
              Open in YouTube
            </a>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Start and finish
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Still slug={media.slug} frame={0} label="Start" alt={exercise.name} />
                <Still slug={media.slug} frame={1} label="Finish" alt={exercise.name} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Motion loop
              </p>
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black">
                <FormLoop
                  slug={media.slug}
                  youtube={media.youtube}
                  alt={exercise.name}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Setup. </span>
            {exercise.setup}
          </p>
          <p>
            <span className="font-medium text-foreground">The rep. </span>
            {exercise.how}
          </p>
          <p>
            <span className="font-medium text-foreground">Watch for. </span>
            {exercise.mistakes}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExerciseHowButton({
  exercise,
  label = "How",
}: {
  exercise: Exercise;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ExerciseGuide exercise={exercise} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ExercisePreviewCard({
  exercise,
  compact = false,
}: {
  exercise: Exercise;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const media = mediaFor(exercise.id);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left"
      >
        <div className={cn("relative bg-black", compact ? "aspect-[16/9]" : "aspect-[4/3]")}>
          {media ? (
            <FormLoop
              slug={media.slug}
              youtube={media.youtube}
              alt={exercise.name}
            />
          ) : null}
          <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">
            GIF
          </span>
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-black">
            <Play className="size-3 fill-black" />
            Video + how
          </span>
        </div>
        <div className="px-3 py-3">
          <p className="font-medium leading-tight">{exercise.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {exercise.group} · {exercise.sets} × {exercise.reps} · {exercise.equipment}
          </p>
        </div>
      </button>
      <ExerciseGuide exercise={exercise} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function WorkoutExercisePreview({
  exercises,
  compact = false,
}: {
  exercises: Exercise[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {exercises.map((exercise) => (
        <ExercisePreviewCard
          key={exercise.id}
          exercise={exercise}
          compact={compact}
        />
      ))}
    </div>
  );
}
