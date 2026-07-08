'use client';

import { useState, type ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, GripVertical } from 'lucide-react';
import { CapsuleMiniGraph } from '@/components/capsules/CapsuleMiniGraph';
import { CapsuleReadinessBadge } from '@/components/capsules/CapsuleReadinessBadge';
import { cn } from '@/lib/utils/cn';

export type CapsuleLibraryCardVariant = 'compact' | 'full';

export interface CapsuleLibraryCardBadge {
  label: string;
  className?: string;
  testId?: string;
}

export interface CapsuleLibraryCardCounts {
  sources?: number | null;
  documents?: number | null;
  claims?: number | null;
  tools?: number | null;
  outputs?: number | null;
  graphNodes?: number | null;
  graphEdges?: number | null;
  unsupportedClaims?: number | null;
}

export interface CapsuleLibraryCardGraph {
  nodeCount?: number | null;
  edgeCount?: number | null;
  entityTypeCounts?: Record<string, number> | null;
}

export interface CapsuleLibraryCardResearchSignals {
  sourceSpineCount?: number | null;
  evidenceGapCount?: number | null;
  refreshStatus?: string | null;
  graphNodeCount?: number | null;
  graphEdgeCount?: number | null;
  unsupportedClaimCount?: number | null;
  inspectHref?: string | null;
}

export interface CapsuleLibraryCardMetric {
  label: string;
  value: string | number | null | undefined;
}

export interface CapsuleLibraryCardAddAction {
  onAdd: (role?: string) => void;
  label?: string;
  roleOptions?: Array<{ label: string; value: string }>;
  disabled?: boolean;
}

export interface CapsuleLibraryCardDragAction {
  id: string;
  title: string;
}

export interface CapsuleLibraryCardProps {
  variant: CapsuleLibraryCardVariant;
  capsuleId: string;
  title: string;
  summary?: string | null;
  color?: string | null;
  capsuleType?: string | null;
  categoryLabel?: string | null;
  domainLabel?: string | null;
  roleLabel?: string | null;
  policyTeamLabel?: string | null;
  subtitle?: string | null;
  icon?: ReactNode;
  readiness?: {
    tier: 'ready' | 'near' | 'blocked';
    score?: number | null;
    topBlocker?: string | null;
  } | null;
  qualityScore?: number | null;
  counts?: CapsuleLibraryCardCounts | null;
  graph?: CapsuleLibraryCardGraph | null;
  researchSignals?: CapsuleLibraryCardResearchSignals | null;
  tags?: CapsuleLibraryCardBadge[];
  badges?: CapsuleLibraryCardBadge[];
  badgeRail?: ReactNode;
  metadata?: Array<string | null | undefined>;
  signalBadges?: Array<string | null | undefined>;
  scoreboardItems?: CapsuleLibraryCardMetric[];
  bestNextAction?: string | null;
  searchMatchReason?: string | null;
  updatedLabel?: string | null;
  ratingControl?: ReactNode;
  footerActions?: ReactNode;
  addAction?: CapsuleLibraryCardAddAction;
  dragAction?: CapsuleLibraryCardDragAction;
  active?: boolean;
  busy?: boolean;
  openLabel?: string;
  openTestId?: string;
  rootTestId?: string;
  onSelect?: () => void;
}

