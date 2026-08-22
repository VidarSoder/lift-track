"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LockGate } from "@/components/lock-gate";
import { TrainingProvider } from "@/components/training-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isUnlock = pathname.startsWith("/go/");

  return (
    <TrainingProvider>
      {isUnlock ? (
        children
      ) : (
        <LockGate>
          <AppShell>{children}</AppShell>
        </LockGate>
      )}
      <Toaster />
    </TrainingProvider>
  );
}
