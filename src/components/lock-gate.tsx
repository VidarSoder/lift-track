"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKMARK_HINT, PROGRAM_NAME } from "@/data/program";
import { passphraseMatches, unlockHref } from "@/lib/auth";
import { useTraining } from "@/components/training-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LockGate({ children }: { children: React.ReactNode }) {
  const { ready, unlocked, unlock } = useTraining();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading the week…
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!passphraseMatches(value)) {
      setError("That passphrase does not match.");
      return;
    }
    await unlock(value);
    router.replace("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
        Vidar · training
      </p>
      <h1 className="mt-3 font-heading text-4xl leading-none tracking-tight">
        {PROGRAM_NAME}
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        One passphrase, then bookmark the page on your phone. No account, no
        login wall after that.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pass">Passphrase</Label>
          <Input
            id="pass"
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            className="h-12 text-base"
            placeholder="The word from your link"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="h-12 w-full text-base">
          Open training
        </Button>
      </form>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        {BOOKMARK_HINT} Bookmark{" "}
        <span className="text-foreground">{unlockHref()}</span> if you want the
        link to unlock itself.
      </p>
    </div>
  );
}
