"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const REVEAL_PX = 72;

export function SwipeDismissRow({
  onDismiss,
  children,
  className,
}: {
  onDismiss: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const moved = useRef(false);

  function clamp(value: number) {
    return Math.max(0, Math.min(REVEAL_PX, value));
  }

  function snapOpen(value: number) {
    return value > REVEAL_PX / 2 ? REVEAL_PX : 0;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setDragging(true);
    startX.current = event.clientX;
    startOffset.current = offset;
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const delta = startX.current - event.clientX;
    if (Math.abs(delta) > 6) moved.current = true;
    setOffset(clamp(startOffset.current + delta));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // capture may already be released
    }
    setOffset((current) => snapOpen(current));
  }

  function dismiss() {
    setOffset(0);
    onDismiss();
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <div
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-destructive"
        aria-hidden={offset < 8}
      >
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-white"
          aria-label="Remove from preview"
          onClick={dismiss}
        >
          <X className="size-5" />
        </button>
      </div>
      <div
        className={cn(
          "relative touch-pan-y",
          !dragging && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(-${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (moved.current) {
            event.preventDefault();
            event.stopPropagation();
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
