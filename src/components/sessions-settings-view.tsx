"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "@/lib/session";
import {
  sessionDocId,
  sessionDocIdCandidates,
  sessionDocIdFromSummary,
} from "@/lib/session-id";
import { fetchSession, fetchSessionPage } from "@/lib/store";
import type { SessionSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "all" | "training" | "stretch";

export function SessionsSettingsView() {
  const router = useRouter();
  const { athlete, todaySession, reopenEndedSession } = useTraining();
  const sessionCounts = displaySessionCounts(athlete);
  const [kind, setKind] = useState<Kind>("all");
  const [items, setItems] = useState<SessionSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (nextKind: Kind, nextCursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const page = await fetchSessionPage({
        kind: nextKind,
        cursor: nextCursor,
        limit: 8,
      });
      if (!page) {
        toast.error("Couldn’t load sessions.");
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      setItems((current) =>
        append ? [...current, ...page.items] : page.items,
      );
      setCursor(page.nextCursor);
      setLoading(false);
      setLoadingMore(false);
    },
    [],
  );

  useEffect(() => {
    void loadPage(kind, null, false);
  }, [kind, loadPage]);

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
          Filter the timeline, then keep scrolling — pages load as you go.
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

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1">
        {(
          [
            ["all", "Both"],
            ["training", "Training"],
            ["stretch", "Stretch"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn(
              "h-10 rounded-xl text-sm font-medium",
              kind === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading timeline…
        </p>
      ) : (
        <SessionTimeline
          athlete={athlete}
          items={items}
          sessionHref={sessionHref}
          onReopen={(summary) => void reopenSummary(summary)}
          hasMore={Boolean(cursor)}
          loadingMore={loadingMore}
          onLoadMore={() => {
            if (!cursor || loadingMore) return;
            void loadPage(kind, cursor, true);
          }}
          showHeader={false}
        />
      )}

      <p className="text-center text-xs text-muted-foreground">
        Open a card to edit duration or revisit sets. Also on{" "}
        <Link href="/progress" className="font-medium text-primary underline">
          Progress
        </Link>
        .
      </p>
    </div>
  );
}
