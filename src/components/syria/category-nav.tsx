'use client';

/**
 * Syria category navigator — the left rail.
 *
 * Sticky sidebar that breaks the case file into seven clearly named
 * categories. Each category lists its sub-anchors with counters, an icon,
 * and click-to-scroll behaviour. The active section auto-highlights based
 * on viewport scroll position via IntersectionObserver.
 */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Brain,
  Database,
  FileText,
  GitBranch,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CategoryItem {
  id: string;
  label: string;
  count?: string;
}

interface Category {
  id: string;
  number: number;
  title: string;
  tagline: string;
  icon: typeof Brain;
  iconTone: string;
  items: CategoryItem[];
}

export const SYRIA_CATEGORIES: Category[] = [
  {
    id: 'cat-desk',
    number: 1,
    title: 'The desk',
    tagline: 'Who is at the desk and why it matters',
    icon: Users,
    iconTone: 'text-blue-700',
    items: [
      { id: 'situation-frame',                      label: 'Situation frame',     count: 'Risk 78' },
      { id: 'syria-context-generation',             label: 'Context generation',  count: '5 stages' },
    ],
  },
  {
    id: 'cat-context',
    number: 2,
    title: 'Context creation',
    tagline: 'How PRAXIS builds the picture',
    icon: Brain,
    iconTone: 'text-purple-700',
    items: [
      { id: 'syria-geo-map',                        label: 'Geographic intel',    count: '12 towns' },
      { id: 'syria-cinematic-timeline',             label: 'Cinematic timeline',  count: '17 events' },
      { id: 'syria-nyc-stakeholders',               label: 'NYC stakeholders',    count: '35 counterparts' },
    ],
  },
  {
    id: 'cat-truth',
    number: 3,
    title: 'Layer of truth',
    tagline: 'Trust scoring before the AI writes a word',
    icon: ShieldCheck,
    iconTone: 'text-emerald-700',
    items: [
      { id: 'source-receipts',                      label: 'Source receipts',     count: 'Tier 1-4' },
      { id: 'syria-layer-of-truth',                 label: 'Trust scoring',       count: '42 sources' },
      { id: 'syria-daily-media',                    label: 'Daily media intake',  count: '4-step loop' },
      { id: 'syria-source-scout',                   label: 'Source Scout agent',  count: '5 fresh' },
    ],
  },
  {
    id: 'cat-graph',
    number: 4,
    title: 'Conflict graph',
    tagline: 'Backbone for every other policy app',
    icon: Network,
    iconTone: 'text-amber-700',
    items: [
      { id: 'conflict-graph',                       label: 'ACO ontology',        count: '8 primitives · 72 edges' },
    ],
  },
  {
    id: 'cat-reasoning',
    number: 5,
    title: 'Reasoning',
    tagline: 'Recipes, comparators, advisors, sanctions',
    icon: Layers,
    iconTone: 'text-rose-700',
    items: [
      { id: 'dialectica-reasoning',                 label: 'Dialectica recipes',  count: '5 recipes' },
      { id: 'syria-comparator-strip',               label: 'Named analogs',       count: '4 cases' },
      { id: 'syria-red-team',                       label: 'Red Team agent',      count: '3 falsifications' },
      { id: 'syria-advisory-debate',                label: 'Advisory debate',     count: '5 advisors' },
      { id: 'syria-sanctions',                      label: 'Sanctions board',     count: 'EU · US · UK' },
    ],
  },
  {
    id: 'cat-workflows',
    number: 6,
    title: 'Real workflows',
    tagline: 'Three rhythms of the analyst desk',
    icon: Workflow,
    iconTone: 'text-teal-700',
    items: [
      { id: 'syria-workflows',                      label: 'Workflows board',     count: '3 named' },
    ],
  },
  {
    id: 'cat-decision',
    number: 7,
    title: 'Write & ship',
    tagline: 'Ask · brief · library',
    icon: FileText,
    iconTone: 'text-indigo-700',
    items: [
      { id: 'decision-product',                     label: 'Decision product',    count: '3 surfaces' },
      { id: 'syria-ask-praxis',                     label: 'Ask PRAXIS',          count: '3 queries' },
      { id: 'syria-brief-builder',                  label: 'Brief generator',     count: '10 blocks' },
      { id: 'syria-library',                        label: 'Knowledge library',   count: '5 prior docs' },
    ],
  },
];

export function SyriaCategoryNav() {
  const reduceMotion = useReducedMotion();
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const ids = SYRIA_CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveAnchor(visible[0]!.target.id);
        }
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.1, 0.5] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function jumpTo(id: string) {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  return (
    <nav className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto pr-2 lg:block" aria-label="Syria case navigator">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Click any section · stays in sync as you scroll</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-600">
          The whole walkthrough is one page, organised in 7 categories. Click an item to jump.
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {SYRIA_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          const hasActive = cat.items.some((i) => i.id === activeAnchor);
          return (
            <motion.li
              key={cat.id}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04, duration: 0.28 }}
            >
              <div
                className={cn(
                  'rounded-md border bg-white p-2 transition',
                  hasActive ? 'border-navy-400 ring-1 ring-navy-200' : 'border-slate-200',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-md bg-slate-100', hasActive ? 'bg-navy-950 text-white' : '')}>
                    {hasActive ? (
                      <span className="font-mono text-[11px] font-semibold">{cat.number}</span>
                    ) : (
                      <Icon className={cn('h-3.5 w-3.5', cat.iconTone)} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-tight text-navy-950">{cat.title}</p>
                    <p className="text-[9px] leading-tight text-slate-500">{cat.tagline}</p>
                  </div>
                </div>
                <ul className="mt-1.5 space-y-0.5 border-l border-slate-200 pl-3">
                  {cat.items.map((item) => {
                    const active = activeAnchor === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => jumpTo(item.id)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-[10px] transition',
                            active ? 'bg-navy-50 font-semibold text-navy-950' : 'text-slate-600 hover:bg-slate-50',
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {active ? <Sparkles className="h-2.5 w-2.5 text-gold-500" /> : null}
                            <span>{item.label}</span>
                          </span>
                          {item.count ? (
                            <span className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-600">{item.count}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex items-center gap-1.5 text-emerald-800">
          <GitBranch className="h-3 w-3" />
          <p className="text-[9px] font-semibold uppercase tracking-wider">DIALECTICA backbone</p>
        </div>
        <p className="mt-1 text-[10px] leading-4 text-emerald-900">
          The graph + reasoning is the standalone product. Every other PRAXIS module — mediation, scenarios, negotiation — sits on top.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-center">
        <Database className="mx-auto h-4 w-4 text-slate-500" />
        <p className="mt-1 text-[10px] font-semibold text-navy-950">Live · public-source seed</p>
        <p className="mt-0.5 text-[9px] leading-4 text-slate-500">No private intel · all sources clickable</p>
      </div>
    </nav>
  );
}
