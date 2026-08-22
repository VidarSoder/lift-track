"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 64;
const ARM = 10;

export function PullToRefresh({
  onRefresh,
  children,
  className,
  resetKey,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  resetKey?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pull = useRef(0);
  const busy = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const [spinning, setSpinning] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  function paint(distance: number) {
    pull.current = distance;
    const node = indicator.current;
    if (!node) return;
    const progress = Math.min(1, distance / THRESHOLD);
    node.style.height = `${distance}px`;
    node.style.opacity = distance < 8 ? "0" : String(0.35 + progress * 0.65);
    const disc = node.querySelector("[data-disc]") as HTMLElement | null;
    if (disc) {
      disc.style.transform = `scale(${0.72 + progress * 0.28}) rotate(${progress * 180}deg)`;
    }
  }

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;

    const atTop = () => node.scrollTop <= 1;
    const inside = (event: TouchEvent) =>
      event.target instanceof Node && node.contains(event.target);

    const onStart = (event: TouchEvent) => {
      if (busy.current || !inside(event)) {
        pulling.current = false;
        return;
      }
      if (!atTop()) {
        pulling.current = false;
        return;
      }
      pulling.current = true;
      startY.current = event.touches[0]?.clientY ?? 0;
    };

    const onMove = (event: TouchEvent) => {
      if (!pulling.current || busy.current) return;
      if (!atTop()) {
        paint(0);
        setArmed(false);
        pulling.current = false;
        return;
      }
      const y = event.touches[0]?.clientY ?? 0;
      const delta = y - startY.current;
      if (delta <= ARM) {
        if (delta <= 0) {
          paint(0);
          setArmed(false);
        }
        return;
      }
      event.preventDefault();
      const distance = Math.min(96, (delta - ARM) * 0.42);
      paint(distance);
      setArmed(distance >= THRESHOLD);
    };

    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const shouldRefresh = pull.current >= THRESHOLD && !busy.current;
      if (!shouldRefresh) {
        paint(0);
        setArmed(false);
        return;
      }
      busy.current = true;
      setSpinning(true);
      paint(THRESHOLD);
      try {
        await onRefreshRef.current();
      } finally {
        busy.current = false;
        setSpinning(false);
        setArmed(false);
        paint(0);
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true, capture: true });
    document.addEventListener("touchmove", onMove, { passive: false, capture: true });
    document.addEventListener("touchend", onEnd, { capture: true });
    document.addEventListener("touchcancel", onEnd, { capture: true });
    return () => {
      document.removeEventListener("touchstart", onStart, true);
      document.removeEventListener("touchmove", onMove, true);
      document.removeEventListener("touchend", onEnd, true);
      document.removeEventListener("touchcancel", onEnd, true);
    };
  }, []);

  return (
    <div
      ref={scroller}
      data-app-scroll
      className={cn("app-scroll relative flex min-h-0 flex-1 flex-col", className)}
    >
      <div
        ref={indicator}
        className="pointer-events-none flex shrink-0 items-end justify-center overflow-hidden opacity-0"
        style={{ height: 0 }}
      >
        <div
          data-disc
          className="mb-1 grid size-8 place-items-center rounded-full border border-border/70 bg-card shadow-sm"
        >
          {spinning ? (
            <LoaderCircle className="size-4 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className={cn(
                "size-4 text-muted-foreground transition-colors",
                armed && "text-primary",
              )}
            />
          )}
        </div>
      </div>
      <div className="flex min-h-full flex-col">{children}</div>
    </div>
  );
}
