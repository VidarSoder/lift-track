"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { passphraseMatches } from "@/lib/auth";
import { useTraining } from "@/components/training-provider";
import { buttonVariants } from "@/components/ui/button";

export default function UnlockPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const value = decodeURIComponent(key);
  const valid = passphraseMatches(value);
  const { unlock, unlocked } = useTraining();
  const router = useRouter();

  useEffect(() => {
    if (!valid) return;
    void unlock(value).then(() => router.replace("/"));
  }, [valid, value, router, unlock]);

  if (unlocked) return null;

  if (!valid) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-destructive">
          This link does not match the training passphrase.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-4" })}>
          Try the passphrase screen
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Unlocking…</p>
    </div>
  );
}
