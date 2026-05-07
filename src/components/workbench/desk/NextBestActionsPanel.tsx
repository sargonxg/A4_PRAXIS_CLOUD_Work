import { CheckCircle2, Radio, X } from 'lucide-react';
import { SurfaceActionList, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import type { WorkspaceOrchestratorEvent, WorkspaceOrchestratorStatus } from '@/hooks/useOrchestratorEvents';
import type { SurfaceAction } from '@/lib/workbench/surface-state';
import { cn } from '@/lib/utils/cn';

interface NextBestActionsPanelProps {
  actions: SurfaceAction[];
  events?: WorkspaceOrchestratorEvent[];
  streamStatus?: WorkspaceOrchestratorStatus;
  onConfirm?: (id: string) => Promise<boolean>;
  onDismiss?: (id: string) => Promise<void>;
}

interface SuggestionPayload {
  kind?: string;
  targetChapter?: string;
  title?: string;
  body?: string;
  confidence?: number | null;
  data?: Record<string, unknown>;
}

export function NextBestActionsPanel({
  actions,
  events = [],
  streamStatus = 'idle',
  onConfirm,
  onDismiss,
}: NextBestActionsPanelProps) {
  const suggestions = events
    .filter((event) => isSuggestionPayload(event.payload))
    .slice(0, 4);

  return (
    <SurfaceSection eyebrow="Next best actions" title="Recommended operating moves">
      <div className="mb-3 rounded-md border border-navy-200 bg-navy-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className={cn('h-4 w-4', streamStatus === 'working' ? 'text-emerald-700' : streamStatus === 'error' ? 'text-red-700' : 'text-navy-700')} />
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-900">
              Orchestrator queue
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
            {streamStatus}
          </span>
        </div>
        {suggestions.length ? (
          <div className="mt-3 space-y-2" data-testid="desk-orchestrator-suggestions">
            {suggestions.map((event) => {
              const payload = event.payload as SuggestionPayload;
              return (
                <article key={event.id} className="rounded-md border border-white bg-white p-3 shadow-sm shadow-navy-950/5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-navy-950">{payload.title || event.message}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-700">{payload.body || 'Case-aware suggestion from the workspace orchestrator.'}</p>
                    </div>
                    {typeof payload.confidence === 'number' ? (
                      <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-950">
                        {Math.round(payload.confidence * 100)}%
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { void onConfirm?.(event.id); }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => { void onDismiss?.(event.id); }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-navy-900"
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </button>
                    {payload.targetChapter ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-800">
                        {payload.targetChapter}
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-5 text-slate-700">
            Live suggestions will appear here as the Desk, Tabs, and chapter subgraphs write to the orchestrator log.
          </p>
        )}
      </div>
      <SurfaceActionList actions={actions} />
    </SurfaceSection>
  );
}

function isSuggestionPayload(payload: unknown): payload is SuggestionPayload {
  if (!payload || typeof payload !== 'object') return false;
  return (payload as SuggestionPayload).kind === 'suggestion';
}
