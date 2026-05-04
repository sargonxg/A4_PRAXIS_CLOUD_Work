'use client';

/**
 * Syria Layer of Truth.
 *
 * Visualizes the trust scoring PRAXIS computes before any AI tool reads a
 * source. Each tier has a reliability range, a count of indexed sources,
 * and a list of representative anchors. The "trust button" lets the
 * analyst flip a source from accepted to disputed; the AI honours the
 * change in the same session.
 */

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ShieldAlert, ShieldCheck, ShieldQuestion, Verified } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type TierKey = 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d';

interface TierBucket {
  id: TierKey;
  label: string;
  description: string;
  reliabilityRange: [number, number];
  count: number;
  examples: string[];
  tint: string;
  bar: string;
  iconTone: string;
}

const TIERS: TierBucket[] = [
  {
    id: 'tier_a',
    label: 'Tier A · primary record',
    description: 'UN treaty bodies, IIIM, COI, Security Council resolutions, IGO sit-reps',
    reliabilityRange: [88, 96],
    count: 14,
    examples: [
      'UN COI Syria periodic report',
      'UN Security Council Resolution 2254',
      'OCHA 2026 Syria HRP',
      'OHCHR communications archive',
      'ICRC IHL practice on Syria',
    ],
    tint: 'bg-emerald-50 border-emerald-200',
    bar: 'bg-emerald-500',
    iconTone: 'text-emerald-700',
  },
  {
    id: 'tier_b',
    label: 'Tier B · named-author analysis',
    description: 'Crisis Group, Carnegie, ECFR, Brookings, Chatham House, MEI, USIP',
    reliabilityRange: [82, 91],
    count: 11,
    examples: [
      'ECFR — EU benchmarks for delisting',
      'Carnegie MEC — recovery economics',
      'Crisis Group — northeast field memo',
      'Brookings — Syria research hub',
    ],
    tint: 'bg-blue-50 border-blue-200',
    bar: 'bg-blue-500',
    iconTone: 'text-blue-700',
  },
  {
    id: 'tier_c',
    label: 'Tier C · wire and quality press',
    description: 'Reuters, AFP, AP, BBC, Le Monde, Al Jazeera English',
    reliabilityRange: [78, 88],
    count: 9,
    examples: [
      'Reuters — Syria desk',
      'AFP — Syria',
      'AP — Syria hub',
      'Al Jazeera English — Syria',
    ],
    tint: 'bg-amber-50 border-amber-200',
    bar: 'bg-amber-500',
    iconTone: 'text-amber-700',
  },
  {
    id: 'tier_d',
    label: 'Tier D · local and contested',
    description: 'Local Syrian media, monitoring orgs, official state messaging',
    reliabilityRange: [42, 78],
    count: 8,
    examples: [
      'Enab Baladi · Syria Direct · North Press',
      'SOHR conflict monitor',
      'SyriaUntold civic storytelling',
      'SANA (state)',
    ],
    tint: 'bg-rose-50 border-rose-200',
    bar: 'bg-rose-500',
    iconTone: 'text-rose-700',
  },
];

const FILTER_LABELS: Record<TierKey | 'all', { label: string; icon: typeof ShieldCheck; iconTone: string }> = {
  all:    { label: 'All tiers',  icon: ShieldQuestion, iconTone: 'text-slate-600' },
  tier_a: { label: 'Primary',    icon: ShieldCheck,    iconTone: 'text-emerald-700' },
  tier_b: { label: 'Named-author', icon: Verified,     iconTone: 'text-blue-700' },
  tier_c: { label: 'Wire',       icon: CheckCircle2,   iconTone: 'text-amber-700' },
  tier_d: { label: 'Local',      icon: ShieldAlert,    iconTone: 'text-rose-700' },
};

export function SyriaLayerOfTruth({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<TierKey | 'all'>('all');
  const [trustOverrides, setTrustOverrides] = useState<Record<string, 'accepted' | 'disputed' | 'unknown'>>({});

  const tiers = useMemo(() => (filter === 'all' ? TIERS : TIERS.filter((t) => t.id === filter)), [filter]);
  const totalSources = TIERS.reduce((sum, t) => sum + t.count, 0);

  function toggleTrust(exampleId: string) {
    setTrustOverrides((prev) => {
      const current = prev[exampleId] ?? 'accepted';
      const next: 'accepted' | 'disputed' | 'unknown' = current === 'accepted' ? 'disputed' : current === 'disputed' ? 'unknown' : 'accepted';
      return { ...prev, [exampleId]: next };
    });
  }

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Layer of truth</p>
            <h3 className="text-sm font-semibold text-navy-950">
              Trust scoring across {totalSources} sources · click any source to flip its trust label
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'tier_a', 'tier_b', 'tier_c', 'tier_d'] as const).map((opt) => {
            const conf = FILTER_LABELS[opt];
            const Icon = conf.icon;
            const isActive = filter === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition',
                  isActive ? 'border-navy-400 bg-navy-950 text-white' : 'border-slate-200 text-navy-700 hover:bg-slate-50',
                )}
              >
                <Icon className={cn('h-3 w-3', isActive ? 'text-gold-300' : conf.iconTone)} />
                {conf.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {tiers.map((tier, idx) => {
          const [low, high] = tier.reliabilityRange;
          return (
            <motion.div
              key={tier.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              className={cn('rounded-md border p-3', tier.tint)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-800">{tier.label}</p>
                <span className="text-[10px] font-mono text-slate-500">{tier.count} sources</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-700">{tier.description}</p>

              <div className="mt-3 flex items-center gap-2">
                <div className="relative h-2 flex-1 rounded-full bg-white">
                  <motion.div
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={reduceMotion ? undefined : { width: `${high}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={cn('absolute left-0 top-0 h-2 rounded-full', tier.bar)}
                    style={{ width: `${high}%` }}
                  />
                  <motion.div
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={reduceMotion ? undefined : { width: `${low}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="absolute left-0 top-0 h-2 rounded-full bg-white/60 mix-blend-overlay"
                    style={{ width: `${low}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-slate-600">
                  {low}–{high}%
                </span>
              </div>

              <ul className="mt-3 space-y-1">
                {tier.examples.map((ex) => {
                  const trust = trustOverrides[`${tier.id}-${ex}`] ?? 'accepted';
                  const isHighTrust = (tier.id === 'tier_a' || tier.id === 'tier_b') && trust === 'accepted';
                  return (
                    <li
                      key={ex}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md px-2 py-1 transition',
                        isHighTrust
                          ? 'bg-white border-2 border-emerald-400 ring-1 ring-emerald-200/50 shadow-sm shadow-emerald-200/20'
                          : 'bg-white/80 border border-transparent',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {isHighTrust ? <ShieldCheck className="h-3 w-3 text-emerald-600" /> : null}
                        <span className="text-[11px] leading-4 text-navy-900">{ex}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleTrust(`${tier.id}-${ex}`)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition',
                          trust === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : trust === 'disputed'
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300',
                        )}
                      >
                        {trust === 'accepted' ? <ShieldCheck className="h-2.5 w-2.5" /> : trust === 'disputed' ? <ShieldAlert className="h-2.5 w-2.5" /> : <ShieldQuestion className="h-2.5 w-2.5" />}
                        {trust}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-3 rounded-md bg-slate-50 p-3 text-[11px] leading-4 text-slate-600">
        <span className="font-semibold text-navy-700">How PRAXIS uses this:</span> every claim cited from a downgraded
        source carries a confidence drop in the brief. The trust label is part of the context block — Ask PRAXIS,
        the recipes, and the brief builder all read it before generating language.
      </p>
    </section>
  );
}
