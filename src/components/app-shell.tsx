"use client";

import { Suspense, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, Images, Settings, TrendingUp } from "lucide-react";
import { ActiveSessionFab } from "@/components/active-session-fab";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useTraining } from "@/components/training-provider";
import { useViewportShell } from "@/lib/viewport-shell";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/week", label: "Form", icon: Images },
  { href: "/workout", label: "Lift", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reload } = useTraining();
  const shell = useRef<HTMLDivElement>(null);
  useViewportShell(shell);

  return (
    <div
      ref={shell}
      className="fixed inset-0 mx-auto flex w-full max-w-md flex-col overflow-hidden bg-background"
    >
      <PullToRefresh
        onRefresh={reload}
        className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5"
      >
        {children}
      </PullToRefresh>
      <Suspense fallback={null}>
        <ActiveSessionFab />
      </Suspense>
      <nav className="shrink-0 border-t border-border/80 bg-background px-2 pt-2 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        <ul className="grid grid-cols-5 gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium tracking-wide",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
