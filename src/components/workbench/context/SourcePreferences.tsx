import { SOURCE_CATEGORIES } from '@/lib/constants/source-categories';
import type { ContextDraft } from '@/components/workbench/context/FrameEditor';

export function SourcePreferences({
  draft,
  onChange,
}: {
  draft: ContextDraft;
  onChange: (draft: ContextDraft) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Source URLs</span>
        <textarea
          value={draft.sources}
          onChange={(event) => onChange({ ...draft, sources: event.target.value })}
          placeholder="One source URL per line."
          className="min-h-24 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-navy-950 outline-none transition placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {SOURCE_CATEGORIES.slice(0, 8).map((source) => (
          <span key={source.id} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-800">
            {source.label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-700">
        Refresh-source and re-genesis jobs remain backend-owned follow-up work. This panel keeps the selected source scope explicit and saved with the case frame.
      </p>
    </div>
  );
}
