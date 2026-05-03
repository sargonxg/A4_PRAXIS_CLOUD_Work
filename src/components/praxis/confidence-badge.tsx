'use client';

/**
 * <ConfidenceBadge /> — shared analyst confidence badge.
 *
 * Cross-tool findings in `docs/tools/UX_AUDIT_2026-04-26.md` flagged that
 * every tool renders confidence differently — some never render it at all.
 * This is the canonical primitive every PRAXIS tool should use so the user
 * sees a consistent signal across Risk Monitor, Briefing Room, Humanitarian,
 * Legal Tracker, Brainstorming Table, etc.
 *
 * Confidence vocabulary follows ICD 203 / Heuer:
 *   high   — well-corroborated, recent, multiple-source evidence.
 *   medium — partial corroboration or single recent source.
 *   low    — single uncorroborated source or older than the freshness window.
 *   unknown — confidence was not asserted; analyst should treat as low.
 */

import { ShieldCheck, ShieldQuestion, ShieldAlert, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type Confidence = 'high' | 'medium' | 'low' | 'unknown';

export interface ConfidenceBadgeProps {
  confidence: Confidence | string | number;
  /** Show a leading "Confidence:" label. Default false (compact). */
  withLabel?: boolean;
  /** Visual size. Default "sm". */
  size?: 'sm' | 'md';
  /** Tooltip / aria-label. Default derived from confidence value. */
  title?: string;
  className?: string;
}

const STYLE: Record<Confidence, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-rose-50 text-rose-700 border-rose-200',
  unknown: 'bg-slate-50 text-slate-600 border-slate-200',
};

const ICON: Record<Confidence, typeof ShieldCheck> = {
  high: ShieldCheck,
  medium: Shield,
  low: ShieldAlert,
  unknown: ShieldQuestion,
};

const DEFAULT_TITLE: Record<Confidence, string> = {
  high: 'High confidence — well-corroborated, multi-source evidence.',
  medium: 'Medium confidence — partial corroboration or single recent source.',
  low: 'Low confidence — single uncorroborated or stale source.',
  unknown: 'Confidence not asserted by the tool; treat as low.',
};

export function normalizeConfidence(value: string | number | undefined | null): Confidence {
  if (typeof value === 'number') {
    if (value >= 0.75) return 'high';
    if (value >= 0.45) return 'medium';
    return 'low';
  }
  const v = (value ?? '').toLowerCase().trim();
  if (!v) return 'unknown';
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  if (v === 'extracted') return 'high';
  if (v === 'inferred' || v === 'assessed') return 'medium';
  if (v === 'ambiguous') return 'low';
  const numeric = Number(v);
  if (Number.isFinite(numeric)) return normalizeConfidence(numeric);
  return 'unknown';
}

export function ConfidenceBadge({
  confidence,
  withLabel = false,
  size = 'sm',
  title,
  className,
}: ConfidenceBadgeProps) {
  const c = normalizeConfidence(confidence);
  const Icon = ICON[c];
  const numericLabel = typeof confidence === 'number' ? ` (${Math.round(confidence * 100)}%)` : '';
  const aria = title ?? `${DEFAULT_TITLE[c]}${numericLabel}`;

  return (
    <span
      title={aria}
      aria-label={aria}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        STYLE[c],
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden="true" />
      {withLabel ? <span className="text-slate-500">Confidence:</span> : null}
      <span className="capitalize">{c}{numericLabel}</span>
    </span>
  );
}
