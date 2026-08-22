"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 72;

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
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (busy) return;
    const node = scroller.current;
    if (!node || node.scrollTop > 0) {
      pulling.current = false;
      return;
    }
    pulling.current = true;
    startY.current = event.touches[0]?.clientY ?? 0;
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (!pulling.current || busy) return;
    const node = scroller.current;
    if (!node) return;
    const y = event.touches[0]?.clientY ?? 0;
    const delta = y - startY.current;
    if (delta <= 0 || node.scrollTop > 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(120, delta * 0.42));
  }

  async function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    const shouldRefresh = pull >= THRESHOLD && !busy;
    if (!shouldRefresh) {
      setPull(0);
      return;
    }
    setBusy(true);
    setPull(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
      setPull(0);
    }
  }

  return (
    <div
      ref={scroller}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn("relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain", className)}
    >
      <div
        className="pointer-events-none flex items-end justify-center overflow-hidden text-xs text-muted-foreground"
        style={{ height: pull }}
      >
        <span className="mb-2 inline-flex items-center gap-1.5">
          <LoaderCircle
            className={cn("size-3.5", (busy || pull >= THRESHOLD) && "animate-spin")}
          />
          {busy ? "Updating…" : pull >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>
      {children}
    </div>
  );
}
