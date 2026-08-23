"use client";

import { CardioRide } from "@/components/cardio-ride";
import type { LoggedSet } from "@/lib/types";

export function BikeRide({
  sets,
  lastLevel,
  lastMinutes,
  locked,
  onChange,
}: {
  sets: LoggedSet[];
  lastLevel?: number | null;
  lastMinutes?: number | null;
  locked?: boolean;
  onChange: (sets: LoggedSet[]) => void;
}) {
  return (
    <CardioRide
      kind="bike"
      sets={sets}
      lastLoad={lastLevel}
      lastMinutes={lastMinutes}
      locked={locked}
      onChange={onChange}
    />
  );
}
