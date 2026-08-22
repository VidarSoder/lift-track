"use client";

import { Suspense } from "react";
import { WorkoutSessionView } from "@/components/workout-session";

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading workout…</p>
      }
    >
      <WorkoutSessionView />
    </Suspense>
  );
}
