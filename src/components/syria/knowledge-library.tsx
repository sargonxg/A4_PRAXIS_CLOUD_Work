'use client';

/**
 * Syria knowledge library.
 *
 * Two-pane component: previously written documents (briefs, memos, talking
 * points, dossiers) on one side, and the cumulative knowledge that the case
 * file has accreted (tracked entities, commitments, sources, decisions) on
 * the other. Demonstrates that PRAXIS keeps an evolving institutional memory
 * — every brief becomes a new searchable artefact.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Archive, BookOpenText, BrainCircuit, FileText, History, MessageSquareText, ScrollText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PriorDocument {
  id: string;
  title: string;
  type: 'brief' | 'memo' | 'talking_points' | 'dossier' | 'sit_rep';
  date: string;
  author: string;
  summary: string;
  citations: number;
}

const PRIOR_DOCS: PriorDocument[] = [
  {
    id: 'doc-1',
    title: 'Syria — northeast integration brief (week of 28 Apr)',
    type: 'brief',
    date: '2026-05-01',
    author: 'You',
    summary: 'BLUF on the Damascus-SDF integration, three falsification triggers, EU benchmark calendar.',
    citations: 12,
  },
  {
    id: 'doc-2',
    title: 'Coastal accountability — IIIM-aligned policy memo',
    type: 'memo',
    date: '2026-04-22',
    author: 'You + analyst peer',
    summary: 'Recommendation to bundle delisting tranche only with named civil-society observers in the drafting.',
    citations: 9,
  },
  {
    id: 'doc-3',
    title: 'Talking points — Q&A on Israeli operations in Sweida',
    type: 'talking_points',
    date: '2026-04-18',
    author: 'You',
    summary: 'Three sentences for press, three for principals, plus three lines for the daily noon brief.',
    citations: 5,
  },
  {
    id: 'doc-4',
    title: 'Dossier — Ahmad al-Sharaa transitional cabinet',
    type: 'dossier',
    date: '2026-03-30',
    author: 'You',
    summary: 'Cabinet composition, sectoral portfolios, prior-affiliation mapping, factional weighting.',
    citations: 18,
  },
  {
    id: 'doc-5',
    title: 'Sit-rep — Aleppo + Northeast displacement spike',
    type: 'sit_rep',
    date: '2026-02-10',
    author: 'OCHA NY · co-author',
    summary: 'UNFPA data triangulated with field reports; 128.4k displaced over 5 weeks.',
    citations: 7,
  },
];

const DOC_TYPE_TONE: Record<PriorDocument['type'], { label: string; chip: string; icon: typeof FileText }> = {
  brief:           { label: 'Brief',           chip: 'bg-blue-100 text-blue-800',         icon: FileText           },
  memo:            { label: 'Policy memo',     chip: 'bg-emerald-100 text-emerald-800',  icon: ScrollText         },
  talking_points:  { label: 'Talking points',  chip: 'bg-amber-100 text-amber-800',      icon: MessageSquareText  },
  dossier:         { label: 'Dossier',         chip: 'bg-purple-100 text-purple-800',    icon: BookOpenText       },
  sit_rep:         { label: 'Sit-rep',         chip: 'bg-rose-100 text-rose-800',        icon: History            },
};

const KNOWLEDGE_COUNTERS = [
  { label: 'Actors tracked',           value: 38, icon: BrainCircuit, tone: 'text-blue-700' },
  { label: 'Commitments monitored',    value:  8, icon: Tag,          tone: 'text-emerald-700' },
  { label: 'Events on timeline',       value: 17, icon: History,      tone: 'text-amber-700' },
  { label: 'Source anchors indexed',   value: 72, icon: BookOpenText, tone: 'text-purple-700' },
  { label: 'Documents accreted',       value:  5, icon: FileText,     tone: 'text-rose-700' },
  { label: 'Tags learned this week',   value: 14, icon: Archive,      tone: 'text-slate-700' },
];

const TAG_CLOUD = [
  '#integration-track',
  '#minority-protection',
  '#detention-access',
  '#sanctions-sequencing',
  '#civil-society-drafting',
  '#hlp-disputes',
  '#cross-border-corridor',
  '#counter-isil',
  '#regional-spillover',
  '#return-areas',
  '#coastal-accountability',
  '#disengagement-line',
];

export function SyriaKnowledgeLibrary({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>(PRIOR_DOCS[0]!.id);
  const selected = PRIOR_DOCS.find((d) => d.id === selectedId)!;

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/15 text-purple-700">
            <BookOpenText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700">Knowledge library</p>
            <h3 className="text-sm font-semibold text-navy-950">
              Previous outputs · cumulative knowledge · this case file is institutional memory
            </h3>
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Previous documents</p>
          <ul className="mt-2 grid gap-2">
            {PRIOR_DOCS.map((doc, idx) => {
              const tone = DOC_TYPE_TONE[doc.type];
              const Icon = tone.icon;
              const isSelected = selectedId === doc.id;
              return (
                <motion.li
                  key={doc.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.28 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    className={cn(
                      'w-full rounded-md border p-3 text-left transition',
                      isSelected ? 'border-navy-400 bg-navy-50' : 'border-slate-200 bg-white hover:border-navy-200',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', tone.chip)}>
                        {tone.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{doc.date}</span>
                      <span className="text-[10px] text-slate-500">· {doc.author}</span>
                      <span className="ml-auto text-[10px] font-mono text-slate-500">{doc.citations} cites</span>
                    </div>
                    <p className="mt-1.5 text-[12px] font-semibold leading-tight text-navy-950">{doc.title}</p>
                    {isSelected ? (
                      <p className="mt-1 text-[11px] leading-4 text-slate-600">{doc.summary}</p>
                    ) : null}
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <aside className="grid gap-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cumulative knowledge</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {KNOWLEDGE_COUNTERS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="rounded-md bg-white p-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{c.label}</p>
                      <Icon className={cn('h-3 w-3', c.tone)} />
                    </div>
                    <p className="mt-0.5 font-mono text-base font-semibold text-navy-950">{c.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">Tags learned this week</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {TAG_CLOUD.map((tag) => (
                <span key={tag} className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Looking back at {selected.title}</p>
            <p className="mt-1 text-[11px] leading-4 text-emerald-900">
              {selected.summary} · {selected.citations} citations · {selected.author}.
            </p>
            <p className="mt-2 text-[10px] leading-4 text-emerald-800">
              <strong>Why it matters:</strong> PRAXIS retains every prior output as a graph node. The next brief reuses
              language, citations, and reasoning steps without rebuilding from zero.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
