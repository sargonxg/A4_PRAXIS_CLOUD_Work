"use client";

import { cn } from "@/lib/utils/cn";

interface ConfidenceIndicatorProps {
  score: number; // 0-1
  label?: boolean;
  className?: string;
}

export function ConfidenceIndicator({ score, label = true, className }: ConfidenceIndicatorProps) {
  const pct = Math.max(0, Math.min(1, score));
  const dots = 5;
  const filled = Math.round(pct * dots);

  const colorClass =
    pct >= 0.8
      ? "bg-green-500"
      : pct >= 0.5
      ? "bg-amber-500"
      : "bg-crimson";

  const textClass =
    pct >= 0.8
      ? "text-green-600"
      : pct >= 0.5
      ? "text-amber-600"
      : "text-crimson";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex gap-0.5">
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < filled ? colorClass : "bg-navy-300"
            )}
          />
        ))}
      </span>
      {label && (
        <span className={cn("text-[11px] font-medium", textClass)}>
          {Math.round(pct * 100)}%
        </span>
      )}
    </span>
  );
}
