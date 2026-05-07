'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Bot, ShieldCheck, X } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { WorkbenchChapterRenderer } from '@/components/workbench/chapter-renderer';
import { WorkbenchScopeProvider, useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { WorkbenchTabContent } from '@/components/workbench/workbench-tab-content';
import { WorkbenchTabs } from '@/components/workbench/workbench-tabs';
import type { WorkspaceTabId } from '@/types/workbench';

export function WorkbenchActiveCase({ caseId, activeTab }: { caseId: string; activeTab: WorkspaceTabId | null }) {
  const [openTab, setOpenTab] = useState<WorkspaceTabId | null>(activeTab);

  return (
    <WorkbenchScopeProvider caseId={caseId} activeTab={openTab}>
      <WorkbenchActiveCaseInner activeTab={openTab} onOpenTab={setOpenTab} />
    </WorkbenchScopeProvider>
  );
}

function WorkbenchActiveCaseInner({
  activeTab,
  onOpenTab,
}: {
  activeTab: WorkspaceTabId | null;
  onOpenTab: (tab: WorkspaceTabId | null) => void;
}) {
  const { situation, isExampleCase, caseModule } = useWorkbenchScope();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="px-4 py-4">
          <Link href="/app/workbench" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-navy-900">
            <ArrowLeft className="h-3.5 w-3.5" />
            All cases
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                  {isExampleCase ? 'Example case' : 'User case'}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {caseModule.manifest.domain}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">{situation.name}</h1>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-650">{caseModule.manifest.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ContextHealthChip />
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800">
                <Bot className="h-3.5 w-3.5 text-gold-700" />
                Orchestrator idle
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Scoped case
              </span>
            </div>
          </div>
        </div>
        <WorkbenchTabs activeTab={activeTab} onOpen={onOpenTab} />
      </header>
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <WorkbenchChapterRenderer />
      </div>
      {activeTab ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/45 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
          <section className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1440px] rounded-lg border border-slate-200 bg-slate-50 shadow-2xl sm:min-h-[calc(100vh-3rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">Workspace tab</p>
                <h2 className="text-base font-semibold text-navy-950">{activeTabLabel(activeTab)}</h2>
              </div>
              <button
                type="button"
                onClick={() => onOpenTab(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-navy-800 hover:border-navy-300"
                aria-label="Close workspace tab"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <WorkbenchTabContent activeTab={activeTab} />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function activeTabLabel(tab: WorkspaceTabId): string {
  if (tab === 'context') return 'Context';
  if (tab === 'library') return 'Library';
  if (tab === 'ontology') return 'Ontology';
  return 'Graph';
}
