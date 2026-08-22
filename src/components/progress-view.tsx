"use client";

import Link from "next/link";
import { DAYS } from "@/data/program";
import { latestWeight, weightDelta } from "@/lib/weight";
import { useTraining } from "@/components/training-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Bar({ value, max }: { value: number; max: number }) {
  const width = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div className="h-full bg-primary" style={{ width: `${width}%` }} />
    </div>
  );
}

export function ProgressView() {
  const { athlete } = useTraining();
  const body = latestWeight(athlete);
  const delta = weightDelta(athlete);
  const maxVolume = Math.max(1, ...athlete.recent.map((item) => item.volume));
  const namedPrs = Object.entries(athlete.prs)
    .map(([id, pr]) => {
      const exercise = DAYS.flatMap((day) => day.exercises).find((item) => item.id === id);
      return exercise ? { name: exercise.name, ...pr } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.weight ?? 0) - (a?.weight ?? 0))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Tracking
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-none">Progress</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {athlete.sessionsCompleted} sessions saved · streak {athlete.streak} day
          {athlete.streak === 1 ? "" : "s"}. Summaries live on one athlete
          document so the app does not scan old workouts.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Sessions</p>
            <p className="text-2xl font-semibold">{athlete.sessionsCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Streak</p>
            <p className="text-2xl font-semibold">{athlete.streak}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">PRs</p>
            <p className="text-2xl font-semibold">{Object.keys(athlete.prs).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-5">
          <p className="text-xs text-muted-foreground">Body weight</p>
          <p className="text-2xl font-semibold">
            {body ? `${body.kg.toFixed(1)} kg` : "Not logged"}
          </p>
          {delta ? (
            <p className="text-sm text-muted-foreground">
              {delta.kg > 0 ? "+" : ""}
              {delta.kg} kg since the first weigh-in
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add weigh-ins in Settings to see the trend.
            </p>
          )}
          <Link
            href="/settings"
            className={buttonVariants({
              variant: "secondary",
              className: "w-full",
            })}
          >
            Open settings
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent volume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {athlete.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Finish a session and the bar chart shows up here. No extra Firestore
              reads.
            </p>
          ) : (
            athlete.recent.map((item) => (
              <div key={item.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {item.date} · {item.title.split("·")[0]}
                  </span>
                  <span className="text-muted-foreground">
                    {item.volume} kg · {item.completedSets}/{item.plannedSets}
                  </span>
                </div>
                <Bar value={item.volume} max={maxVolume} />
                {item.mood ? (
                  <p className="text-[11px] text-muted-foreground">
                    Mood {item.mood}/5
                    {item.pump ? ` · pump ${item.pump}/5` : ""} · {item.durationMin} min
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Heaviest logged</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {namedPrs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              PRs appear after you log completed sets.
            </p>
          ) : (
            namedPrs.map((pr) =>
              pr ? (
                <div key={pr.name} className="flex items-center justify-between text-sm">
                  <span>{pr.name}</span>
                  <span className="font-medium">
                    {pr.weight} kg × {pr.reps}
                  </span>
                </div>
              ) : null,
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Phone bookmark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Safari / Chrome: share this site → Add to Home Screen. After the
            first unlock, an httpOnly cookie keeps you in. The passphrase never
            ships in the JavaScript bundle.
          </p>
          <p>
            Sync goes through the server. Firestore itself denies every client
            read and write. Only today&apos;s session can be saved.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
