"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  formatBikeLine,
  latestBike,
  parseStat,
} from "@/lib/bike";
import type { BikeStats } from "@/lib/types";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function StatField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11"
      />
    </div>
  );
}

function asText(value: number | undefined) {
  return value == null ? "" : String(value);
}

export function BikeStatsCard({
  date,
  stats,
  minutesGuess,
  onSave,
}: {
  date: string;
  stats?: BikeStats;
  minutesGuess?: number;
  onSave: (stats: BikeStats) => void;
}) {
  const { athlete } = useTraining();
  const last = latestBike(athlete);
  const seed = stats ?? last;
  const [minutes, setMinutes] = useState(
    asText(stats?.minutes ?? minutesGuess ?? last?.minutes),
  );
  const [km, setKm] = useState(asText(seed?.km));
  const [kcal, setKcal] = useState(asText(seed?.kcal));
  const [level, setLevel] = useState(asText(seed?.level));
  const [rpm, setRpm] = useState(asText(seed?.rpm));

  function save() {
    const nextMinutes = parseStat(minutes);
    const next: BikeStats = {
      date,
      minutes: nextMinutes ?? minutesGuess ?? 0,
      km: parseStat(km) ?? undefined,
      kcal: parseStat(kcal) ?? undefined,
      level: parseStat(level) ?? undefined,
      rpm: parseStat(rpm) ?? undefined,
    };
    if (!next.minutes && next.km == null && next.kcal == null) {
      toast.message("Need at least minutes, km, or kcal from the bike screen.");
      return;
    }
    onSave(next);
    toast.success("Bike stats saved");
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div>
          <p className="text-base font-medium">What did the bike show?</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Most gym bikes flash time, km, kcal, and level. Some add RPM. Type
            what is there and skip the rest.
          </p>
        </div>
        {last && last.date !== date ? (
          <p className="text-xs text-muted-foreground">Last · {formatBikeLine(last)}</p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <StatField
            id="bike-min"
            label="Minutes"
            value={minutes}
            onChange={setMinutes}
            placeholder={minutesGuess ? String(minutesGuess) : "20"}
          />
          <StatField
            id="bike-km"
            label="Distance"
            value={km}
            onChange={setKm}
            placeholder="km"
          />
          <StatField
            id="bike-kcal"
            label="Calories"
            value={kcal}
            onChange={setKcal}
            placeholder="kcal"
          />
          <StatField
            id="bike-level"
            label="Level"
            value={level}
            onChange={setLevel}
            placeholder="resistance"
          />
          <StatField
            id="bike-rpm"
            label="RPM"
            value={rpm}
            onChange={setRpm}
            placeholder="if it showed it"
          />
        </div>
        <Button className="h-11 w-full" onClick={save}>
          Save bike stats
        </Button>
      </CardContent>
    </Card>
  );
}
