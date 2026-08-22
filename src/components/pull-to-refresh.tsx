"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { ArrowDown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 64;

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pull = useRef(0);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);

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

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (busy) return;
    const node = scroller.current;
    if (!node || node.scrollTop > 1) {
      pulling.current = false;
      return;
    }
    pulling.current = true;
    startY.current = event.touches[0]?.clientY ?? 0;
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (!pulling.current || busy) return;
    const node = scroller.current;
    if (!node || node.scrollTop > 1) {
      paint(0);
      setArmed(false);
      return;
    }
    const y = event.touches[0]?.clientY ?? 0;
    const delta = y - startY.current;
    if (delta <= 0) {
      paint(0);
      setArmed(false);
      return;
    }
    const distance = Math.min(96, delta * 0.38);
    paint(distance);
    setArmed(distance >= THRESHOLD);
  }

  async function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    const shouldRefresh = pull.current >= THRESHOLD && !busy;
    if (!shouldRefresh) {
      paint(0);
      setArmed(false);
      return;
    }
    setBusy(true);
    paint(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
      setArmed(false);
      paint(0);
    }
  }

  return (
    <div
      ref={scroller}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
        className,
      )}
    >
      <div
        ref={indicator}
        className="pointer-events-none flex items-end justify-center overflow-hidden opacity-0"
        style={{ height: 0 }}
      >
        <div
          data-disc
          className="mb-1 grid size-8 place-items-center rounded-full border border-border/70 bg-card shadow-sm"
        >
          {busy ? (
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
      {children}
    </div>
  );
}
