"use client";

import { PraxisGlyphChip } from "@/components/brand/praxis-mark";
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
      <PraxisGlyphChip
        size={compact ? 34 : 42}
        rotateOnHover={false}
        className={cn(
          "shrink-0 rounded-xl border-slate-200 bg-white shadow-sm shadow-slate-200/70",
          compact && "rounded-lg",
        )}
      />
      <span className="min-w-0">
        <span className={cn("block truncate font-semibold text-slate-950", compact ? "text-sm" : "text-sm")}>
          PRAXIS
        </span>
        <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          {subtitle}
        </span>
      </span>
    </span>
  );
}
