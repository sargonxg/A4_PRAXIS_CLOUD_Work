import type {
  AgentRunApprovalSnapshot,
  AgentRunSnapshotSummary,
  AgentRunToolCallSnapshot,
} from '@/hooks/useAgentRunSnapshots';
import type { OrchestratorEvent } from '@/hooks/useOrchestratorEvents';

export type CompactRunPhaseId = 'plan' | 'act' | 'reflect' | 'source' | 'retrieve' | 'verify' | 'synthesize';
export type CompactRunPhaseStatus = 'pending' | 'active' | 'complete' | 'failed';

export type CompactRunTimelineViewModel = {
  runId: string | null;
  mode: 'standard' | 'research';
  collapsed: boolean;
  outputHref: string | null;
  latestLine: string;
  toolCallCount: number;
  pendingApprovalCount: number;
  pendingApprovals: AgentRunApprovalSnapshot[];
  phases: Array<{
    id: CompactRunPhaseId;
    label: string;
    status: CompactRunPhaseStatus;
  }>;
};

const STANDARD_PHASES: Array<{ id: CompactRunPhaseId; label: string }> = [
  { id: 'plan', label: 'Plan' },
  { id: 'act', label: 'Act' },
  { id: 'reflect', label: 'Reflect' },
];

const RESEARCH_PHASES: Array<{ id: CompactRunPhaseId; label: string }> = [
  { id: 'plan', label: 'Plan' },
  { id: 'source', label: 'Source' },
  { id: 'retrieve', label: 'Retrieve' },
  { id: 'verify', label: 'Verify' },
  { id: 'synthesize', label: 'Synthesize' },
];

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled', 'expired']);

export function buildCompactRunTimelineViewModel(input: {
  run: AgentRunSnapshotSummary | null;
  events: OrchestratorEvent[];
  toolCalls?: AgentRunToolCallSnapshot[];
  approvals?: AgentRunApprovalSnapshot[];
}): CompactRunTimelineViewModel {
  const run = input.run;
  const events = input.events;
  const toolCalls = input.toolCalls ?? [];
  const approvals = input.approvals ?? [];
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');
  const mode = inferTimelineMode(run, events);
  const phaseDefs = mode === 'research' ? RESEARCH_PHASES : STANDARD_PHASES;
  const phaseStatus = new Map<CompactRunPhaseId, CompactRunPhaseStatus>();
  for (const phase of phaseDefs) phaseStatus.set(phase.id, 'pending');

  for (const event of events) {
    for (const phase of phaseIdsFromEvent(event, mode)) {
      const next = event.type === 'fail' || run?.status === 'failed'
        ? 'failed'
        : event.type === 'complete' || isCompletionEvent(event)
          ? 'complete'
          : 'active';
      phaseStatus.set(phase, mergePhaseStatus(phaseStatus.get(phase) ?? 'pending', next));
    }
  }

  if (run?.status === 'succeeded') {
    for (const phase of phaseDefs) {
      if ((phaseStatus.get(phase.id) ?? 'pending') !== 'failed') phaseStatus.set(phase.id, 'complete');
    }
  }
  if (run?.status === 'waiting_approval') {
    const active = mode === 'research' ? 'verify' : 'act';
    phaseStatus.set(active, mergePhaseStatus(phaseStatus.get(active) ?? 'pending', 'active'));
  }
  if (run?.status === 'failed') {
    const lastActive = [...phaseDefs].reverse().find((phase) => (phaseStatus.get(phase.id) ?? 'pending') !== 'pending') ?? phaseDefs[0];
    phaseStatus.set(lastActive.id, 'failed');
  }

  const latest = [...events].reverse().find((event) => event.message || stringValue(event.data.phase) || event.rawType);
  return {
    runId: run?.runId ?? null,
    mode,
    collapsed: Boolean(run?.status && TERMINAL_STATUSES.has(run.status)),
    outputHref: run?.outputHref ?? null,
    latestLine: latest?.message ?? stringValue(latest?.data.phase) ?? latest?.rawType ?? runStatusLine(run?.status),
    toolCallCount: toolCalls.length,
    pendingApprovalCount: pendingApprovals.length,
    pendingApprovals,
    phases: phaseDefs.map((phase) => ({
      ...phase,
      status: phaseStatus.get(phase.id) ?? 'pending',
    })),
  };
}

function inferTimelineMode(run: AgentRunSnapshotSummary | null, events: OrchestratorEvent[]): CompactRunTimelineViewModel['mode'] {
  const haystack = [
    run?.policyAgentId,
    run?.policyAgentLabel,
    ...(run?.selectedTools ?? []),
    ...events.flatMap((event) => [event.rawType, stringValue(event.data.phase), event.message]),
  ].join(' ').toLowerCase();
  return /\bresearch-memo\b|deep-search-agent|research\.|grounding\.|sourceability\.|memo\.|synthesize/.test(haystack)
    ? 'research'
    : 'standard';
}

function phaseIdsFromEvent(event: OrchestratorEvent, mode: CompactRunTimelineViewModel['mode']): CompactRunPhaseId[] {
  const haystack = [
    event.rawType,
    stringValue(event.data.phase),
    stringValue(event.data.step),
    event.message,
  ].join(' ').toLowerCase();
  if (mode === 'research') {
    if (/triage|workflow|plan/.test(haystack)) return ['plan'];
    if (/source_gap|source\.|search_evidence_started/.test(haystack)) return ['source'];
    if (/retrieve|retrieval|grounding\.live|search_evidence_collected|tool\.grounded-search/.test(haystack)) return ['retrieve'];
    if (/verify|sourceability|claims_verified|approval/.test(haystack)) return ['verify'];
    if (/synthesize|memo\.|artifact|output|finalized|succeeded/.test(haystack)) return ['synthesize'];
    return [];
  }
  if (/triage|workflow|plan/.test(haystack)) return ['plan'];
  if (/act|tool|approval|running/.test(haystack)) return ['act'];
  if (/reflect|complete|artifact|output|succeeded/.test(haystack)) return ['reflect'];
  return [];
}

function mergePhaseStatus(current: CompactRunPhaseStatus, next: CompactRunPhaseStatus): CompactRunPhaseStatus {
  if (current === 'failed' || next === 'failed') return 'failed';
  if (current === 'complete' && next === 'active') return 'active';
  if (next === 'complete') return 'complete';
  if (next === 'active') return 'active';
  return current;
}

function isCompletionEvent(event: OrchestratorEvent): boolean {
  const haystack = [event.rawType, stringValue(event.data.phase), event.message].join(' ').toLowerCase();
  return /completed|succeeded|finalized|created/.test(haystack);
}

function runStatusLine(status: string | null | undefined): string {
  if (!status) return 'Waiting for run stream.';
  return `Run ${status.replace(/_/g, ' ')}.`;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
