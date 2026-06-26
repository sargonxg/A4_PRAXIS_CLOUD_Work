'use client';

import { ArrowUp, ClipboardList, FileText, RefreshCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

type CapabilityLauncherProps = {
  contextMode: 'instant' | 'capsule';
  activeCapsuleLabel: string | null;
  sourceCount: number;
  reviewQueueCount: number;
  createdWorkCount: number;
  onAskInstant: () => void;
  onSaveInstantContext: () => void;
  onImproveCapsule: () => void;
  onCreateWorkProduct: () => void;
  onCreateWatchlist: () => void;
  onOpenReviewQueue: () => void;
  className?: string;
};

export function PraxisCapabilityLauncher({
  contextMode,
  activeCapsuleLabel,
  sourceCount,
  reviewQueueCount,
  createdWorkCount,
  onAskInstant,
  onSaveInstantContext,
  onImproveCapsule,
  onCreateWorkProduct,
  onCreateWatchlist,
  onOpenReviewQueue,
  className,
}: CapabilityLauncherProps) {
  const instant = contextMode === 'instant';
  const cards = [
    {
      id: 'instant-context',
      icon: Sparkles,
      title: instant ? 'Instant context' : 'Ask active capsule',
      metric: instant ? 'not saved' : activeCapsuleLabel ?? 'capsule ready',
      detail: instant ? 'Ask works before setup, then save the useful context.' : 'Use the selected capsule with receipts and gates.',
      actionLabel: instant ? 'Ask now' : 'Ask capsule',
      onAction: onAskInstant,
      secondaryLabel: 'Save as capsule',
      onSecondary: onSaveInstantContext,
      emphasized: instant,
    },
    {
      id: 'improve-capsule',
      icon: ShieldCheck,
      title: 'Improve capsule',
      metric: `${sourceCount} source${sourceCount === 1 ? '' : 's'}`,
      detail: 'Add sources, improve claims, or build graph proposals.',
      actionLabel: 'Improve',
      onAction: onImproveCapsule,
    },
    {
      id: 'work-product',
      icon: FileText,
      title: 'Work product',
      metric: `${createdWorkCount} saved`,
      detail: 'Create a memo, briefing, actor map, or handover pack.',
      actionLabel: 'Create',
      onAction: onCreateWorkProduct,
    },
    {
      id: 'source-watchlist',
      icon: RefreshCcw,
      title: 'Source intelligence',
      metric: sourceCount ? 'watch ready' : 'needs sources',
      detail: 'Track what changed, what is stale, and what needs review.',
      actionLabel: 'Watch',
      onAction: onCreateWatchlist,
    },
    {
      id: 'review-queue',
      icon: ClipboardList,
      title: 'Review queue',
      metric: `${reviewQueueCount} open`,
      detail: 'Approve or reject source, graph, ontology, and memory proposals.',
      actionLabel: 'Review',
      onAction: onOpenReviewQueue,
    },
  ];

  return (
    <section
      className={cn('w-full max-w-5xl', className)}
      data-testid="praxis-capability-launcher"
      aria-label="PRAXIS capability launcher"
    >
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(12rem,100%),1fr))]">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className={cn(
                'flex min-h-40 flex-col justify-between rounded-md border bg-white p-3 shadow-sm',
                card.emphasized ? 'border-[color:var(--color-clay)] bg-[color:var(--color-archive-paper-strong)]' : 'border-slate-200',
              )}
              data-testid={`praxis-capability-${card.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="max-w-28 truncate rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {card.metric}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-950">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{card.detail}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={card.onAction}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  {card.actionLabel}
                </button>
                {card.secondaryLabel ? (
                  <button
                    type="button"
                    onClick={card.onSecondary}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {card.secondaryLabel}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
