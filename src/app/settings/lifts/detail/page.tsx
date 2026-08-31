"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LiftDetailView } from "@/components/lift-detail-view";

function LiftDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Pick a lift from the list.
      </p>
    );
  }
  return <LiftDetailView exerciseId={id} />;
}

export default function LiftDetailPage() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading lift…
        </p>
      }
    >
      <LiftDetailInner />
    </Suspense>
  );
}
