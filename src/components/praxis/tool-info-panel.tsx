'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Circle, BookOpen, Database, Wrench, ListOrdered, Clock, Sparkles } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';

export interface ToolInfoPanelProps {
  toolName: string;
  description: string;
  methodology: string; // 2-3 paragraphs separated by \n\n
  frameworks: Array<{ name: string; citation: string }>;
  dataSources: Array<{ name: string; status: 'live' | 'offline' | 'estimated' }>;
  relatedTools: Array<{ name: string; href: string }>;
  howToUse: [string, string, string]; // exactly 3 steps
  whyThisWorks?: string;
  lastGenerated?: Date | null;
  defaultOpen?: boolean;
}

function DataSourceBadge({ status }: { status: 'live' | 'offline' | 'estimated' }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live data
      </span>
    );
  }
  if (status === 'estimated') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        AI-generated
      </span>
    );
  }
  // offline
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
      <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
      Estimated
    </span>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ToolInfoPanel({
  toolName,
  description,
  methodology,
  frameworks,
  dataSources,
  relatedTools,
  howToUse,
  whyThisWorks,
  lastGenerated,
  defaultOpen = false,
}: ToolInfoPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  const paragraphs = methodology.split('\n\n').filter(Boolean);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-[#0F172A]/[0.02] overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#0F172A]/[0.03] transition-colors group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-navy-400 group-hover:text-navy-600 transition-colors" />
          <span className="text-xs font-medium text-navy-500 group-hover:text-navy-700 transition-colors">
            About this tool
            <span className="ml-1.5 text-navy-400 font-normal">— {toolName}</span>
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-navy-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-navy-400" />
        )}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-[var(--color-app-border)] px-5 py-4 space-y-5">
          {/* Description */}
          <p className="text-xs text-navy-600 leading-relaxed">{description}</p>

          {whyThisWorks ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2">
              <h4 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                <Sparkles className="h-3 w-3" />
                Why this works
              </h4>
              <p className="text-xs leading-relaxed text-emerald-900">{whyThisWorks}</p>
            </div>
          ) : null}

          {/* Divider */}
          <div className="border-t border-[var(--color-app-border)]" />

          {/* Methodology */}
          <div>
            <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              <BookOpen className="h-3 w-3" />
              Methodology
            </h4>
            <div className="space-y-2">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-xs text-navy-600 leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-app-border)]" />

          {/* Frameworks + Data Sources row */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Frameworks */}
            <div>
              <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <Circle className="h-3 w-3" />
                Frameworks
              </h4>
              <div className="space-y-1.5">
                {frameworks.map((fw) => (
                  <div key={fw.name} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-navy-700">{fw.name}</span>
                    <span className="text-[10px] text-navy-400 leading-relaxed">{fw.citation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <Database className="h-3 w-3" />
                Data Sources
              </h4>
              <div className="space-y-2">
                {dataSources.map((ds) => (
                  <div key={ds.name} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-navy-700">{ds.name}</span>
                    <DataSourceBadge status={ds.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-app-border)]" />

          {/* How to use */}
          <div>
            <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              <ListOrdered className="h-3 w-3" />
              How to use
            </h4>
            <div className="space-y-2">
              {howToUse.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  <p className="text-xs text-navy-600 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related tools + Data freshness footer */}
          <div className="border-t border-[var(--color-app-border)]" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Related tools */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-medium text-navy-400 uppercase tracking-wider">
                <Wrench className="h-3 w-3" />
                Related:
              </span>
              {relatedTools.map((tool) => (
                <PraxisLink
                  key={tool.href}
                  href={tool.href}
                  className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] font-medium text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
                >
                  {tool.name}
                </PraxisLink>
              ))}
            </div>

            {/* Data freshness */}
            <div className="flex items-center gap-1 text-[10px] text-navy-400">
              <Clock className="h-3 w-3" />
              {lastGenerated
                ? <>Last generated: <span className="font-medium text-navy-600 ml-0.5">{formatTimeAgo(lastGenerated)}</span></>
                : <span className="italic">No data yet</span>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
