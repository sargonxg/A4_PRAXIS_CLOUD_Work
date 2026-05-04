'use client';

/**
 * Word-style document preview for the Syria principal briefing.
 *
 * Demonstrates how PRAXIS composes a final decision product from the case
 * graph: structured blocks (heading, BLUF, sections, table, footnotes) that
 * preserve the formatting an analyst expects in a UN-style memo. The blocks
 * stream in via animation so the recording shows the document being built.
 *
 * Editable in the production app via TipTap; this preview renders the block
 * shape so a reviewer can see what the export looks like.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Download, FileSignature, ListTree, Quote, ScrollText, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DocBlock {
  id: string;
  type:
    | 'header'
    | 'title'
    | 'classification'
    | 'meta'
    | 'bluf'
    | 'section'
    | 'callout'
    | 'table'
    | 'list'
    | 'footnote';
  content: unknown;
}

const BLOCKS: DocBlock[] = [
  {
    id: 'b1',
    type: 'header',
    content: {
      issuingOffice: 'UN PERMANENT MISSION · ANALYTIC DESK · NEW YORK',
      ref: 'PMA/SYR/2026-05-04',
      pageOf: 'Page 1 of 3',
    },
  },
  { id: 'b2', type: 'classification', content: 'PUBLIC-SOURCE BRIEFING · NOT FOR ATTRIBUTION' },
  { id: 'b3', type: 'title', content: 'Syria Transition · Northeast Integration & Regional Spillover' },
  {
    id: 'b4',
    type: 'meta',
    content: {
      author: 'Senior analyst · Syria mandate',
      audience: 'Permanent Representative · Deputy PR · Political Coordinator',
      date: '4 May 2026',
      length: '1 page brief, 2-page evidence ledger annex',
    },
  },
  {
    id: 'b5',
    type: 'bluf',
    content:
      'The 30 January Damascus-SDF agreement is the most concrete de-escalatory pathway in the public-source Syria file but it is fragile. Implementation, humanitarian access, and regional spillover are decision triggers within days, not months. PRAXIS confidence: 0.74. Source basis: 5 tier-1 + 3 tier-2 references.',
  },
  {
    id: 'b6',
    type: 'section',
    content: {
      heading: 'Risk board',
      paragraphs: [
        'Implementation risk lies in governance and rights protections. The integration plan timeline has not been published 90+ days after signing; detention-facility security arrangements remain unverified by ICRC.',
        'Humanitarian risk centres on returnee absorption and minority protection. The 2026 HRP requires US$4.07 billion; current funding is at 29 per cent.',
        'Security risk concentrates in the south (Israeli operations), the east (Deir-ez-Zor localised clashes), and the detention corridor in al-Hasakah.',
        'Evidence risk is real: tier-4 local sources are present but field verification remains thinner than UN tier-1 reporting.',
      ],
    },
  },
  {
    id: 'b7',
    type: 'callout',
    content: {
      tone: 'amber',
      label: 'Trigger watch',
      body:
        'Four+ confirmed clashes in Deir-ez-Zor in 7 days flips the integration narrative. A high-casualty Israeli strike in Sweida or Quneitra resets attention to regional war. Two+ named civil-society networks publicly walking out of the drafting round exposes legitimacy thinness.',
    },
  },
  {
    id: 'b8',
    type: 'table',
    content: {
      caption: 'Commitment monitor — 8 tracked agreements, mean compliance 52%',
      head: ['Commitment', 'Status', 'Score', 'Next milestone'],
      rows: [
        ['30 Jan Damascus-SDF integration',         'Partial',     '56%', '2026-06-30 implementation plan'],
        ['Constitutional Declaration (5-year)',    'Partial',     '48%', '2026-06-02 consultative round close'],
        ['Coastal accountability commitment',      'Non-compliant', '22%', 'IIIM evidence brief'],
        ['EU sanctions delisting (conditional)',   'Compliant',   '81%', '2026-08-25 EU benchmark review'],
        ['Israel-Syria southern de-escalation',    'Non-compliant', '19%', 'UNDOF resumption of patrols'],
      ],
    },
  },
  {
    id: 'b9',
    type: 'list',
    content: {
      heading: 'Asks (decision package)',
      items: [
        'Protect the agreement with a 30-day implementation dashboard that the PR can table in informal consultations.',
        'Fuse humanitarian metrics into the same view so the brief reads as one file, not three.',
        'Bundle the next EU sanctions tranche with three named benchmarks: drafting committee participation list, HLP registry pilot, ICRC detention access.',
        'Sequence the NYC counterparts: Switzerland → IPI → NGO Working Group → Sierra Leone for the civil-society participation lane.',
      ],
    },
  },
  {
    id: 'b10',
    type: 'footnote',
    content: [
      '1. UN Special Envoy briefing to the Security Council, 22 April 2026.',
      '2. OCHA — 2026 Syria Humanitarian Needs and Response Plan, 15 February 2026.',
      '3. Council Implementing Regulation (EU) 2026/237, 25 February 2026.',
      '4. UNHCR — Historic return of displaced Syrians, 12 December 2025.',
      '5. ECFR — EU benchmarks for conditional sanctions delisting, April 2026.',
      '6. North Press Agency dispatches — al-Hasakah, March-April 2026.',
      '7. Carnegie Middle East Center — Recovery economics and HLP file, March 2026.',
    ],
  },
];

export function SyriaDocumentGenerator({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState<number>(reduceMotion ? BLOCKS.length : 0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduceMotion) return undefined;
    if (revealed >= BLOCKS.length) return undefined;
    const timer = window.setTimeout(() => setRevealed((r) => r + 1), 320);
    return () => window.clearTimeout(timer);
  }, [revealed, reduceMotion]);

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-900 text-white">
            <ScrollText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Document generator · live preview</p>
            <h3 className="text-sm font-semibold text-navy-950">
              Word-style brief composed from the case graph — TipTap editable in app
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
            <ShieldCheck className="h-3 w-3" />
            Provenance attached
          </span>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-400 cursor-not-allowed"
            title="Export available in app"
          >
            <Download className="h-3.5 w-3.5" />
            Export DOCX
          </button>
        </div>
      </header>

      <div
        ref={ref}
        className="mt-4 max-h-[560px] overflow-y-auto rounded-md border border-slate-200 bg-[#fafaf7] p-6 font-serif text-[13px] leading-6 text-slate-900 shadow-inner"
      >
        {BLOCKS.slice(0, revealed).map((block, idx) => (
          <motion.div
            key={block.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: idx * 0.02 }}
            className="mb-4"
          >
            <DocBlockView block={block} />
          </motion.div>
        ))}
        {revealed < BLOCKS.length ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
            <FileSignature className="h-3 w-3 animate-pulse" /> Drafting block {revealed + 1} of {BLOCKS.length}…
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 text-[10px] leading-4 text-slate-500 lg:grid-cols-3">
        <div className="rounded-md bg-slate-50 p-2">
          <ListTree className="mr-1 inline-block h-3 w-3 align-text-bottom" />
          Each block is graph-grounded — heading, BLUF, sections, table, footnotes carry per-claim provenance.
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <Quote className="mr-1 inline-block h-3 w-3 align-text-bottom" />
          TipTap editor preserves table, footnote, and callout shapes when the analyst edits in app.
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <ShieldCheck className="mr-1 inline-block h-3 w-3 align-text-bottom" />
          Export to DOCX preserves the brief formatting for Permanent Representative review.
        </div>
      </div>
    </section>
  );
}

function DocBlockView({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'header': {
      const c = block.content as { issuingOffice: string; ref: string; pageOf: string };
      return (
        <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
          <span>{c.issuingOffice}</span>
          <span>{c.ref}</span>
          <span>{c.pageOf}</span>
        </div>
      );
    }
    case 'classification':
      return (
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-rose-700">
          {String(block.content)}
        </p>
      );
    case 'title':
      return <h2 className="text-center text-xl font-semibold text-navy-950">{String(block.content)}</h2>;
    case 'meta': {
      const c = block.content as { author: string; audience: string; date: string; length: string };
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-y border-slate-200 py-2 text-[11px] text-slate-700">
          <div><strong>Author:</strong> {c.author}</div>
          <div><strong>Audience:</strong> {c.audience}</div>
          <div><strong>Date:</strong> {c.date}</div>
          <div><strong>Length:</strong> {c.length}</div>
        </div>
      );
    }
    case 'bluf':
      return (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Bottom-line up front</h3>
          <p className="mt-1">{String(block.content)}</p>
        </div>
      );
    case 'section': {
      const c = block.content as { heading: string; paragraphs: string[] };
      return (
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-navy-900">{c.heading}</h3>
          {c.paragraphs.map((p, i) => (
            <p key={i} className="mt-1.5">{p}</p>
          ))}
        </div>
      );
    }
    case 'callout': {
      const c = block.content as { tone: 'amber' | 'rose' | 'blue'; label: string; body: string };
      const toneCls =
        c.tone === 'amber' ? 'border-amber-300 bg-amber-50 text-amber-900' :
        c.tone === 'rose' ? 'border-rose-300 bg-rose-50 text-rose-900' :
        'border-blue-300 bg-blue-50 text-blue-900';
      return (
        <div className={cn('rounded-md border-l-4 p-3', toneCls)}>
          <p className="text-[10px] font-bold uppercase tracking-wider">{c.label}</p>
          <p className="mt-1 text-[12px]">{c.body}</p>
        </div>
      );
    }
    case 'table': {
      const c = block.content as { caption: string; head: string[]; rows: string[][] };
      return (
        <div>
          <p className="text-[10px] italic text-slate-500">{c.caption}</p>
          <table className="mt-1 w-full border border-slate-300 text-[11px]">
            <thead className="bg-slate-100">
              <tr>
                {c.head.map((h) => (
                  <th key={h} className="border border-slate-300 px-2 py-1 text-left font-semibold text-navy-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-slate-300 px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'list': {
      const c = block.content as { heading: string; items: string[] };
      return (
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-navy-900">{c.heading}</h3>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5">
            {c.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      );
    }
    case 'footnote': {
      const c = block.content as string[];
      return (
        <div className="border-t border-slate-300 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Footnotes</p>
          <ol className="mt-1 space-y-0.5 text-[11px] text-slate-600">
            {c.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      );
    }
    default:
      return null;
  }
}
