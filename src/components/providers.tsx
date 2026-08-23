"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LockGate } from "@/components/lock-gate";
import { TrainingProvider } from "@/components/training-provider";
import { Toaster } from "@/components/ui/sonner";
import { useAppFrame } from "@/lib/app-frame";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isUnlock = pathname.startsWith("/go/");
  useAppFrame();

  return (
    <TrainingProvider>
      {isUnlock ? (
        children
      ) : (
        <AppShell>
          <LockGate>{children}</LockGate>
        </AppShell>
      )}
      <Toaster />
    </TrainingProvider>
  );
}
