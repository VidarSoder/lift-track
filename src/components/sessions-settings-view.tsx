"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackLink } from "@/components/back-link";
import { SessionTimeline } from "@/components/session-timeline";
import { useTraining } from "@/components/training-provider";
import { Card, CardContent } from "@/components/ui/card";
import {
  canReopenSession,
  displaySessionCounts,
  isStretchDay,
} from "@/lib/session";
import {
  sessionDocId,
  sessionDocIdCandidates,
  sessionDocIdFromSummary,
} from "@/lib/session-id";
import { fetchSession } from "@/lib/store";
import type { SessionSummary } from "@/lib/types";

export function SessionsSettingsView() {
  const router = useRouter();
  const { athlete, todaySession, reopenEndedSession } = useTraining();
  const sessionCounts = displaySessionCounts(athlete);

  async function reopenSummary(summary: SessionSummary) {
    const matchToday =
      todaySession &&
      todaySession.date === summary.date &&
      todaySession.dayId === summary.dayId &&
      (!summary.startedAt || todaySession.startedAt === summary.startedAt) &&
      canReopenSession(todaySession);

    if (matchToday && todaySession) {
      reopenEndedSession(todaySession);
      router.push("/workout");
      return;
    }

    for (const docId of sessionDocIdCandidates(summary)) {
      const remote = await fetchSession(docId);
      if (!remote) continue;
      if (remote.dayId !== summary.dayId) continue;
      if (
        summary.startedAt &&
        remote.startedAt &&
        remote.startedAt !== summary.startedAt
      ) {
        continue;
      }
      if (!canReopenSession(remote)) {
        toast.message("That session is past the 24-hour reopen window.");
        return;
      }
      reopenEndedSession(remote);
      router.push("/workout");
      return;
    }

    toast.error("Couldn’t find that session to reopen.");
  }

  function sessionHref(summary: SessionSummary) {
    const docId = sessionDocIdFromSummary(summary);
    if (docId) return `/progress/session?id=${encodeURIComponent(docId)}`;
    if (todaySession && todaySession.date === summary.date) {
      return `/progress/session?id=${encodeURIComponent(sessionDocId(todaySession))}`;
    }
    return `/progress/session?id=${encodeURIComponent(summary.date)}`;
  }

  return (
    <div className="space-y-5 pb-4">
      <header>
        <BackLink href="/settings" label="Settings" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Sessions</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Training and stretch stay separate. Scroll the timeline for photos and
          badges.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Training</p>
            <p className="text-2xl font-semibold">{sessionCounts.training}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Stretch</p>
            <p className="text-2xl font-semibold">{sessionCounts.stretch}</p>
          </CardContent>
        </Card>
      </div>

      <SessionTimeline
        athlete={athlete}
        sessionHref={sessionHref}
        onReopen={(summary) => void reopenSummary(summary)}
      />

      {athlete.recent.some((item) => isStretchDay(item.dayId)) ? (
        <p className="text-center text-xs text-muted-foreground">
          Stretch events use the mint rail dots so they read apart from lifting.
        </p>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Prefer the set-by-set view? Open any card, or go via{" "}
        <Link href="/progress" className="font-medium text-primary underline">
          Progress
        </Link>
        .
      </p>
    </div>
  );
}
