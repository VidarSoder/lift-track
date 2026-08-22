"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { formatDateISO } from "@/lib/dates";
import { isOpenSession } from "@/lib/active-session";
import { sessionSetCounts } from "@/lib/session";
import { useTraining } from "@/components/training-provider";

export function ActiveSessionFab() {
  const { todaySession } = useTraining();
  const pathname = usePathname();
  const pick = useSearchParams().get("pick");
  const today = formatDateISO();
  const open = isOpenSession(todaySession, today);

  if (!open || !todaySession) return null;

  const onActivePage =
    pathname === "/workout" && (!pick || pick === todaySession.dayId);
  if (onActivePage) return null;

  const counts = sessionSetCounts(todaySession);
  const shortTitle = todaySession.title.split("·")[0].trim();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.75rem] z-30 mx-auto flex max-w-md justify-end px-4">
      <Link
        href="/workout"
        className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm font-medium shadow-lg shadow-black/25 backdrop-blur-md"
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
          <Dumbbell className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate leading-tight">{shortTitle}</span>
          <span className="block text-[11px] font-normal text-muted-foreground">
            Back to session · {counts.completedSets}/{counts.plannedSets} sets
          </span>
        </span>
      </Link>
    </div>
  );
}
