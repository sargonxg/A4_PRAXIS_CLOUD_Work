import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { DraftAppendixOption } from '@/lib/workbench/draft-assembly-state';

interface AppendixPickerProps {
  appendices: DraftAppendixOption[];
  selectedAppendixIds: string[];
  onToggleAppendix: (appendixId: string) => void;
}

export function AppendixPicker({ appendices, selectedAppendixIds, onToggleAppendix }: AppendixPickerProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Paperclip className="mt-0.5 h-5 w-5 text-gold-600" />
        <div>
          <h3 className="text-base font-semibold text-navy-950">Appendices</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Attach graph snapshots, ontology context, source receipts, and export metadata so the package can be checked after circulation.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {appendices.map((appendix) => {
          const selected = selectedAppendixIds.includes(appendix.id);
          return (
            <label
              key={appendix.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                selected ? 'border-diplomatic-blue bg-diplomatic-blue/5' : 'border-slate-200 bg-slate-50/70',
              )}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleAppendix(appendix.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-diplomatic-blue"
              />
              <span>
                <span className="block text-sm font-semibold text-navy-950">{appendix.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-700">{appendix.description}</span>
                <span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                  {appendix.kind}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
