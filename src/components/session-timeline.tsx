"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExerciseThumb } from "@/components/exercise-guide";
import { ExerciseMark } from "@/components/exercise-mark";
import { formatNiceDate } from "@/lib/dates";
import {
  sessionCoverExerciseId,
  sessionEventBadges,
  sessionShortTitle,
  type SessionBadge,
} from "@/lib/session-cover";
import { canReopenSummary, isStretchDay } from "@/lib/session";
import type { AthleteDoc, SessionSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function BadgePill({ badge }: { badge: SessionBadge }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium tracking-wide",
        badge.tone === "gold" && "bg-amber-400/15 text-amber-100",
        badge.tone === "mint" && "bg-emerald-400/15 text-emerald-100",
        badge.tone === "fire" && "bg-orange-400/15 text-orange-100",
        badge.tone === "sky" && "bg-sky-400/15 text-sky-100",
        badge.tone === "sand" && "bg-stone-300/15 text-stone-100",
        badge.tone === "primary" && "bg-primary/20 text-primary",
      )}
    >
      {badge.label}
    </span>
  );
}

function VolumeMeter({ value, max }: { value: number; max: number }) {
  const width = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-black/35">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function TimelineEvent({
  summary,
  athlete,
  index,
  maxVolume,
  sameDayCount,
  href,
  onReopen,
}: {
  summary: SessionSummary;
  athlete: AthleteDoc;
  index: number;
  maxVolume: number;
  sameDayCount: number;
  href: string;
  onReopen?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const coverId = sessionCoverExerciseId(summary.dayId);
  const reopen = canReopenSummary(summary);
  const badges = sessionEventBadges(summary, athlete, {
    maxVolume,
    sameDayCount,
    canReopen: reopen,
  });
  const title = sessionShortTitle(summary);
  const stretch = isStretchDay(summary.dayId);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      className={cn(
        "relative grid grid-cols-[1.25rem_1fr] gap-3 pb-8 last:pb-0",
        "translate-y-5 opacity-0 transition-[opacity,transform] duration-700 ease-out",
        visible && "translate-y-0 opacity-100",
      )}
      style={{
        transitionDelay: visible ? `${Math.min(index, 6) * 45}ms` : "0ms",
      }}
    >
      <div className="relative flex justify-center">
        <span
          className={cn(
            "relative z-10 mt-10 size-3 rounded-full ring-4 ring-background",
            stretch ? "bg-emerald-300/90" : "bg-primary",
            visible && "animate-[timeline-pulse_1.6s_ease-out_1]",
          )}
        />
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {formatNiceDate(summary.date)}
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {summary.durationMin} min
          </p>
        </div>

        <Link
          href={href}
          className="group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_40px_-28px_rgba(0,0,0,0.8)] transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/35"
        >
          <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
            {coverId ? (
              <ExerciseThumb
                exerciseId={coverId}
                name={title}
                className="h-full w-full scale-105 object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <ExerciseMark id={summary.dayId} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-xl leading-none tracking-tight text-white">
                    {title}
                  </p>
                  <p className="mt-1.5 text-xs text-white/75">
                    {summary.completedSets}/{summary.plannedSets} sets
                    {summary.volume > 0 ? ` · ${summary.volume} kg` : ""}
                    {summary.mood ? ` · mood ${summary.mood}/5` : ""}
                  </p>
                </div>
                <ExerciseMark
                  id={summary.dayId}
                  size="sm"
                  className="bg-black/35"
                />
              </div>
            </div>
          </div>

          {summary.volume > 0 ? (
            <div className="px-3 py-2.5">
              <VolumeMeter value={summary.volume} max={maxVolume} />
            </div>
          ) : (
            <div className="px-3 py-2.5 text-[11px] text-muted-foreground">
              {stretch ? "Mobility session" : "No loaded volume logged"}
            </div>
          )}
        </Link>

        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {badges.map((badge) => (
              <BadgePill key={badge.label} badge={badge} />
            ))}
          </div>
        ) : null}

        {reopen && onReopen ? (
          <button
            type="button"
            onClick={onReopen}
            className="text-[11px] font-medium text-primary underline underline-offset-2"
          >
            Reopen within 24h
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function SessionTimeline({
  athlete,
  items,
  sessionHref,
  onReopen,
  hasMore,
  loadingMore,
  onLoadMore,
  showHeader = true,
}: {
  athlete: AthleteDoc;
  items: SessionSummary[];
  sessionHref: (summary: SessionSummary) => string;
  onReopen: (summary: SessionSummary) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  showHeader?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const maxVolume = useMemo(
    () => Math.max(1, ...items.map((item) => item.volume)),
    [items],
  );
  const sameDayCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.date, (counts.get(item.date) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !loadingMore) onLoadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  if (items.length === 0 && !loadingMore) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Finish a session and your scroll timeline shows up here — photos,
          badges, and the days you trained.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {showHeader ? (
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Log
          </p>
          <h2 className="font-heading text-2xl leading-none">
            Session timeline
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Scroll the story of your training — newest at the top.
          </p>
        </header>
      ) : null}

      <div className="relative">
        <div
          aria-hidden
          className="absolute top-10 bottom-4 left-[0.55rem] w-px bg-gradient-to-b from-primary via-border to-transparent"
        />
        <div className="space-y-0">
          {items.map((item, index) => (
            <TimelineEvent
              key={`${item.date}-${item.dayId}-${item.startedAt ?? index}`}
              summary={item}
              athlete={athlete}
              index={index}
              maxVolume={maxVolume}
              sameDayCount={sameDayCounts.get(item.date) ?? 1}
              href={sessionHref(item)}
              onReopen={
                canReopenSummary(item) ? () => onReopen(item) : undefined
              }
            />
          ))}
        </div>
        {hasMore ? <div ref={sentinelRef} className="h-8" /> : null}
        {loadingMore ? (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Loading more…
          </p>
        ) : null}
      </div>
    </section>
  );
}
