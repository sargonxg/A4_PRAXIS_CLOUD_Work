'use client';

/**
 * <DegradedDataChip /> — small chip surfaced next to a tool's headline
 * when live feeds were unavailable and the output fell back to AI-only
 * reasoning.
 *
 * Tool reliability audit (`docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md`,
 * F-CCM-4) flagged that the feed-degraded state is invisible across
 * Risk Monitor, Humanitarian, Daily Brief, and Briefing Room. Threading
 * this primitive into those pages gives analysts a clear signal that
 * the figures behind the analysis came from the model alone — and
 * naming the missing feed gives them a direct path to fix it.
 */

import { Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DegradedDataChipProps {
  /** When true, the chip surfaces the degraded warning. False = healthy. */
  degraded: boolean;
  /** Names of feeds that returned no data (e.g. ["HDX HAPI", "ReliefWeb"]). */
  missingFeeds?: string[];
  /** Optional override message. */
  message?: string;
  /** Hide entirely when feeds are healthy. Default true. */
  hideWhenHealthy?: boolean;
  className?: string;
}

export function DegradedDataChip({
  degraded,
  missingFeeds,
  message,
  hideWhenHealthy = true,
  className,
}: DegradedDataChipProps) {
  if (!degraded && hideWhenHealthy) return null;

  if (!degraded) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700',
          className
        )}
        title="Live feeds responded; figures are evidence-backed."
      >
        <Cloud className="h-3 w-3" aria-hidden="true" />
        Live data
      </span>
    );
  }

  const tooltip = message
    ?? `Live feeds unavailable${missingFeeds && missingFeeds.length > 0 ? ` (${missingFeeds.join(', ')})` : ''}; analysis based on AI reasoning only. Treat figures as estimates and verify against primary sources.`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800',
        className
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      <CloudOff className="h-3 w-3" aria-hidden="true" />
      Live data unavailable
      {missingFeeds && missingFeeds.length > 0 && (
        <span className="font-normal text-amber-700/80">· {missingFeeds.slice(0, 3).join(', ')}</span>
      )}
    </span>
  );
}
