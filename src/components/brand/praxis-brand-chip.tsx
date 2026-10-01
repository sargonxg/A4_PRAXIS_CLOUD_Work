"use client";

import { PraxisMark } from "@/components/brand/praxis-mark";
import { cn } from "@/lib/utils/cn";

export function PraxisBrandChip({
  subtitle = "by TACITUS",
  compact = false,
  className,
}: {
  subtitle?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("group inline-flex min-w-0 items-center gap-3", className)}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-mineral)] bg-[var(--color-archive-paper)]"
        style={{ width: compact ? 34 : 42, height: compact ? 34 : 42 }}
        aria-hidden
      >
        <PraxisMark size={compact ? 20 : 25} className="text-[var(--color-praxis-emerald-700)]" />
      </span>
      <span className="min-w-0">
        <span className={cn("block truncate font-serif font-semibold text-[var(--color-deep-ink)]", compact ? "text-lg" : "text-xl")}>
          PRAXIS
        </span>
        <span className="block truncate text-xs text-[var(--color-graphite)]">
          {subtitle}
        </span>
      </span>
    </span>
  );
}
