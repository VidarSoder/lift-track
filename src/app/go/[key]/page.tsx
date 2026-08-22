"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTraining } from "@/components/training-provider";
import { buttonVariants } from "@/components/ui/button";

export default function UnlockPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const value = decodeURIComponent(key);
  const { unlock, unlocked } = useTraining();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void unlock(value).then((ok) => {
      if (cancelled) return;
      if (ok) {
        router.replace("/");
        return;
      }
      setError("This link does not match the training passphrase.");
    });
    return () => {
      cancelled = true;
    };
  }, [value, router, unlock]);

  if (unlocked) return null;

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
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
