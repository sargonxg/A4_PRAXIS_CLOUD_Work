'use client';

/**
 * Syria sanctions monitor board.
 *
 * Surfaces the live state of the EU, US, and UK sanctions regimes against
 * Syria after the EU's 25 February 2026 partial delisting. Distinguishes
 * what was lifted from what was retained, lists specific designated
 * persons / entities (public-record citations only), and surfaces upcoming
 * benchmarks and review windows the analyst should watch.
 *
 * Source basis: EU Council CFSP decisions, OFAC Treasury Department actions,
 * UK OFSI consolidated list, ReliefWeb / The Syria Report tracking.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Banknote, Calendar, Flag, Gavel, MapPinned, Scale, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Regime = 'EU' | 'US' | 'UK';
type Status = 'retained' | 'lifted' | 'under_review';

interface SanctionEntry {
  id: string;
  regime: Regime;
  target: string;
  type: 'individual' | 'entity' | 'sectoral';
  status: Status;
  legalBasis: string;
  rationale: string;
  notes: string;
  lastUpdate: string;
}

const ENTRIES: SanctionEntry[] = [
  // EU retained
  {
    id: 'eu-1',
    regime: 'EU',
    target: 'Bashar al-Assad',
    type: 'individual',
    status: 'retained',
    legalBasis: 'Council Decision 2013/255/CFSP — individual designation',
    rationale: 'Senior responsibility for repression and chemical-weapons use during the conflict.',
    notes: 'Asset freeze + visa ban remain. Resides in Moscow.',
    lastUpdate: '2026-02-25',
  },
  {
    id: 'eu-2',
    regime: 'EU',
    target: 'Maher al-Assad',
    type: 'individual',
    status: 'retained',
    legalBasis: 'Council Decision 2013/255/CFSP',
    rationale: '4th Armoured Division command linked to repression and chemical-weapons orders.',
    notes: 'Whereabouts unconfirmed; designation maintained.',
    lastUpdate: '2026-02-25',
  },
  {
    id: 'eu-3',
    regime: 'EU',
    target: 'Asma al-Assad',
    type: 'individual',
    status: 'retained',
    legalBasis: 'Council Decision 2013/255/CFSP',
    rationale: 'Asset / property holdings linked to former regime financial network.',
    notes: 'Designation retained pending evidence review.',
    lastUpdate: '2026-02-25',
  },
  // EU lifted
  {
    id: 'eu-4',
    regime: 'EU',
    target: 'Central Bank of Syria',
    type: 'entity',
    status: 'lifted',
    legalBasis: 'Council Implementing Regulation (EU) 2026/237',
    rationale: 'Decoupled from regime architecture; lifted to enable correspondent-banking access.',
    notes: 'Conditional on rights and governance benchmarks for August 2026 review.',
    lastUpdate: '2026-02-25',
  },
  {
    id: 'eu-5',
    regime: 'EU',
    target: 'Ministry of Petroleum and Mineral Resources',
    type: 'entity',
    status: 'lifted',
    legalBasis: 'Council Implementing Regulation (EU) 2026/237',
    rationale: 'Removed to permit reconstruction-energy interconnection (Türkiye MoU).',
    notes: 'Sectoral oversight remains via end-use due diligence.',
    lastUpdate: '2026-02-25',
  },
  {
    id: 'eu-6',
    regime: 'EU',
    target: 'Sectoral export ban — oil & gas equipment',
    type: 'sectoral',
    status: 'under_review',
    legalBasis: 'Council Decision 2013/255/CFSP, Art. 8',
    rationale: 'EU Council Working Party reviewing sectoral measures alongside reconstruction MoUs.',
    notes: 'Decision expected in August 2026 benchmark review.',
    lastUpdate: '2026-04-30',
  },

  // US (OFAC)
  {
    id: 'us-1',
    regime: 'US',
    target: 'OFAC Syria sanctions program',
    type: 'sectoral',
    status: 'under_review',
    legalBasis: 'Caesar Syria Civilian Protection Act of 2019',
    rationale: 'Treasury reviewing General Licence framework alongside post-Assad transition.',
    notes: 'Selective GL relief possible for humanitarian + recovery activity.',
    lastUpdate: '2026-04-12',
  },
  {
    id: 'us-2',
    regime: 'US',
    target: 'Syrian Government targeted designations (legacy)',
    type: 'entity',
    status: 'retained',
    legalBasis: 'EO 13338, EO 13399, EO 13460',
    rationale: 'Legacy designations of senior Assad-era figures remain on the SDN list.',
    notes: 'Treasury reviewing on case-by-case basis.',
    lastUpdate: '2026-03-18',
  },
  {
    id: 'us-3',
    regime: 'US',
    target: 'Hayat Tahrir al-Sham (HTS) FTO designation',
    type: 'entity',
    status: 'under_review',
    legalBasis: 'INA §219; designated 2018',
    rationale: 'Tension between FTO designation and HTS leadership in transitional government.',
    notes: 'State Department review tied to verifiable counter-terrorism behaviour.',
    lastUpdate: '2026-04-22',
  },

  // UK (OFSI)
  {
    id: 'uk-1',
    regime: 'UK',
    target: 'UK Syria sanctions (chemical weapons + repression)',
    type: 'sectoral',
    status: 'retained',
    legalBasis: 'The Syria (Sanctions) (EU Exit) Regulations 2019',
    rationale: 'UK retains targeted measures pending IIIM and CW evidence review.',
    notes: 'OFSI consolidated list updated quarterly.',
    lastUpdate: '2026-04-09',
  },
  {
    id: 'uk-2',
    regime: 'UK',
    target: 'Caesar-evidence-flagged officials',
    type: 'individual',
    status: 'retained',
    legalBasis: 'UK Magnitsky-style global human rights regime (S.I. 2020/680)',
    rationale: 'Cross-references with the Caesar Photos Files and IIIM-flagged individuals.',
    notes: 'OFSI reviewing alongside FCDO accountability dossier.',
    lastUpdate: '2026-04-09',
  },
];

const STATUS_TONE: Record<Status, { label: string; chip: string; icon: typeof ArrowDownRight }> = {
  retained:     { label: 'Retained',     chip: 'bg-rose-100 text-rose-800',         icon: ArrowUpRight },
  lifted:       { label: 'Lifted',       chip: 'bg-emerald-100 text-emerald-800',  icon: ArrowDownRight },
  under_review: { label: 'Under review', chip: 'bg-amber-100 text-amber-800',      icon: Search },
};

const REGIME_COLOR: Record<Regime, string> = {
  EU: '#1d4ed8',
  US: '#b91c1c',
  UK: '#7c3aed',
};

const REVIEW_WINDOWS = [
  { date: '2026-06-30', body: 'EU EEAS', title: 'Quarterly designation review on transitional officials' },
  { date: '2026-08-25', body: 'EU Council', title: 'Benchmark review on partial delisting' },
  { date: '2026-09-15', body: 'US State / Treasury', title: 'HTS FTO designation evidence review' },
  { date: '2026-10-01', body: 'UK FCDO / OFSI', title: 'Quarterly OFSI consolidated-list update' },
];

export function SyriaSanctionsBoard({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Regime | 'ALL'>('ALL');

  const filtered = filter === 'ALL' ? ENTRIES : ENTRIES.filter((e) => e.regime === filter);
  const tally = ENTRIES.reduce(
    (acc, e) => {
      acc[e.status] += 1;
      return acc;
    },
    { retained: 0, lifted: 0, under_review: 0 } as Record<Status, number>,
  );

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500/10 text-rose-700">
            <Gavel className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Sanctions board · Syria</p>
            <h3 className="text-sm font-semibold text-navy-950">EU · US · UK regimes after the 25 Feb 2026 partial delisting</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'EU', 'US', 'UK'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              className={cn(
                'rounded-md border px-2 py-1 text-[10px] font-semibold transition',
                filter === opt ? 'border-navy-400 bg-navy-950 text-white' : 'border-slate-200 text-navy-700 hover:bg-slate-50',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(Object.keys(STATUS_TONE) as Status[]).map((s) => {
          const tone = STATUS_TONE[s];
          const Icon = tone.icon;
          return (
            <div key={s} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{tone.label}</p>
              </div>
              <p className="mt-1 font-mono text-2xl font-semibold text-navy-950">{tally[s]}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-2">
          {filtered.map((entry, idx) => {
            const tone = STATUS_TONE[entry.status];
            const Icon = tone.icon;
            return (
              <motion.article
                key={entry.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04, duration: 0.26 }}
                className="rounded-md border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                      style={{ background: REGIME_COLOR[entry.regime] }}
                    >
                      {entry.regime}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', tone.chip)}>
                      <Icon className="h-3 w-3" />
                      {tone.label}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {entry.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{entry.lastUpdate}</span>
                </div>
                <h4 className="mt-2 text-sm font-semibold text-navy-950">{entry.target}</h4>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{entry.rationale}</p>
                <div className="mt-2 grid gap-2 lg:grid-cols-2">
                  <div className="rounded bg-white p-2">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Scale className="h-3 w-3" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider">Legal basis</p>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">{entry.legalBasis}</p>
                  </div>
                  <div className="rounded bg-white p-2">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPinned className="h-3 w-3" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider">Notes</p>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">{entry.notes}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <aside className="grid gap-3">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 text-amber-800">
              <Calendar className="h-3.5 w-3.5" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Upcoming review windows</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {REVIEW_WINDOWS.map((w) => (
                <li key={`${w.date}-${w.body}`} className="rounded bg-white/80 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-amber-800">{w.date}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900">{w.body}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 text-amber-900">{w.title}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <Banknote className="h-3.5 w-3.5" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Why this matters</p>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-emerald-900">
              Sanctions sequencing is the highest-leverage Western tool. The EU February delisting is conditional;
              August will tell whether sanctions are tied to inclusive drafting or sequenced separately.
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Flag className="h-3 w-3" />
              Tied to advisory debate above
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
