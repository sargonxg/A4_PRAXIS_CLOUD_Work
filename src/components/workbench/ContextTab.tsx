'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Database, FileUp, GitBranchPlus, Save } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { SurfaceFactGrid, SurfaceQuestionList, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchSurfaceState } from '@/lib/workbench/surface-state';

interface ContextDraft {
  frame: string;
  notes: string;
  sources: string;
}

export function ContextTab() {
  const { caseId, caseModule, situation } = useWorkbenchScope();
  const surface = buildWorkbenchSurfaceState(caseModule, caseId);
  const storageKey = `praxis-context-draft:${caseId}`;
  const initialDraft = useMemo<ContextDraft>(() => ({
    frame: situation.description,
    notes: situation.contextNotes ?? '',
    sources: [
      ...(situation.sourceUrls ?? []),
      ...(situation.customSources ?? []).map((source) => source.url),
    ].join('\n'),
  }), [situation.contextNotes, situation.customSources, situation.description, situation.sourceUrls]);
  const [draft, setDraft] = useState<ContextDraft>(initialDraft);
  const [savedAt, setSavedAt] = useState<string | null>(null);

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

  function saveDraft() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Decision frame</span>
                <textarea
                  value={draft.frame}
                  onChange={(event) => setDraft((current) => ({ ...current, frame: event.target.value }))}
                  className="min-h-28 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Operator notes</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Assumptions, constraints, audience, and what would change the recommendation."
                  className="min-h-28 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Source URLs</span>
                <textarea
                  value={draft.sources}
                  onChange={(event) => setDraft((current) => ({ ...current, sources: event.target.value }))}
                  placeholder="One source URL per line."
                  className="min-h-24 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-5 text-slate-700">
                Drafts persist locally in this browser until the Firestore context-scope API is connected.
              </p>
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" />
                {savedAt ? `Saved ${savedAt}` : 'Save draft'}
              </button>
            </div>
          </div>
        </SurfaceSection>

        <SurfaceSection eyebrow="Advisory queue" title="Open questions">
          <SurfaceQuestionList questions={surface.openQuestions} />
        </SurfaceSection>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <SurfaceSection eyebrow="Current context" title="Scope facts">
          <SurfaceFactGrid facts={surface.scopeFacts.slice(0, 2)} />
        </SurfaceSection>
        <SurfaceSection eyebrow="Sources" title="Receipts and upload handoff">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <FileUp className="h-5 w-5 text-gold-700" />
            <p className="mt-3 text-sm font-semibold text-navy-950">{surface.sourceCount} source references</p>
            <p className="mt-1 text-sm leading-5 text-slate-700">Upload parsing, chunking, and embedding remain backend-owned. This surface keeps the operator-facing source scope ready.</p>
          </div>
        </SurfaceSection>
        <SurfaceSection eyebrow="Graph candidates" title="Actors and claims">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <GitBranchPlus className="h-5 w-5 text-gold-700" />
            <div className="mt-3 flex flex-wrap gap-2">
              {situation.actors.slice(0, 8).map((actor) => (
                <span key={actor} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-800">{actor}</span>
              ))}
              {situation.actors.length === 0 ? <span className="text-sm text-slate-700">No actors promoted yet.</span> : null}
            </div>
            <p className="mt-3 text-sm leading-5 text-slate-700">Graph writes remain proposal-first and review-gated; this keeps Pack 26 non-destructive.</p>
          </div>
        </SurfaceSection>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 text-gold-700" />
          <div>
            <p className="text-sm font-semibold text-navy-950">Context storage contract</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              The UI now distinguishes editable scope from tool execution. Durable Firestore/Postgres persistence and re-genesis jobs are tracked as backend follow-up work, not hidden behind a fake save.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
