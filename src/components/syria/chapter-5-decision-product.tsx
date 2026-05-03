import { ClipboardCheck, FileText, MessageSquareText, Save, ShieldCheck } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { SYRIA_DEMO_CONFLICT_GRAPH } from '@/lib/constants/syria-demo-case';
import {
  SYRIA_COMMITMENT_MONITOR_DEMO,
  SYRIA_DOCUMENT_REVIEW_CHECKLIST,
  SYRIA_GRAPH_GROUNDING_PIPELINE,
  SYRIA_STRUCTURED_RESEARCH_RESPONSE_CONTRACT,
} from '@/lib/constants/syria-demo-workspace';

const PRODUCTS = [
  {
    title: 'Principal briefing',
    href: '/briefing?recording=1&case=syria',
    icon: FileText,
    output: 'BLUF, risk board, graph readout, trigger watch, source basis, and asks.',
  },
  {
    title: 'Policy memo',
    href: '/policy-memo?recording=1&case=syria',
    icon: ClipboardCheck,
    output: 'Editable recommendation memo with assumptions, options, dissent, and citations.',
  },
  {
    title: 'Talking points',
    href: '/documents?case=syria',
    icon: MessageSquareText,
    output: 'Leadership-safe language that separates facts, assessment, and uncertainty.',
  },
];

export function SyriaChapterDecisionProduct() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Decision surface</p>
            <h3 className="mt-1 text-lg font-semibold text-navy-950">From graph evidence to work product</h3>
          </div>
          <PraxisLink
            href="/briefing?recording=1&case=syria"
            className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
          >
            <Save className="h-4 w-4" />
            Open product
          </PraxisLink>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            return (
              <PraxisLink
                key={product.title}
                href={product.href}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-diplomatic-blue/40 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-navy-950">{product.title}</p>
                  <Icon className="h-4 w-4 text-diplomatic-blue" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">{product.output}</p>
              </PraxisLink>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-navy-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Brief-ready line</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            The January agreement remains the best stabilizing track, but implementation should be judged through rights,
            security sequencing, humanitarian access, and regional-spillover triggers. Confidence is moderate because public
            UN and humanitarian receipts are strong while district-level implementation evidence remains thinner.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SYRIA_COMMITMENT_MONITOR_DEMO.slice(0, 2).map((item) => (
              <div key={item.commitment} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-navy-950">{item.commitment}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{item.nextAction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="grid gap-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Provenance carried forward</p>
          </div>
          <div className="mt-3 grid gap-2">
            {SYRIA_STRUCTURED_RESEARCH_RESPONSE_CONTRACT.slice(1, 6).map((item) => (
              <div key={item.section} className="rounded-md bg-white/80 p-2">
                <p className="text-xs font-semibold text-navy-900">{item.section}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Document gate</p>
          <div className="mt-3 space-y-2">
            {SYRIA_DOCUMENT_REVIEW_CHECKLIST.map((item) => (
              <div key={item} className="flex gap-2 rounded-md bg-slate-50 p-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-4 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-800">Graph path attached</p>
          <p className="mt-2 text-xs leading-5 text-gold-900">
            {SYRIA_DEMO_CONFLICT_GRAPH.commitments[0]?.title}: rights protections to return arrangements to humanitarian
            access to regional-spillover watch.
          </p>
          <p className="mt-2 text-[11px] leading-4 text-gold-900/80">
            Final stage: {SYRIA_GRAPH_GROUNDING_PIPELINE[SYRIA_GRAPH_GROUNDING_PIPELINE.length - 1]?.detail}
          </p>
        </div>
      </aside>
    </div>
  );
}
