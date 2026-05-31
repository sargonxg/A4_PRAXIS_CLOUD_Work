import { describe, expect, it } from 'vitest';
import { encodeSseEvents } from '@/app/api/agents/runs/[runId]/stream/route';
import type { AgentRunEvent } from '@/lib/agent-runtime/types';
import {
  agentRailStageFromEvent,
  normalizeOrchestratorEvent,
} from '@/hooks/useOrchestratorEvents';

describe('agent run SSE stream route helpers', () => {
  it('encodes ledger events as named SSE events', () => {
    const body = encodeSseEvents([
      {
        id: 'event-1',
        runId: 'run-1',
        ownerUid: 'user-1',
        capsuleId: 'cap-1',
        eventType: 'praxis.reasoning.plan',
        fromStatus: null,
        toStatus: null,
        message: 'Planning',
        data: { phase: 'plan' },
        traceId: 'trace-1',
        createdAt: '2026-05-15T12:00:00.000Z',
      } satisfies AgentRunEvent,
    ]);

    expect(body).toContain('id: event-1');
    expect(body).toContain('event: praxis.reasoning.plan');
    expect(body).toContain('"traceId":"trace-1"');
    expect(body).toContain(': end');
  });

  it('maps worker, tool, source, approval, complete, and fail events to stable rail labels', () => {
    const events = [
      normalizeOrchestratorEvent({ type: 'status_transition', data: JSON.stringify({ toStatus: 'running' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.reasoning.plan', data: JSON.stringify({ message: 'Plan' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.reasoning.act', data: JSON.stringify({ toolId: 'grounded-search' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.source.discovered', data: JSON.stringify({ sourceCount: 2 }) }),
      normalizeOrchestratorEvent({ type: 'praxis.approval_requested', data: JSON.stringify({ approvalId: 'approval-1' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.memo_output_created', data: JSON.stringify({ memoId: 'memo-1' }) }),
      normalizeOrchestratorEvent({ type: 'fail', data: JSON.stringify({ message: 'failed' }) }),
    ];

    expect(events.map(agentRailStageFromEvent)).toEqual([
      'Agent started',
      'Research plan',
      'Tool call',
      'Source discovery',
      'Approval gate',
      'Save output',
      'Failed',
    ]);
  });

  it('maps live research and sourceability proof events to compact rail labels', () => {
    const events = [
      normalizeOrchestratorEvent({ type: 'praxis.research.plan_created', data: JSON.stringify({ phase: 'research.plan_created' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.grounding.live_retrieval_started', data: JSON.stringify({ phase: 'grounding.live_retrieval_started', querySet: ['treaty analysis'] }) }),
      normalizeOrchestratorEvent({ type: 'praxis.tool.grounded-search.completed', data: JSON.stringify({ phase: 'tool.grounded-search.completed', toolId: 'grounded-search', risk: 'low', sourceReceiptIds: ['web-live-1'] }) }),
      normalizeOrchestratorEvent({ type: 'praxis.sourceability.claims_verified', data: JSON.stringify({ phase: 'sourceability.claims_verified', unsupportedClaimCount: 1 }) }),
      normalizeOrchestratorEvent({ type: 'praxis.memo.self_critique_completed', data: JSON.stringify({ phase: 'memo.self_critique_completed' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.artifact.finalized', data: JSON.stringify({ phase: 'artifact.finalized', outputHref: '/app?panel=memo&memoId=memo-1' }) }),
    ];

    expect(events.map(agentRailStageFromEvent)).toEqual([
      'Research plan',
      'Live retrieval',
      'Tool call',
      'Sourceability check',
      'Gap review',
      'Save output',
    ]);
  });
});
