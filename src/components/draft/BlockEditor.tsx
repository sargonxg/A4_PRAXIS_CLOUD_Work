'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';
import { InlineCitation } from '@/components/draft/InlineCitation';
import { SectionAIActions } from '@/components/draft/SectionAIActions';
import type { DraftShellBlock } from '@/lib/draft/api';

export function BlockEditor({ draftId, blocks }: { draftId: string; blocks: DraftShellBlock[] }) {
  const [editableBlocks, setEditableBlocks] = useState(blocks);
  const groundedCount = useMemo(() => editableBlocks.filter((block) => block.evidenceState === 'grounded').length, [editableBlocks]);

  useEffect(() => {
    function handleAutoFill(event: Event) {
      const detail = (event as CustomEvent<{
        draftId: string;
        blocks: Array<{ id: string; title: string; content: string; citations: string[]; reviewRequired: boolean }>;
      }>).detail;
      if (!detail || detail.draftId !== draftId) return;
      setEditableBlocks((current) => current.map((block) => {
        const generated = detail.blocks.find((item) => item.id === block.id);
        if (!generated) return block;
        return {
          ...block,
          title: generated.title,
          body: generated.content,
          evidenceState: generated.citations.length > 0 ? 'grounded' : 'placeholder',
        };
      }));
    }
    window.addEventListener('draft:auto-fill', handleAutoFill);
    return () => window.removeEventListener('draft:auto-fill', handleAutoFill);
  }, [draftId]);

  return (
    <section className="grid gap-4">
      <div className="border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Editor</h2>
            <p className="mt-1 text-sm leading-6 text-slate-650">
              Edit sections, run focused refinements, and keep citations visible before export.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {groundedCount} section{groundedCount === 1 ? '' : 's'} grounded
          </span>
        </div>
      </div>

      {editableBlocks.map((block) => (
        <article key={block.id} className="border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor={`draft-block-${block.id}`} className="text-sm font-semibold text-slate-950">{block.title}</label>
            <EvidenceBadge state={block.evidenceState} />
          </div>
          <textarea
            id={`draft-block-${block.id}`}
            value={block.body}
            onChange={(event) => {
              const body = event.target.value;
              setEditableBlocks((current) => current.map((item) => (item.id === block.id ? { ...item, body } : item)));
            }}
            className="mt-3 min-h-36 w-full resize-y border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-500"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <InlineCitation label="1" sourceId="context-source-1" />
            {block.evidenceState === 'grounded' ? <InlineCitation label="2" sourceId="context-graph-snapshot" confidence={0.78} /> : null}
          </div>
          <SectionAIActions
            draftId={draftId}
            blockId={block.id}
            content={block.body}
            onApply={(body) => setEditableBlocks((current) => current.map((item) => (item.id === block.id ? { ...item, body, evidenceState: 'grounded' } : item)))}
          />
        </article>
      ))}
    </section>
  );
}

function EvidenceBadge({ state }: { state: DraftShellBlock['evidenceState'] }) {
  if (state === 'grounded') {
    return <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Context grounded</span>;
  }
  if (state === 'needs-context') {
    return (
      <span className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
        <CircleAlert className="h-3.5 w-3.5" />
        Needs context
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
      <Sparkles className="h-3.5 w-3.5" />
      Template placeholder
    </span>
  );
}
