import { describe, expect, it } from 'vitest';
import type { AgentRun } from '@/lib/agent-runtime/types';
import {
  buildCapsuleWorkerContext,
  mirrorAdkAgentEvent,
  mirrorGenkitFlowEvent,
  mirrorWorkerEvent,
} from '@/lib/agent-runtime/mirror';
import { mirrorAdkResearchMemoDryRun } from '@/lib/agent-runtime/adk-bridge';

const run: AgentRun = {
  id: 'run-1',
  agentSpecId: null,
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  contextStackId: 'default',
  contextPackageId: 'pack-1',
  selectedCoreIds: {
    userCoreId: 'user-core-1',
    teamCoreId: null,
    situationCoreId: 'situation-core-1',
    pathCoreId: 'foreign-policy',
    sourceCoreIds: ['source-1'],
    documentCoreIds: ['doc-1'],
    graphCoreId: 'graph-1',
    timeCoreId: 'time-1',
    outputCoreIds: ['memo'],
    toolCoreIds: ['grounded-research'],
    objectiveCoreIds: ['objective-1'],
    productCoreIds: ['options-memo'],
    memoryCoreId: 'memory-1',
  },
  status: 'running',
  triggerType: 'manual',
  objective: 'Draft a sourced options memo',
  traceId: 'trace-1',
  parentRunId: null,
  idempotencyKey: 'idem-1',
  maxStep: 20,
  maxSessionMinutes: 30,
  internalEstimatedCostCents: null,
  internalSpendCents: 0,
  metadata: {},
  createdAt: '2026-05-15T12:00:00.000Z',
  updatedAt: '2026-05-15T12:00:00.000Z',
  queuedAt: '2026-05-15T12:00:00.000Z',
  startedAt: '2026-05-15T12:00:01.000Z',
  completedAt: null,
  expiresAt: null,
};

describe('agent runtime mirror', () => {
  it('builds a minimal capsule worker context from a run', () => {
    expect(buildCapsuleWorkerContext(run)).toMatchObject({
      runId: 'run-1',
      capsuleId: 'cap-1',
      contextPackageId: 'pack-1',
      traceId: 'trace-1',
      objective: 'Draft a sourced options memo',
    });
  });

  it('mirrors PRAXIS worker phases with capsule pointers', async () => {
    const events: unknown[] = [];
    await mirrorWorkerEvent(run, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: 'Context ready.',
    }, {
      appendEvent: async (event) => {
        events.push(event);
        return event;
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      runId: 'run-1',
      eventType: 'praxis.context_resolved',
      traceId: 'trace-1',
      data: {
        substrate: 'praxis',
        capsuleId: 'cap-1',
        contextPackageId: 'pack-1',
      },
    });
  });

  it('normalizes Genkit flow events into ledger events', async () => {
    const events: unknown[] = [];
    await mirrorGenkitFlowEvent(run, {
      flowName: 'researchMemo',
      phase: 'started',
      schemaName: 'ResearchMemoDraft',
      toolId: 'policy-memo',
    }, {
      appendEvent: async (event) => {
        events.push(event);
        return event;
      },
    });

    expect(events[0]).toMatchObject({
      eventType: 'genkit.flow.started',
      data: {
        flowName: 'researchMemo',
        schemaName: 'ResearchMemoDraft',
        toolId: 'policy-memo',
      },
    });
  });

  it('normalizes ADK events without storing large text in the event headline', async () => {
    const events: unknown[] = [];
    await mirrorAdkAgentEvent(run, {
      eventType: 'research_step',
      author: 'section_researcher',
      phase: 'research',
      sessionId: 'session-1',
      text: '  This is a long streamed research update.  '.repeat(30),
    }, {
      appendEvent: async (event) => {
        events.push(event);
        return event;
      },
    });

    expect(events[0]).toMatchObject({
      eventType: 'adk.agent.research_step',
      data: {
        author: 'section_researcher',
        sessionId: 'session-1',
      },
    });
    expect((events[0] as { data: { textPreview: string } }).data.textPreview.length).toBeLessThanOrEqual(500);
  });

  it('mirrors Research Memo ADK bridge dry-run events without live Agent Engine execution', async () => {
    const previousAgentEngineId = process.env.VERTEX_AGENT_ENGINE_ID;
    process.env.VERTEX_AGENT_ENGINE_ID = 'configured-but-disabled';
    const events: unknown[] = [];

    try {
      const result = await mirrorAdkResearchMemoDryRun({
        run,
        agentKind: 'research_memo',
        objective: 'Draft a sourceable memo.',
        context: {
          userCore: 'User core summary.',
          situationCore: 'Situation core summary.',
          sourceCore: 'Source core summary.',
          outputCore: 'Output core summary.',
          memoryCore: 'Memory core summary.',
        },
        dispatchId: 'dispatch-1',
        attempt: 2,
      }, {
        appendEvent: async (event) => {
          events.push(event);
          return event;
        },
      });

      expect(result).toMatchObject({
        sessionId: 'adk-dry-run-run-1',
        eventCount: 4,
        liveExecution: 'disabled',
      });
      expect(events.map((event) => (event as { eventType: string }).eventType)).toEqual([
        'adk.research_memo.status',
        'adk.research_memo.tool_call',
        'adk.research_memo.text',
        'adk.research_memo.done',
      ]);
      expect(events.every((event) => (event as { data: { substrate: string } }).data.substrate === 'adk')).toBe(true);
      expect((events[0] as { data: { raw: Record<string, unknown> } }).data.raw).toMatchObject({
        dryRun: true,
        bridge: 'praxis-adk-bridge',
        liveExecution: 'disabled',
        agentEngineConfigured: true,
        dispatchId: 'dispatch-1',
        attempt: 2,
      });
      expect((events[1] as { message: string }).message).toContain('without invoking Agent Engine');
    } finally {
      if (previousAgentEngineId === undefined) {
        delete process.env.VERTEX_AGENT_ENGINE_ID;
      } else {
        process.env.VERTEX_AGENT_ENGINE_ID = previousAgentEngineId;
      }
    }
  });
});
