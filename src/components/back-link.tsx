import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackLink({
  href,
  label = "Back",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      <ChevronLeft className="size-4" />
      {label}
    </Link>
  );
}
