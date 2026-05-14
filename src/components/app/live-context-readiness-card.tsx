'use client';

/**
 * LiveContextReadinessCard — pinned top-right indicator on
 * /app/contexts, /app/write, and /app/assistant. Seven dots
 * (User · Situation · Path · Sources · Graph · Time · Output) with
 * green/amber/red status. Clicking the card opens a drawer with
 * per-core completeness, source-gap chips, and one-click fix CTAs.
 *
 * Self-contained: reads from the situation store + analyst profile
 * already loaded into the AuthProvider. Future versions can layer in
 * `/api/context/capsule/active` + GraphOps readiness.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { useSituationStore } from '@/stores/situation-store';

type DotStatus = 'ready' | 'partial' | 'missing';

interface ReadinessDot {
  id: 'user' | 'situation' | 'path' | 'sources' | 'graph' | 'time' | 'output';
  label: string;
  status: DotStatus;
  detail: string;
  fixHref: string;
  fixLabel: string;
}

const DOT_COLOR: Record<DotStatus, string> = {
  ready: 'bg-emerald-500 ring-emerald-200',
  partial: 'bg-amber-500 ring-amber-200',
  missing: 'bg-red-500 ring-red-200',
};

const STATUS_LABEL: Record<DotStatus, string> = {
  ready: 'ready',
  partial: 'partial',
  missing: 'missing',
};

export function LiveContextReadinessCard() {
  const { analystProfile } = useAuth();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [open, setOpen] = useState(false);

  const dots = useMemo<ReadinessDot[]>(() => {
    const sitHref = activeSituation ? `/app/workbench/${activeSituation.id}` : '/app/contexts';
    const sourceCount =
      (activeSituation?.sourceUrls?.length ?? 0) +
      (activeSituation?.customSources?.length ?? 0) +
      (activeSituation?.documentCount ?? 0);
    const actorCount = activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0;
    const hasTimeline = Boolean(
      (activeSituation?.keyDates?.length ?? 0) > 0 || activeSituation?.latestEventDate,
    );
    const hasDraft = Boolean(activeSituation?.lastAiRefresh);
    const path = activeSituation?.pathId ?? activeSituation?.workflowPath ?? null;
    const pathLabel = activeSituation?.workflowPathLabel ?? path ?? '';
    const graphEntities = activeSituation?.graphEntities ?? 0;
    const graphReady = graphEntities >= 6 || actorCount >= 3;

    return [
      {
        id: 'user',
        label: 'User',
        status: analystProfile?.meta?.completedAt ? 'ready' : 'missing',
        detail: analystProfile?.meta?.completedAt
          ? `Profile v${analystProfile.meta.version ?? 1}`
          : 'Run onboarding so AI knows your role and voice.',
        fixHref: '/app/cores/user',
        fixLabel: 'Open User Core',
      },
      {
        id: 'situation',
        label: 'Situation',
        status: activeSituation ? 'ready' : 'missing',
        detail: activeSituation
          ? activeSituation.name
          : 'No situation attached. Pick or create a case frame.',
        fixHref: '/app/contexts',
        fixLabel: 'Pick situation',
      },
      {
        id: 'path',
        label: 'Path',
        status: path ? 'ready' : 'partial',
        detail: path
          ? `Operator path: ${pathLabel || path}`
          : 'Path not chosen — defaults to generic.',
        fixHref: '/app/contexts',
        fixLabel: 'Pick path',
      },
      {
        id: 'sources',
        label: 'Sources',
        status: sourceCount >= 4 ? 'ready' : sourceCount > 0 ? 'partial' : 'missing',
        detail:
          sourceCount > 0
            ? `${sourceCount} evidence items attached.`
            : 'Attach receipts before drafting.',
        fixHref: sitHref,
        fixLabel: 'Attach sources',
      },
      {
        id: 'graph',
        label: 'Graph',
        status: graphReady ? 'ready' : actorCount > 0 ? 'partial' : 'missing',
        detail:
          actorCount > 0
            ? `${actorCount} actors mapped.`
            : 'Map who can move, block, or absorb.',
        fixHref: '/app/canvas',
        fixLabel: 'Open Canvas',
      },
      {
        id: 'time',
        label: 'Time',
        status: hasTimeline ? 'ready' : 'partial',
        detail: hasTimeline
          ? 'Temporal context attached.'
          : 'Add dates, phases, freshness caveats.',
        fixHref: sitHref,
        fixLabel: 'Add timeline',
      },
      {
        id: 'output',
        label: 'Output',
        status: hasDraft ? 'ready' : 'partial',
        detail: hasDraft ? 'A working draft exists.' : 'Create a memo, brief, or handover target.',
        fixHref: '/app/write',
        fixLabel: 'Open MemoDesk',
      },
    ];
  }, [analystProfile, activeSituation]);

  const score = useMemo(() => {
    const points = dots.reduce(
      (acc, d) => acc + (d.status === 'ready' ? 100 / 7 : d.status === 'partial' ? 50 / 7 : 0),
      0,
    );
    return Math.round(points);
  }, [dots]);

  const band: DotStatus = score >= 75 ? 'ready' : score >= 45 ? 'partial' : 'missing';

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        className="fixed right-4 top-20 z-40 hidden flex-col gap-2 rounded-xl border border-slate-300 bg-white/95 px-3 py-2 text-left shadow-lg shadow-navy-950/10 backdrop-blur transition hover:border-diplomatic-blue/40 hover:shadow-xl md:flex"
        aria-label="Open context readiness drawer"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Context
          </span>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
              band === 'ready'
                ? 'bg-emerald-100 text-emerald-800'
                : band === 'partial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800',
            )}
          >
            {score}
          </span>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {dots.map((d) => (
            <span
              key={d.id}
              title={`${d.label}: ${STATUS_LABEL[d.status]}`}
              className={cn(
                'inline-block h-2.5 w-2.5 rounded-full ring-2',
                DOT_COLOR[d.status],
              )}
            />
          ))}
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <ReadinessDrawer dots={dots} score={score} band={band} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function ReadinessDrawer({
  dots,
  score,
  band,
  onClose,
}: {
  dots: ReadinessDot[];
  score: number;
  band: DotStatus;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Context readiness"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close readiness drawer backdrop"
      />
      <motion.aside
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-300 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              <span className="font-mono text-slate-500">readiness</span>
              <span aria-hidden className="h-px w-4 bg-slate-400" />
              <span className="text-[#8A5A00]">live context</span>
            </p>
            <h2 className="mt-2 font-serif text-2xl text-slate-950">
              Score {score}{' '}
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-[0.14em]',
                  band === 'ready'
                    ? 'bg-emerald-100 text-emerald-800'
                    : band === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800',
                )}
              >
                {band}
              </span>
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Seven cores compose every Ask, draft, and tool run.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close readiness drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-5 space-y-2">
          {dots.map((d) => (
            <li key={d.id}>
              <Link
                href={d.fixHref}
                onClick={onClose}
                className="group flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span
                  aria-hidden
                  className={cn('mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2', DOT_COLOR[d.status])}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {d.label}
                    </span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {STATUS_LABEL[d.status]}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-slate-800">{d.detail}</span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#1B3A5C]">
                    {d.fixLabel}
                    <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </motion.aside>
    </motion.div>
  );
}
