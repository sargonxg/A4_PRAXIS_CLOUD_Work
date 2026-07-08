'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';
import { cn } from '@/lib/utils/cn';

const statusPriority: Record<string, number> = {
  active: 6,
  queued: 5,
  warn: 4,
  failed: 4,
  complete: 3,
  skipped: 2,
  pending: 1,
};

export function AgentsWorkingStrip({
  events,
  streaming,
  runId,
  envelope,
  reduceMotion = false,
}: {
  events?: AskOrchestrationStatusEvent[] | AskOrchestrationStatusEvent | null;
  streaming: boolean;
  runId?: string | null;
  envelope?: AskAnswerEnvelope;
  reduceMotion?: boolean;
}) {
  const steps = normalizeEvents(events);
  if (!steps.length) return null;

  const durableRunId = safeRunId(runId)
    ?? safeRunId(steps.find((event) => event.runId)?.runId)
    ?? safeRunId(envelope?.orchestrationReceipt?.supervisor?.queuedRun?.runId);

  if (streaming) {
    const activeEvent = latestMeaningfulEvent(steps);
    if (!activeEvent) return null;
    return (
      <section
        aria-live="polite"
        data-testid="agents-working-strip"
        className="mb-2 flex min-h-8 max-w-full items-center gap-2 overflow-hidden rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-2.5 py-1.5 text-xs text-navy-900"
      >
        <span
          aria-hidden="true"
          className={cn(
            'h-2 w-2 shrink-0 rounded-full bg-emerald-500',
            !reduceMotion && (activeEvent.status === 'active' || activeEvent.status === 'queued') ? 'animate-pulse' : '',
          )}
        />
        <span className="min-w-0 flex-1 truncate font-semibold">
          {narrateEvent(activeEvent)}
        </span>
        {durableRunId ? <RunLink runId={durableRunId} compact /> : null}
      </section>
    );
  }

  const visibleSteps = steps.filter((event) => event.status !== 'pending');
  if (!visibleSteps.length) return null;
  const toolCallCount = countTools(visibleSteps, envelope);
  const approvalGateCount = countApprovalGates(visibleSteps, envelope);
  return (
    <details
      data-testid="agents-working-summary"
      className="mb-2 rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-2.5 py-1.5 text-xs text-navy-900"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="min-w-0 flex-1 truncate">
          How this was made: {visibleSteps.length} step{visibleSteps.length === 1 ? '' : 's'}
          {toolCallCount ? `, ${toolCallCount} tool call${toolCallCount === 1 ? '' : 's'}` : ''}
          {approvalGateCount ? `, ${approvalGateCount} approval gate${approvalGateCount === 1 ? '' : 's'}` : ''}
        </span>
        {durableRunId ? <RunLink runId={durableRunId} /> : null}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      </summary>
      <ol className="mt-2 space-y-1.5" data-testid="agents-working-step-list">
        {visibleSteps.map((event) => (
          <li key={event.id} className="flex min-w-0 gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
            <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', dotClass(event.status))} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-semibold text-navy-950">{event.label}</span>
              <span className="block text-[11px] leading-4 text-slate-600">{event.detail || 'Agents working...'}</span>
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function normalizeEvents(events: AskOrchestrationStatusEvent[] | AskOrchestrationStatusEvent | null | undefined): AskOrchestrationStatusEvent[] {
  if (!events) return [];
  return (Array.isArray(events) ? events : [events]).filter((event) => {
    return Boolean(event?.type === 'orchestrationStatus' && event.id && event.label);
  });
}

function latestMeaningfulEvent(events: AskOrchestrationStatusEvent[]): AskOrchestrationStatusEvent | null {
  const candidates = events.filter((event) => event.status !== 'pending' && event.status !== 'skipped');
  const pool = candidates.length ? candidates : events.filter((event) => event.status !== 'pending');
  if (!pool.length) return null;
  return pool.reduce((best, event) => {
    const bestPriority = statusPriority[best.status] ?? 0;
    const eventPriority = statusPriority[event.status] ?? 0;
    return eventPriority >= bestPriority ? event : best;
  });
}

function narrateEvent(event: AskOrchestrationStatusEvent): string {
  const detail = event.detail?.trim() || 'Agents working...';
  const extras = [
    event.agentLabel ? event.agentLabel : null,
    typeof event.sourceCount === 'number' ? `${event.sourceCount} source${event.sourceCount === 1 ? '' : 's'}` : null,
    event.selectedToolIds?.length ? `${event.selectedToolIds.length} tool call${event.selectedToolIds.length === 1 ? '' : 's'}` : null,
    typeof event.approvalGateCount === 'number' ? `${event.approvalGateCount} approval gate${event.approvalGateCount === 1 ? '' : 's'}` : null,
    event.groundingPosture ? event.groundingPosture : null,
  ].filter(Boolean);
  return `${event.label}: ${detail}${extras.length ? ` (${extras.join(', ')})` : ''}`;
}

function countTools(events: AskOrchestrationStatusEvent[], envelope?: AskAnswerEnvelope): number {
  const fromEvents = Math.max(0, ...events.map((event) => event.selectedToolIds?.length ?? 0));
  return Math.max(fromEvents, envelope?.orchestrationReceipt?.toolRouting.selectedToolIds.length ?? 0);
}

function countApprovalGates(events: AskOrchestrationStatusEvent[], envelope?: AskAnswerEnvelope): number {
  const fromEvents = Math.max(0, ...events.map((event) => event.approvalGateCount ?? 0));
  return Math.max(fromEvents, envelope?.orchestrationReceipt?.toolRouting.approvalRequiredToolIds.length ?? 0);
}

function safeRunId(value: string | null | undefined): string | null {
  if (!value || value === 'unavailable') return null;
  return value;
}

function RunLink({ runId, compact = false }: { runId: string; compact?: boolean }) {
  return (
    <Link
      href={`/agents/${encodeURIComponent(runId)}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50"
    >
      {compact ? 'Run' : 'Open run'}
      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
    </Link>
  );
}

function dotClass(status: AskOrchestrationStatusEvent['status']): string {
  if (status === 'complete') return 'bg-emerald-500';
  if (status === 'active' || status === 'queued') return 'bg-diplomatic-blue';
  if (status === 'warn') return 'bg-gold-500';
  if (status === 'failed') return 'bg-rose-600';
  if (status === 'skipped') return 'bg-slate-400';
  return 'bg-slate-300';
}
