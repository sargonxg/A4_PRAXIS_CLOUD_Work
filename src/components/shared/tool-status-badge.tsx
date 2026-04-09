'use client';

import React from 'react';
import type { ToolStatusInfo, ToolHealth, ResearchStatus } from '@/hooks/use-tool-status';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOT_COLORS: Record<ToolHealth, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
};

const HEALTH_LABELS: Record<ToolHealth, string> = {
  green: 'Ready',
  yellow: 'Stale — update recommended',
  red: 'Not ready',
};

const RESEARCH_LABELS: Record<ResearchStatus, string> = {
  idle: '',
  pending: 'Queued...',
  'fetching-sources': 'Gathering intelligence...',
  synthesizing: 'AI analyzing findings...',
  saving: 'Saving results...',
  complete: 'Complete',
  failed: 'Failed',
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// ToolStatusBadge — flexible badge for headers, cards, etc.
// ---------------------------------------------------------------------------

interface ToolStatusBadgeProps {
  status: ToolStatusInfo;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function ToolStatusBadge({
  status,
  showDetails = false,
  compact = false,
  className = '',
}: ToolStatusBadgeProps) {
  const dotClasses = [
    'inline-block h-2 w-2 rounded-full shrink-0',
    DOT_COLORS[status.health],
    status.isResearching ? 'animate-pulse' : '',
    status.isStale ? 'ring-1 ring-amber-300/60' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Compact mode: just the dot
  if (compact) {
    return (
      <span
        className={`${dotClasses} ${className}`}
        title={
          status.isResearching
            ? RESEARCH_LABELS[status.researchStatus]
            : HEALTH_LABELS[status.health]
        }
        role="status"
        aria-label={
          status.isResearching
            ? RESEARCH_LABELS[status.researchStatus]
            : HEALTH_LABELS[status.health]
        }
      />
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Primary row: dot + label */}
      <div className="flex items-center gap-1.5">
        <span className={dotClasses} role="status" aria-hidden="true" />
        <span className="text-xs text-navy-600">
          {status.isResearching
            ? RESEARCH_LABELS[status.researchStatus]
            : HEALTH_LABELS[status.health]}
        </span>

        {/* Research failed indicator */}
        {status.researchStatus === 'failed' && (
          <svg
            className="h-3.5 w-3.5 text-rose-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}

        {/* Research complete indicator */}
        {status.researchStatus === 'complete' && (
          <svg
            className="h-3.5 w-3.5 text-emerald-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Research progress bar */}
      {status.isResearching && (
        <div className="h-1 w-full rounded-full bg-navy-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
        </div>
      )}

      {/* Expanded details */}
      {showDetails && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {status.generatedAt && (
            <span className="text-[11px] text-navy-400">
              Last updated: {formatRelativeTime(status.generatedAt)}
            </span>
          )}

          {status.confidence !== null && (
            <span className="text-[11px] text-navy-400">
              Confidence: {status.confidence}%
            </span>
          )}

          {status.sourcesUsed.length > 0 && (
            <span className="text-[11px] text-navy-400">
              Sources: {status.sourcesUsed.length} used
            </span>
          )}

          {status.lastError && (
            <span className="text-[11px] text-rose-500 truncate max-w-[200px]" title={status.lastError}>
              Error: {status.lastError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolStatusInline — horizontal layout for tool page headers
// ---------------------------------------------------------------------------

interface ToolStatusInlineProps {
  status: ToolStatusInfo;
  onRefresh?: () => void;
  className?: string;
}

export function ToolStatusInline({
  status,
  onRefresh,
  className = '',
}: ToolStatusInlineProps) {
  const dotClasses = [
    'inline-block h-2 w-2 rounded-full shrink-0',
    DOT_COLORS[status.health],
    status.isResearching ? 'animate-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleRefresh = onRefresh ?? status.refreshTrigger;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Dot */}
      <span className={dotClasses} role="status" aria-hidden="true" />

      {/* Status text */}
      <span className="text-xs text-navy-600 whitespace-nowrap">
        {status.isResearching
          ? RESEARCH_LABELS[status.researchStatus]
          : HEALTH_LABELS[status.health]}
      </span>

      {/* Stale timestamp */}
      {status.isStale && status.generatedAt && (
        <span className="text-[11px] text-amber-600 whitespace-nowrap">
          Last updated: {formatRelativeTime(status.generatedAt)}
        </span>
      )}

      {/* Confidence badge */}
      {status.confidence !== null && !status.isResearching && (
        <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-medium text-navy-600 whitespace-nowrap">
          {status.confidence}% conf.
        </span>
      )}

      {/* Research progress bar */}
      {status.isResearching && (
        <div className="h-1 w-16 rounded-full bg-navy-100 overflow-hidden shrink-0">
          <div
            className="h-full rounded-full bg-emerald-500 animate-[progress_2s_ease-in-out_infinite]"
            style={{ width: '60%' }}
          />
        </div>
      )}

      {/* Refresh button */}
      {!status.isResearching && (
        <button
          type="button"
          onClick={handleRefresh}
          className="text-[11px] text-navy-400 hover:text-navy-700 transition-colors whitespace-nowrap"
          aria-label="Refresh tool status"
        >
          Refresh
        </button>
      )}
    </div>
  );
}
