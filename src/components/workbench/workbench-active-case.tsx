'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { WorkbenchScopeProvider, useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { WorkbenchTabContent } from '@/components/workbench/workbench-tab-content';
import { WorkbenchTabs } from '@/components/workbench/workbench-tabs';
import type { WorkbenchTabId } from '@/types/workbench';

export function WorkbenchActiveCase({ caseId, activeTab }: { caseId: string; activeTab: WorkbenchTabId }) {
  return (
    <WorkbenchScopeProvider caseId={caseId} activeTab={activeTab}>
      <WorkbenchActiveCaseInner activeTab={activeTab} />
    </WorkbenchScopeProvider>
  );
}

function WorkbenchActiveCaseInner({ activeTab }: { activeTab: WorkbenchTabId }) {
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
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Scoped case
              </span>
            </div>
          </div>
        </div>
        <WorkbenchTabs activeTab={activeTab} />
      </header>
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <WorkbenchTabContent activeTab={activeTab} />
      </div>
    </main>
  );
}