export function CapsuleLibraryCard({
  variant,
  capsuleId,
  title,
  summary,
  color = '#0f172a',
  capsuleType,
  categoryLabel,
  domainLabel,
  roleLabel,
  policyTeamLabel,
  subtitle,
  icon,
  readiness,
  qualityScore,
  counts,
  graph,
  researchSignals,
  tags = [],
  badges = [],
  badgeRail,
  metadata = [],
  signalBadges = [],
  scoreboardItems,
  bestNextAction,
  searchMatchReason,
  updatedLabel,
  ratingControl,
  footerActions,
  addAction,
  dragAction,
  active = false,
  busy = false,
  openLabel = 'Open capsule',
  openTestId,
  rootTestId,
  onSelect,
}: CapsuleLibraryCardProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
  } = useDraggable({
    id: dragAction?.id ?? `capsule-card-static:${capsuleId}`,
    disabled: !dragAction,
  });
  const safeColor = color || '#0f172a';
  const isCompact = variant === 'compact';
  const sourceCount = safeCount(counts?.sources) + safeCount(counts?.documents);
  const claimCount = safeCount(counts?.claims);
  const graphNodes = safeCount(graph?.nodeCount ?? counts?.graphNodes);
  const graphEdges = safeCount(graph?.edgeCount ?? counts?.graphEdges);
  const unsupportedClaims = safeCount(researchSignals?.unsupportedClaimCount ?? counts?.unsupportedClaims);
  const researchSourceSpineCount = safeCount(researchSignals?.sourceSpineCount);
  const researchEvidenceGapCount = safeCount(researchSignals?.evidenceGapCount);
  const researchGraphNodes = safeCount(researchSignals?.graphNodeCount ?? graphNodes);
  const researchGraphEdges = safeCount(researchSignals?.graphEdgeCount ?? graphEdges);
  const qualityLabel = typeof qualityScore === 'number' && Number.isFinite(qualityScore)
    ? `quality ${Math.round(qualityScore)}/100`
    : null;
  const visibleMetadata = [
    policyTeamLabel,
    qualityLabel,
    sourceCount ? `${sourceCount} source ref${sourceCount === 1 ? '' : 's'}` : null,
    unsupportedClaims ? `${unsupportedClaims} unsupported` : '0 unsupported',
    ...metadata,
  ].filter(Boolean) as string[];
  const visibleScoreboard = scoreboardItems?.length
    ? scoreboardItems
    : [
        { label: 'Sources', value: sourceCount },
        { label: 'Claims', value: claimCount },
        { label: 'Graph', value: `${graphNodes}/${graphEdges}` },
        { label: 'Quality', value: typeof qualityScore === 'number' ? Math.round(qualityScore) : null },
      ];
  const addRoleOptions = addAction?.roleOptions ?? [];

  return (
    <article
      ref={setNodeRef}
      data-testid={rootTestId ?? `capsule-card-${capsuleId}`}
      data-capsule-type={capsuleType ?? undefined}
      className={cn(
        isCompact
          ? 'praxis-card-panel specimen-card od-praxis-card flex h-full w-full flex-col overflow-hidden rounded-lg p-0 transition hover:-translate-y-0.5'
          : 'flex h-full min-h-[18rem] w-full flex-col overflow-hidden rounded-lg border bg-white p-0 text-left transition hover:-translate-y-0.5 hover:shadow-md',
        isCompact ? 'min-h-[15rem]' : 'shadow-sm',
        active ? 'border-sky-300 shadow-sky-100' : isCompact ? 'border-black/10' : 'border-slate-200',
        busy && 'opacity-75',
        isDragging && 'opacity-70',
      )}
      style={{
        borderTopColor: safeColor,
        borderTopWidth: 4,
        boxShadow: active && isCompact ? `0 16px 34px ${softColor(safeColor, 0.22)}` : undefined,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!onSelect}
        data-testid={openTestId}
        aria-label={onSelect ? `${openLabel} ${title}` : undefined}
        className={cn('block w-full flex-1 p-4 text-left', onSelect ? 'cursor-pointer' : 'cursor-default')}
        style={isCompact ? { background: `linear-gradient(180deg, ${softColor(safeColor, 0.12)}, rgba(255,255,255,0) 46%)` } : undefined}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-start gap-2">
            {icon ? (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
                {icon}
              </span>
            ) : null}
            <span className="min-w-0">
              {subtitle ? (
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{subtitle}</span>
              ) : null}
              <span className="block text-base font-semibold leading-6 text-slate-950">{title}</span>
              <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Categories</span>
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {badges.map((badge) => <CardBadge key={`${badge.label}-${badge.testId ?? ''}`} badge={badge} />)}
            {roleLabel ? <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">{roleLabel}</span> : null}
            {readiness ? <CapsuleReadinessBadge size="sm" {...readiness} /> : null}
          </span>
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`${title} categories`}>
          {categoryLabel ? <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{categoryLabel}</span> : null}
          {domainLabel ? <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{domainLabel}</span> : null}
          {tags.map((tag) => <CardBadge key={`${tag.label}-${tag.testId ?? ''}`} badge={tag} />)}
        </span>

        {badgeRail}

        {visibleMetadata.length ? (
          <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
            {visibleMetadata.map((item) => (
              <span key={item} className={unsupportedClaims && item.includes('unsupported') ? 'text-amber-700' : undefined}>{item}</span>
            ))}
          </span>
        ) : null}

        {signalBadges.filter(Boolean).length ? (
          <span className={cn('mt-2 grid gap-1.5 text-[11px] font-semibold text-slate-600', isCompact ? 'grid-cols-3' : 'grid-cols-2')}>
            {signalBadges.filter(Boolean).map((item) => (
              <span key={item} className="rounded-md bg-white px-2 py-1">{item}</span>
            ))}
          </span>
        ) : null}

        {updatedLabel ? (
          <span className="mt-2 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-800">
            {updatedLabel}
          </span>
        ) : null}

        {researchSignals ? (
          <span
            className="mt-2 grid gap-1.5 rounded-md border border-emerald-100 bg-emerald-50/70 p-2 text-[11px] font-semibold text-emerald-900 sm:grid-cols-2"
            data-testid="capsule-research-signals"
            aria-label={`${title} research signals`}
          >
            <span>{researchSourceSpineCount} source spine</span>
            <span>{researchEvidenceGapCount} evidence gap{researchEvidenceGapCount === 1 ? '' : 's'}</span>
            <span>refresh {researchSignals.refreshStatus || 'unknown'}</span>
            <span>graph {researchGraphNodes}/{researchGraphEdges}</span>
            <span className={unsupportedClaims ? 'text-amber-800' : 'text-emerald-800'}>{unsupportedClaims} unsupported</span>
            {researchSignals.inspectHref ? (
              <span className="sr-only">Inspect {researchSignals.inspectHref}</span>
            ) : null}
          </span>
        ) : null}

        {!isCompact ? (
          <CapsuleMiniGraph
            className="mt-3"
            seed={capsuleId}
            color={safeColor}
            nodeCount={graphNodes}
            edgeCount={graphEdges}
            entityTypeCounts={graph?.entityTypeCounts ?? undefined}
          />
        ) : null}

        <span className={cn('mt-3 block text-sm leading-6 text-slate-600', isCompact ? 'line-clamp-2' : 'line-clamp-3')}>
          {summary || 'No capsule summary available yet.'}
        </span>

        {bestNextAction ? (
          <span className="mt-2 block line-clamp-1 rounded-md bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700">
            Best next action: {bestNextAction}
            <span className="sr-only">Next: {bestNextAction}</span>
          </span>
        ) : null}

        {searchMatchReason ? (
          <span className="mt-2 block rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
            {searchMatchReason}
          </span>
        ) : null}

        {!isCompact ? (
          <span className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-600" data-testid="capsule-repository-v2-scoreboard">
            {visibleScoreboard.map((item) => (
              <span key={item.label} className="rounded-md bg-slate-50 px-2 py-1">
                {item.label} {item.value ?? '—'}
              </span>
            ))}
          </span>
        ) : null}
      </button>

      {(ratingControl || addAction || dragAction || footerActions) ? (
        <div className="mt-auto px-4 pb-4">
          {ratingControl}
          {isCompact ? <ReadinessBars counts={counts} color={safeColor} title={title} /> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {addAction ? (
              <span className="relative inline-flex" data-testid="capsule-card-add-split">
                <button
                  type="button"
                  onClick={() => addAction.onAdd()}
                  disabled={addAction.disabled}
                  className={cn(
                    'bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60',
                    addRoleOptions.length ? 'rounded-l-md' : 'rounded-md',
                  )}
                >
                  {addAction.label ?? 'Add'}
                </button>
                {addRoleOptions.length ? (
                  <button
                    type="button"
                    aria-label={`Choose context bucket for ${title}`}
                    aria-expanded={roleMenuOpen}
                    onClick={() => setRoleMenuOpen((open) => !open)}
                    disabled={addAction.disabled}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-r-md border-l border-emerald-500 bg-emerald-700 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', roleMenuOpen && 'rotate-180')} />
                  </button>
                ) : null}
                {roleMenuOpen && addRoleOptions.length ? (
                  <span
                    role="menu"
                    className="absolute bottom-full left-0 z-20 mb-1 grid min-w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-700 shadow-lg"
                  >
                    {addRoleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          addAction.onAdd(option.value);
                          setRoleMenuOpen(false);
                        }}
                        className="rounded px-2 py-1.5 text-left hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {option.label}
                      </button>
                    ))}
                  </span>
                ) : null}
              </span>
            ) : null}
            {dragAction ? (
              <button
                type="button"
                title={dragAction.title}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                aria-label={dragAction.title}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {footerActions}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function CardBadge({ badge }: { badge: CapsuleLibraryCardBadge }) {
  return (
    <span
      data-testid={badge.testId}
      className={cn('rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600', badge.className)}
    >
      {badge.label}
    </span>
  );
}

function ReadinessBars({ counts, color, title }: { counts?: CapsuleLibraryCardCounts | null; color: string; title: string }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" aria-label={`${title} readiness signals`}>
      {[
        { label: 'Docs', active: safeCount(counts?.documents) > 0 },
        { label: 'Sources', active: safeCount(counts?.sources) > 0 },
        { label: 'Tools', active: safeCount(counts?.tools) > 0 },
        { label: 'Outputs', active: safeCount(counts?.outputs) > 0 },
      ].map((item) => (
        <span key={item.label} title={item.label} className="h-1.5 rounded-full bg-slate-100">
          <span className="block h-1.5 rounded-full" style={{ backgroundColor: item.active ? color : '#e2e8f0' }} />
        </span>
      ))}
    </div>
  );
}

function safeCount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function softColor(hex: string, alpha = 0.08): string {
  const clean = hex.replace('#', '');
  if (!/^[\da-f]{6}$/i.test(clean)) return `rgba(15, 23, 42, ${alpha})`;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
