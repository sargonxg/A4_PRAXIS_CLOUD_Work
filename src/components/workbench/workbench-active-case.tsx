'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Bot, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { AcoFirstTimeOverlay } from '@/components/ontology/AcoFirstTimeOverlay';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { WorkbenchChapterRenderer } from '@/components/workbench/chapter-renderer';
import { WorkbenchScopeProvider, useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { WorkbenchTabContent } from '@/components/workbench/workbench-tab-content';
import { WorkbenchTabs } from '@/components/workbench/workbench-tabs';
import { PraxisWorkspaceShell } from '@/components/app/praxis-workspace-shell';
import { listExampleCases } from '@/lib/cases/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { useAuth } from '@/lib/auth/auth-context';
import { isOnboardingComplete } from '@/lib/auth/onboarding-status';
import type { WorkspaceTabId } from '@/types/workbench';

export function WorkbenchActiveCase({
  caseId,
  activeTab,
  openChapter,
}: {
  caseId: string;
  activeTab: string | null;
  openChapter?: string | null;
}) {
  return (
    <>
      <PraxisWorkspaceShell
        caseId={caseId}
        focusSection={mapFocusSection(activeTab, openChapter)}
        exampleCases={listExampleCases().map((caseModule) => ({
          id: caseModule.id,
          name: caseModule.manifest.name,
          region: caseModule.manifest.region,
          summary: caseModule.manifest.summary,
          risk: caseModule.manifest.risk,
          glaslStage: caseModule.manifest.glaslStage,
          tags: caseModule.manifest.tags,
        }))}
        marketplaceToolCount={MARKETPLACE_TOOLS.length}
      />
      <WorkbenchScopeProvider caseId={caseId} activeTab={normalizeTab(activeTab)}>
        <WorkbenchLegacySurface activeTab={normalizeTab(activeTab)} />
      </WorkbenchScopeProvider>
    </>
  );
}

function WorkbenchLegacySurface({ activeTab }: { activeTab: WorkspaceTabId | null }) {
  const { situation, isExampleCase, caseModule } = useWorkbenchScope();
  const { user, analystProfile } = useAuth();
  const searchParams = useSearchParams();
  const showOnboardingBanner = Boolean(user && !user.isDemo && !isOnboardingComplete(analystProfile));
  const showDemoCopyBanner = !isExampleCase && searchParams.get('source') === 'demo';
  const [openTab, setOpenTab] = useState<WorkspaceTabId | null>(activeTab);

  return (
    <main className="min-h-screen bg-slate-50">
      {user ? <AcoFirstTimeOverlay userKey={user.id} trigger="first-case-open" /> : null}
      <header className="border-b border-slate-200 bg-white">
        {showOnboardingBanner ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
            <span className="inline-flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Your analyst profile is incomplete. Hero tools may produce thin output.
            </span>
            <Link href="/onboarding" className="ml-2 font-semibold underline underline-offset-2">
              Complete onboarding
            </Link>
          </div>
        ) : null}
        {showDemoCopyBanner ? (
          <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-950">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Demo case copied to your workspace. You can now edit the case, run tools, save memos, and export products.
            </span>
          </div>
        ) : null}
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
        <WorkbenchTabs activeTab={openTab} onOpen={setOpenTab} />
      </header>
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <WorkbenchChapterRenderer />
      </div>
      {openTab ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/45 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
          <section className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1440px] rounded-lg border border-slate-200 bg-slate-50 shadow-2xl sm:min-h-[calc(100vh-3rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">Workspace tab</p>
                <h2 className="text-base font-semibold text-navy-950">{activeTabLabel(openTab)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenTab(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-navy-800 hover:border-navy-300"
                aria-label="Close workspace tab"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <WorkbenchTabContent activeTab={openTab} />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function mapFocusSection(activeTab: string | null, openChapter?: string | null) {
  if (openChapter === 'memos' || openChapter === 'draft') return 'draft';
  if (openChapter === 'research') return 'sources';
  if (openChapter === 'graph') return 'summary';
  if (activeTab === 'library' || activeTab === 'context') return 'cores';
  if (activeTab === 'graph') return 'summary';
  return null;
}

function normalizeTab(value: string | null): WorkspaceTabId | null {
  if (value === 'context' || value === 'library' || value === 'ontology' || value === 'graph') return value;
  return null;
}

function activeTabLabel(tab: WorkspaceTabId): string {
  if (tab === 'context') return 'Context';
  if (tab === 'library') return 'Library';
  if (tab === 'ontology') return 'Ontology';
  return 'Graph';
}
