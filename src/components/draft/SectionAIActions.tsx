'use client';

import { useState } from 'react';
import { FilePlus2, PenLine, Plus, Quote, Wand2 } from 'lucide-react';

export type DraftSectionAction = 'tighten' | 'rewrite' | 'add-citation' | 'add-scenario' | 'continue';

const ACTIONS: Array<{ id: DraftSectionAction; label: string; icon: typeof Wand2 }> = [
  { id: 'tighten', label: 'Tighten', icon: Wand2 },
  { id: 'rewrite', label: 'Rewrite', icon: PenLine },
  { id: 'add-citation', label: 'Add citation', icon: Quote },
  { id: 'add-scenario', label: 'Add scenario', icon: FilePlus2 },
  { id: 'continue', label: 'Continue', icon: Plus },
];

export function SectionAIActions({
  draftId,
  blockId,
  content,
  onApply,
}: {
  draftId: string;
  blockId: string;
  content: string;
  onApply: (next: string) => void;
}) {
  const [running, setRunning] = useState<DraftSectionAction | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(action: DraftSectionAction) {
    setRunning(action);
    setNote(null);
    const response = await fetch(`/api/draft/${encodeURIComponent(draftId)}/refine?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId,
        content,
        register: 'analytical',
        sourceReceiptId: 'context-source-1',
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setRunning(null);
    if (!response?.ok || !payload?.refinedContent) {
      setNote(payload?.error ?? 'Action unavailable');
      return;
    }
    onApply(payload.refinedContent);
    setNote(payload.diff ?? 'Section updated');
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            disabled={Boolean(running)}
            onClick={() => void run(action.id)}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon className="h-3.5 w-3.5" />
            {running === action.id ? 'Working' : action.label}
          </button>
        );
      })}
      {note ? <span className="text-xs font-medium text-slate-600">{note}</span> : null}
    </div>
  );
}
