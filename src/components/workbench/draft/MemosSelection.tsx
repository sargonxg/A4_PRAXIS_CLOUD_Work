import { FileText, Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { DraftMemoOption } from '@/lib/workbench/draft-assembly-state';

interface MemosSelectionProps {
  memoOptions: DraftMemoOption[];
  selectedMemoIds: string[];
  primaryMemoId: string;
  onToggleMemo: (memoId: string) => void;
  onSetPrimary: (memoId: string) => void;
}

export function MemosSelection({
  memoOptions,
  selectedMemoIds,
  primaryMemoId,
  onToggleMemo,
  onSetPrimary,
}: MemosSelectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 text-gold-600" />
        <div>
          <h3 className="text-base font-semibold text-navy-950">Memos Selection</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Choose the work products to assemble. The primary memo leads the briefing; selected memos become ordered sections.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {memoOptions.map((memo) => {
          const selected = selectedMemoIds.includes(memo.id);
          const primary = primaryMemoId === memo.id;
          return (
            <div
              key={memo.id}
              className={cn(
                'rounded-md border p-3 transition-colors',
                selected ? 'border-diplomatic-blue bg-diplomatic-blue/5' : 'border-slate-200 bg-slate-50/70',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleMemo(memo.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-diplomatic-blue"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-navy-950">{memo.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-700">{memo.description}</span>
                    <span className="mt-2 block text-[11px] font-medium text-slate-700">
                      {memo.versionLabel} · {memo.blocks.length} blocks · {memo.citationCount} citations
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  disabled={!selected}
                  onClick={() => onSetPrimary(memo.id)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                    primary
                      ? 'border-gold-500 bg-gold-100 text-gold-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-gold-400 disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  <Star className="h-3.5 w-3.5" />
                  {primary ? 'Primary' : 'Set primary'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
