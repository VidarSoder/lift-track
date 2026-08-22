"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, Images, Settings, TrendingUp } from "lucide-react";
import { ActiveSessionFab } from "@/components/active-session-fab";
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

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-6 pb-5">
        {children}
      </main>
      <Suspense fallback={null}>
        <ActiveSessionFab />
      </Suspense>
      <nav className="shrink-0 border-t border-border/80 bg-background px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
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
