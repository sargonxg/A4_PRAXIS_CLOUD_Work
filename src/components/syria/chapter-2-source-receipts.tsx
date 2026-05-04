'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight, ExternalLink, Library, Newspaper, SearchCheck, ShieldCheck } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  SYRIA_CURRENT_RESEARCH_SOURCES,
  SYRIA_LIVE_RESEARCH_MODES,
  SYRIA_LOCAL_MEDIA_SOURCES,
  SYRIA_STRUCTURED_RESEARCH_RESPONSE_CONTRACT,
} from '@/lib/constants/syria-demo-workspace';
import {
  SYRIA_REFERENCE_CATEGORIES,
  syriaReferencesByCategory,
  type SyriaReferenceCategory,
} from '@/lib/constants/syria-grounded-references';
import { SyriaAgentConsole } from '@/components/syria/agent-console';
import { SyriaLayerOfTruth } from '@/components/syria/layer-of-truth';
import { SyriaDailyMediaWorkflow } from '@/components/syria/daily-media-workflow';
import { SYRIA_AGENT_PRESETS } from '@/lib/syria/agent-presets';
import { cn } from '@/lib/utils/cn';

const RECEIPT_TIERS = [
  { tier: 'Tier 1', label: 'UN and official public records', count: 2, confidence: 'highest' },
  { tier: 'Tier 2', label: 'Humanitarian and rights reports', count: 2, confidence: 'high' },
  { tier: 'Tier 3', label: 'Think tank and specialist analysis', count: 4, confidence: 'interpretive' },
  { tier: 'Tier 4', label: 'Local media and monitoring', count: SYRIA_LOCAL_MEDIA_SOURCES.length, confidence: 'triangulate' },
];

export function SyriaChapterSourceReceipts() {
  const topSources = SYRIA_CURRENT_RESEARCH_SOURCES.slice(0, 6);
  const localSources = SYRIA_LOCAL_MEDIA_SOURCES.slice(0, 6);
  const refsByCategory = syriaReferencesByCategory();
  const reduceMotion = useReducedMotion();
  const [openCategory, setOpenCategory] = useState<SyriaReferenceCategory | null>('un_doc');

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          {RECEIPT_TIERS.map((tier) => (
            <div key={tier.tier} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{tier.tier}</p>
              <p className="mt-1 text-sm font-semibold text-navy-950">{tier.label}</p>
              <p className="mt-2 font-mono text-lg font-semibold text-diplomatic-blue">{tier.count}</p>
              <p className="text-[11px] font-medium text-slate-500">{tier.confidence}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current source receipts</p>
              <h3 className="mt-1 text-base font-semibold text-navy-950">Evidence PRAXIS would retrieve, rank, and cite</h3>
            </div>
            <PraxisLink
              href="/source-scout?recording=1&case=syria"
              className="inline-flex items-center gap-2 rounded-md border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-800 transition hover:bg-navy-50"
            >
              <SearchCheck className="h-4 w-4" />
              Open Source Scout
            </PraxisLink>
          </div>
          <div className="mt-3 grid gap-2">
            {topSources.map((source) => (
              <a
                key={`${source.name}-${source.title}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-200 bg-white p-3 transition hover:border-diplomatic-blue/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-navy-900">{source.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    {source.date}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">{source.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{source.graphUse}</p>
              </a>
            ))}
          </div>
        </div>

        <SyriaLayerOfTruth />
        <SyriaDailyMediaWorkflow />

        <SyriaAgentConsole
          persona={SYRIA_AGENT_PRESETS['source-scout']!.persona}
          toolId={SYRIA_AGENT_PRESETS['source-scout']!.toolId}
          question={SYRIA_AGENT_PRESETS['source-scout']!.question}
          trace={SYRIA_AGENT_PRESETS['source-scout']!.trace}
          answer={SYRIA_AGENT_PRESETS['source-scout']!.answer}
        />

        <div className="rounded-lg border border-navy-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Grounded reference layer</p>
              <h3 className="mt-1 text-base font-semibold text-navy-950">
                Wikipedia, UN documents, OHCHR, academic centres, data portals
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                One click below the tier-ranked receipts: every claim has an encyclopedic, treaty, or dataset anchor a
                reader can open without leaving the case file.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              {Object.values(refsByCategory).reduce((sum, list) => sum + list.length, 0)} anchors
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {SYRIA_REFERENCE_CATEGORIES.map((cat) => {
              const list = refsByCategory[cat.id];
              if (list.length === 0) return null;
              const open = openCategory === cat.id;
              return (
                <div key={cat.id} className="rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(open ? null : cat.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
                    aria-expanded={open}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', cat.tone)}>
                        {cat.label}
                      </span>
                      <span className="text-xs font-semibold text-navy-900">{list.length} anchors</span>
                    </span>
                    {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </button>
                  {open ? (
                    <motion.ul
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={reduceMotion ? undefined : { opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden border-t border-slate-100 bg-slate-50/60"
                    >
                      {list.map((ref) => (
                        <li key={ref.id} className="border-t border-slate-100 first:border-0">
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block px-3 py-2 transition hover:bg-white"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold text-navy-900">{ref.title}</p>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {ref.publisher} <span className="text-slate-400">·</span> retrieved {ref.retrievedAt}
                            </p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-600">{ref.graphUse}</p>
                          </a>
                        </li>
                      ))}
                    </motion.ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="grid gap-3">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-teal-800">
            <Newspaper className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Local Syria source map</p>
          </div>
          <div className="mt-3 grid gap-2">
            {localSources.map((source) => (
              <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="rounded-md bg-white/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-navy-950">{source.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{source.posture}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-diplomatic-blue" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Research contract</p>
          </div>
          <div className="mt-3 space-y-2">
            {SYRIA_STRUCTURED_RESEARCH_RESPONSE_CONTRACT.slice(0, 4).map((item) => (
              <div key={item.section} className="rounded-md bg-slate-50 p-2">
                <p className="text-xs font-semibold text-navy-900">{item.section}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{item.requirement}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Live AI modes</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-950">
            {SYRIA_LIVE_RESEARCH_MODES.length} bounded searches refresh only missing evidence, keeping cloud cost predictable.
          </p>
        </div>
      </aside>
    </div>
  );
}
