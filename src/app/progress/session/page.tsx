"use client";

import { Suspense } from "react";
import { SessionDetailView } from "@/components/session-detail-view";

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading session…
        </p>
      }
    >
      <SessionDetailView />
    </Suspense>
  );
}
