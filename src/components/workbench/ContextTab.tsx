'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { ActorClaimInterestRefiner } from '@/components/workbench/context/ActorClaimInterestRefiner';
import { DocumentUploadInline } from '@/components/workbench/context/DocumentUploadInline';
import { FrameEditor, type ContextDraft } from '@/components/workbench/context/FrameEditor';
import { ScopeAdvisory } from '@/components/workbench/context/ScopeAdvisory';
import { SourcePreferences } from '@/components/workbench/context/SourcePreferences';
import { OpenQuestionsPanel } from '@/components/workbench/desk/OpenQuestionsPanel';
import { SurfaceFactGrid, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchSurfaceState } from '@/lib/workbench/surface-state';

export function ContextTab() {
  const { caseId, caseModule, situation } = useWorkbenchScope();
  const surface = buildWorkbenchSurfaceState(caseModule, caseId);
  const storageKey = `praxis-context-draft:${caseId}`;
  const initialDraft = useMemo<ContextDraft>(() => ({
    whatHappening: situation.description,
    whyMatters: situation.contextNotes ?? caseModule.manifest.summary,
    whatWouldChange: '',
    policyQuestion: `${caseModule.manifest.name}: what should change the recommendation?`,
    notes: situation.contextNotes ?? '',
    sources: [
      ...(situation.sourceUrls ?? []),
      ...(situation.customSources ?? []).map((source) => source.url),
    ].join('\n'),
  }), [
    caseModule.manifest.name,
    caseModule.manifest.summary,
    situation.contextNotes,
    situation.customSources,
    situation.description,
    situation.sourceUrls,
  ]);
  const [draft, setDraft] = useState<ContextDraft>(initialDraft);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      setDraft(initialDraft);
      return;
    }
    try {
      setDraft({ ...initialDraft, ...JSON.parse(stored) });
    } catch {
      setDraft(initialDraft);
    }
  }, [initialDraft, storageKey]);

  async function saveDraft() {
    setSaving(true);
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    try {
      const response = await fetch(`/api/backend/tabs/context/situation-frame?case_id=${encodeURIComponent(caseId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          what_happening: draft.whatHappening,
          why_matters: draft.whyMatters,
          what_would_change: draft.whatWouldChange,
          policy_question: draft.policyQuestion,
          metadata: {
            notes: draft.notes,
            sources: draft.sources,
            reason: 'Saved from Context Tab',
          },
        }),
      });
      if (!response.ok) throw new Error('scope save failed');
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setSavedAt('local draft');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="workbench-context-surface">
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold-700" />
              <h2 className="text-lg font-semibold text-navy-950">Context Studio</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Shape the scope, source preferences, actor list, claims, and graph candidates before tools consume the case.
            </p>
          </div>
          <ContextHealthChip />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SurfaceSection eyebrow="Scope" title="Frame editor">
          <FrameEditor draft={draft} savedAt={savedAt} saving={saving} onChange={setDraft} onSave={() => void saveDraft()} />
        </SurfaceSection>

        <ScopeAdvisory questions={surface.openQuestions} />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <SurfaceSection eyebrow="Current context" title="Scope facts">
          <SurfaceFactGrid facts={surface.scopeFacts.slice(0, 2)} />
        </SurfaceSection>
        <SurfaceSection eyebrow="Sources" title="Preferences">
          <SourcePreferences draft={draft} onChange={setDraft} />
        </SurfaceSection>
        <SurfaceSection eyebrow="Documents" title="Upload handoff">
          <DocumentUploadInline caseId={caseId} />
        </SurfaceSection>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <SurfaceSection eyebrow="Graph candidates" title="Actors and claims">
          <ActorClaimInterestRefiner actors={situation.actors} questions={surface.openQuestions} />
        </SurfaceSection>
        <OpenQuestionsPanel caseId={caseId} fallbackQuestions={surface.openQuestions} />
      </section>
    </div>
  );
}
