'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Replace, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { AcoFirstTimeOverlay } from '@/components/ontology/AcoFirstTimeOverlay';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { WorkbenchChapterRenderer } from '@/components/workbench/chapter-renderer';
import { WorkbenchScopeProvider, useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { WorkbenchTabContent } from '@/components/workbench/workbench-tab-content';
import { WorkbenchTabs } from '@/components/workbench/workbench-tabs';
import { useAuth } from '@/lib/auth/auth-context';
import { isOnboardingComplete } from '@/lib/auth/onboarding-status';
import { useSituationStore } from '@/stores/situation-store';
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
    <WorkbenchScopeProvider caseId={caseId} activeTab={normalizeTab(activeTab)}>
      <WorkbenchCaseSurface activeTab={normalizeTab(activeTab)} openChapter={openChapter ?? null} />
    </WorkbenchScopeProvider>
  );
}

function WorkbenchCaseSurface({ activeTab, openChapter }: { activeTab: WorkspaceTabId | null; openChapter: string | null }) {
  const { situation, isExampleCase, caseModule } = useWorkbenchScope();
  const { user, analystProfile } = useAuth();
  const searchParams = useSearchParams();
  const showOnboardingBanner = Boolean(user && !user.isDemo && !isOnboardingComplete(analystProfile));
  const showDemoCopyBanner = !isExampleCase && searchParams.get('source') === 'demo';
  const [openTab, setOpenTab] = useState<WorkspaceTabId | null>(activeTab);

  return (
    <main className="min-h-screen bg-slate-50" data-testid="praxis-workspace-shell">
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
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Ask PRAXIS</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                  {isExampleCase ? 'Example case' : 'User case'}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {caseModule.manifest.domain}
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">{situation.name}</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-650">{caseModule.manifest.summary}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ContextHealthChip />
              <Link
                href="/app/write"
                className="inline-flex h-9 items-center rounded-md border border-diplomatic-blue/25 bg-white px-3 text-xs font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/5"
              >
                Write with PRAXIS
              </Link>
              <SituationCoreSwitcher currentSituationId={situation.id} />
            </div>
          </div>
        </div>
        <WorkbenchTabs activeTab={openTab} onOpen={setOpenTab} />
      </header>
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <WorkbenchChapterRenderer initialOpenChapter={openChapter} />
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

function SituationCoreSwitcher({ currentSituationId }: { currentSituationId: string }) {
  const router = useRouter();
  const situations = useSituationStore((state) => state.situations);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const [saving, setSaving] = useState(false);
  const hasUserSituations = situations.length > 0;

  async function switchSituation(nextId: string) {
    if (!nextId || nextId === currentSituationId) return;
    const next = situations.find((item) => item.id === nextId);
    setSaving(true);
    setActiveSituation(nextId);
    try {
      await fetch('/api/workspace/context-stack', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stackId: 'default',
          situationId: nextId,
          sourceIds: next?.sourceUrls ?? [],
          documentIds: next?.initialDocumentIds ?? [],
          outputGoal: 'Analysis memo',
        }),
      });
    } finally {
      setSaving(false);
      router.push(`/app/workbench/${encodeURIComponent(nextId)}`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <Replace className="h-3.5 w-3.5 text-gold-700" />
        <span className="hidden sm:inline">Situation Core</span>
        <select
          value={situations.some((item) => item.id === currentSituationId) ? currentSituationId : ''}
          onChange={(event) => void switchSituation(event.target.value)}
          disabled={!hasUserSituations || saving}
          className="h-8 min-w-[13rem] rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-navy-900 outline-none focus:border-navy-400 disabled:text-slate-400"
          aria-label="Change Situation Core"
        >
          <option value="">{hasUserSituations ? 'Choose Situation Core' : 'No user situations yet'}</option>
          {situations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <Link
        href="/app/situations/new"
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-navy-950 px-2.5 text-xs font-semibold text-white hover:bg-navy-800"
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </Link>
      <Link
        href="/app/contexts"
        className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-navy-800 hover:bg-white"
      >
        Manage
      </Link>
    </div>
  );
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
