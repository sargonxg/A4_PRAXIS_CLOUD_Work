'use client';

import { Save } from 'lucide-react';

export interface ContextDraft {
  frame: string;
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Decision frame</span>
          <textarea
            value={draft.frame}
            onChange={(event) => onChange({ ...draft, frame: event.target.value })}
            className="min-h-28 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
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
