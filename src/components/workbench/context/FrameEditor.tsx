'use client';

import { Save } from 'lucide-react';

export interface ContextDraft {
  whatHappening: string;
  whyMatters: string;
  whatWouldChange: string;
  policyQuestion: string;
  notes: string;
  sources: string;
}

export function FrameEditor({
  draft,
  savedAt,
  saving,
  onChange,
  onSave,
}: {
  draft: ContextDraft;
  savedAt: string | null;
  saving: boolean;
  onChange: (draft: ContextDraft) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">What is happening?</span>
          <textarea
            value={draft.whatHappening}
            onChange={(event) => onChange({ ...draft, whatHappening: event.target.value })}
            placeholder="200-600 chars: the facts, actors, and current movement."
            className="min-h-24 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Why does it matter?</span>
          <textarea
            value={draft.whyMatters}
            onChange={(event) => onChange({ ...draft, whyMatters: event.target.value })}
            placeholder="What decision, risk, mandate, negotiation, or audience depends on this?"
            className="min-h-24 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">What would change the assessment?</span>
          <textarea
            value={draft.whatWouldChange}
            onChange={(event) => onChange({ ...draft, whatWouldChange: event.target.value })}
            placeholder="The falsifier, red line, trigger, or collection priority."
            className="min-h-24 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Policy question</span>
          <textarea
            value={draft.policyQuestion}
            onChange={(event) => onChange({ ...draft, policyQuestion: event.target.value })}
            placeholder="The question PRAXIS should keep optimizing the workspace around."
            className="min-h-20 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Operator notes</span>
          <textarea
            value={draft.notes}
            onChange={(event) => onChange({ ...draft, notes: event.target.value })}
            placeholder="Assumptions, constraints, audience, and what would change the recommendation."
            className="min-h-28 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-5 text-slate-700">
          Saves through the owner-scoped Context Studio API when authenticated; local draft fallback remains available for demos.
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : savedAt ? `Saved ${savedAt}` : 'Save scope'}
        </button>
      </div>
    </div>
  );
}
