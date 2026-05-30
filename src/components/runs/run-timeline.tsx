'use client';

import { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';

import { useAgentRunSnapshots } from '@/hooks/useAgentRunSnapshots';

export type RunTimelinePhase = 'plan' | 'source' | 'retrieve' | 'verify' | 'synthesize';

const PHASES: Array<{ id: RunTimelinePhase; label: string }> = [
  { id: 'plan', label: 'Plan' },
  { id: 'source', label: 'Source' },
  { id: 'retrieve', label: 'Retrieve' },
  { id: 'verify', label: 'Verify' },
  { id: 'synthesize', label: 'Synthesize' },
];

export function RunTimeline({
  runId,
  streamApi = '/api/ai/chat',
}: {
  runId: string | null | undefined;
  streamApi?: string;
}) {
  const snapshots = useAgentRunSnapshots(runId, { enabled: Boolean(runId), limit: 50 });
  const aiStream = useChat({
    id: runId ? `agent-run-${runId}` : undefined,
    api: streamApi,
    streamProtocol: 'data',
  });

  const phaseStatus = useMemo(() => {
    const byPhase = new Map<RunTimelinePhase, 'pending' | 'active' | 'complete' | 'failed'>();
    for (const phase of PHASES) byPhase.set(phase.id, 'pending');
    for (const event of snapshots.events) {
      const phase = phaseFromEvent(event.rawType, event.data);
      if (!phase) continue;
      byPhase.set(phase, event.type === 'fail' ? 'failed' : event.type === 'complete' ? 'complete' : 'active');
    }
    return byPhase;
  }, [snapshots.events]);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-3" aria-label="Agent run timeline">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Run timeline</h2>
          <p className="text-xs text-slate-500">
            {snapshots.isConnected ? 'Live Firestore stream connected.' : 'Waiting for run stream.'}
          </p>
        </div>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
          AI stream {aiStream.status}
        </span>
      </div>

      <ol className="mt-3 grid gap-2">
        {PHASES.map((phase) => {
          const status = phaseStatus.get(phase.id) ?? 'pending';
          return (
            <li key={phase.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
              <span className="text-sm font-medium text-slate-800">{phase.label}</span>
              <span className={statusClass(status)}>{status}</span>
            </li>
          );
        })}
      </ol>

      {snapshots.error ? <p className="mt-2 text-xs text-red-700">{snapshots.error}</p> : null}
      {aiStream.messages.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">{aiStream.messages.length} streamed message(s)</p>
      ) : null}
    </section>
  );
}

function phaseFromEvent(rawType: string | undefined, data: Record<string, unknown>): RunTimelinePhase | null {
  const haystack = [
    rawType,
    typeof data.phase === 'string' ? data.phase : '',
    typeof data.step === 'string' ? data.step : '',
    typeof data.message === 'string' ? data.message : '',
  ].join(' ').toLowerCase();
  return PHASES.find((phase) => haystack.includes(phase.id))?.id ?? null;
}

function statusClass(status: 'pending' | 'active' | 'complete' | 'failed'): string {
  if (status === 'complete') return 'rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700';
  if (status === 'failed') return 'rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700';
  if (status === 'active') return 'rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700';
  return 'rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500';
}
