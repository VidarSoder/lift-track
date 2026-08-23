"use client";

import { useEffect, useState } from "react";
import { formatTimer, spanMs } from "@/lib/session-timer";
import { cn } from "@/lib/utils";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [active]);
  return now;
}

export function SessionClock({
  startedAt,
  finishedAt,
  running,
  className,
}: {
  startedAt: string;
  finishedAt?: string;
  running: boolean;
  className?: string;
}) {
  const now = useNow(running);
  const label = formatTimer(spanMs(startedAt, finishedAt, now));
  return (
    <time
      className={cn("tabular-nums", className)}
      dateTime={finishedAt ?? startedAt}
    >
      {label}
    </time>
  );
}
