'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenText, FileQuestion, FolderKanban, GitBranch, Search, SquareArrowOutUpRight } from 'lucide-react';
import type { CoreKind } from '@/lib/tools/contract';
import type { WorkbenchTabId } from '@/types/workbench';
import { inferResponseActionKinds, type ResponseActionKind } from '@/lib/assistant/response-action-kinds';

export interface Citation {
  id: string;
  label?: string;
  url?: string;
}

export interface GraphDelta {
  summary: string;
  payload?: Record<string, unknown>;
}

export type ResponseAction =
  | { kind: 'save_to_write'; payload: { situationId: string; text: string; citations: Citation[] } }
  | { kind: 'cite_as_gap'; payload: { situationId: string; question: string } }
  | { kind: 'attach_to_core'; payload: { situationId: string; coreKind: CoreKind; content: string } }
  | { kind: 'run_deep_research'; payload: { situationId: string; question: string } }
  | { kind: 'open_in_workbench'; payload: { situationId: string; tab: WorkbenchTabId } }
  | { kind: 'propose_graph_edit'; payload: { situationId: string; delta: GraphDelta } };

interface ResponseActionsProps {
  message: {
    id?: string;
    content: string;
    availableActions?: ResponseActionKind[];
  };
  situation?: {
    id?: string;
    name?: string;
  } | null;
  question?: string;
  onProposeGraphEdit?: () => void;
}

const ACTION_META: Record<ResponseActionKind, {
  label: string;
  icon: typeof BookOpenText;
}> = {
  save_to_write: { label: 'Save to Write', icon: BookOpenText },
  cite_as_gap: { label: 'Cite as gap', icon: FileQuestion },
  attach_to_core: { label: 'Attach to Core', icon: FolderKanban },
  run_deep_research: { label: 'Run deep research', icon: Search },
  open_in_workbench: { label: 'Open in workbench', icon: SquareArrowOutUpRight },
  propose_graph_edit: { label: 'Propose graph edit', icon: GitBranch },
};

export function ResponseActions({
  message,
  situation,
  question,
  onProposeGraphEdit,
}: ResponseActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const situationId = situation?.id ?? 'syria-2026';
  const actions = useMemo(() => {
    const inferred = message.availableActions?.length ? message.availableActions : inferResponseActionKinds(message.content);
    return inferred.filter((action, index) => inferred.indexOf(action) === index).slice(0, 5);
  }, [message.availableActions, message.content]);

  if (!message.content.trim() || actions.length === 0) return null;

  async function runAction(kind: ResponseActionKind) {
    setStatus(null);
    try {
      if (kind === 'save_to_write') {
        const response = await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: situationId,
            templateId: 'policy-memo',
            title: `Ask PRAXIS note: ${situation?.name ?? 'Situation'}`,
            graphSnapshotId: `ask-praxis-${message.id ?? 'response'}`,
            changeNote: 'Saved from Ask PRAXIS response action.',
            blocks: [
              { id: 'ask-heading', type: 'heading', content: 'Ask PRAXIS answer', citations: [], metadata: { source: 'ask-praxis' } },
              { id: 'ask-answer', type: 'paragraph', content: message.content, citations: [], metadata: { source: 'ask-praxis' } },
            ],
          }),
        });
        const data = response.ok ? await response.json().catch(() => ({})) : {};
        setStatus('Saved to Write');
        router.push(`/app/write?draftId=${encodeURIComponent(data.memo?.id ?? 'policy-memo')}&situationId=${encodeURIComponent(situationId)}`);
        return;
      }

      if (kind === 'cite_as_gap') {
        await fetch(`/api/situations/${encodeURIComponent(situationId)}/open-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question || extractFirstLine(message.content), source: 'ask-praxis' }),
        });
        setStatus('Gap saved');
        return;
      }

      if (kind === 'attach_to_core') {
        await fetch(`/api/situations/${encodeURIComponent(situationId)}/cores/situation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message.content, source: 'ask-praxis' }),
        });
        setStatus('Attached to Situation Core');
        return;
      }

      if (kind === 'run_deep_research') {
        window.dispatchEvent(
          new CustomEvent('open-praxis-chat', {
            detail: { prompt: `Run deep research on: ${question || extractFirstLine(message.content)}` },
          }),
        );
        setStatus('Deep research queued');
        return;
      }

      if (kind === 'propose_graph_edit') {
        onProposeGraphEdit?.();
        setStatus('Use the graph proposal card above');
        return;
      }

      router.push(`/app/workbench/${encodeURIComponent(situationId)}?tab=context`);
      setStatus('Opening workbench');
    } catch {
      setStatus('Action failed');
    }
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <div className="flex flex-wrap gap-1.5">
        {actions.map((kind) => {
          const meta = ACTION_META[kind];
          const Icon = meta.icon;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => void runAction(kind)}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 bg-navy-900/70 px-2.5 py-1 text-[11px] font-medium text-navy-100 transition hover:border-gold-500/50 hover:text-gold-200"
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </button>
          );
        })}
      </div>
      {status ? <p className="mt-1.5 text-[10px] text-gold-200">{status}</p> : null}
    </div>
  );
}

function extractFirstLine(text: string): string {
  return text.split('\n').find((line) => line.trim())?.trim().slice(0, 240) || 'Follow up on this Ask PRAXIS answer.';
}
