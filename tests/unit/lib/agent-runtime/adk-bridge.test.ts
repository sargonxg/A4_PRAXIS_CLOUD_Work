import { describe, expect, it } from 'vitest';
import {
  buildAdkPromptFromContextCapsule,
  mapAdkEventToPraxisRunEvent,
  validateAdkRunAllowed,
  type AdkRunInput,
} from '@/lib/agent-runtime/adk-bridge';
import type { AgentRun } from '@/lib/agent-runtime/types';

function makeRun(overrides: Partial<AgentRun> = {}): AgentRun {
  return {
    id: 'run-1',
    agentSpecId: null,
    ownerUid: 'user-1',
    capsuleId: 'capsule-1',
    contextStackId: 'default',
    contextPackageId: 'package-1',
    selectedCoreIds: {
      userCoreId: 'user-core-1',
      teamCoreId: null,
      situationCoreId: 'situation-core-1',
      pathCoreId: 'path-core-1',
      sourceCoreIds: ['source-core-1'],
      documentCoreIds: [],
      graphCoreId: null,
      timeCoreId: 'time-core-1',
      outputCoreIds: ['output-core-1'],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: 'memory-core-1',
    },
    status: 'running',
    triggerType: 'manual',
    objective: 'Draft a research memo.',
    traceId: 'trace-1',
    parentRunId: null,
    idempotencyKey: 'idem-1',
    maxStep: 20,
    maxSessionMinutes: 30,
    internalEstimatedCostCents: 999,
    internalSpendCents: 123,
    metadata: {},
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    queuedAt: '2026-05-15T12:00:00.000Z',
    startedAt: '2026-05-15T12:01:00.000Z',
    completedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

function makeInput(overrides: Partial<AdkRunInput> = {}): AdkRunInput {
  return {
    run: makeRun(),
    agentKind: 'research_memo',
    objective: 'Draft a sourceable research memo.',
    context: {
      userCore: 'User is a foreign policy analyst writing for a principal.',
      situationCore: 'Situation concerns sanctions posture and humanitarian access.',
      sourceCore: 'Sources include UN note src-1 and ReliefWeb update src-2.',
      outputCore: 'Output should be a memo with evidence gaps and cautious recommendations.',
      memoryCore: 'Prefer diplomatic language and source caveats.',
    },
    ...overrides,
  };
}

describe('ADK bridge contract', () => {
  it('maps ADK text, status, and tool events into PRAXIS run events', () => {
    const run = makeRun();
    const textEvent = mapAdkEventToPraxisRunEvent({
      run,
      agentKind: 'research_memo',
      event: { type: 'text', text: 'Drafting the memo body.', author: 'memo_writer', phase: 'synthesis' },
      sessionId: 'session-1',
      createdAt: new Date('2026-05-15T12:05:00.000Z'),
    });
    const statusEvent = mapAdkEventToPraxisRunEvent({
      run,
      agentKind: 'research_memo',
      event: { type: 'status', message: 'Planning source review.', phase: 'planning' },
    });
    const toolEvent = mapAdkEventToPraxisRunEvent({
      run,
      agentKind: 'research_memo',
      event: { type: 'tool_call', toolName: 'sourceability', toolRisk: 'medium', message: 'Check claim support.' },
    });

    expect(textEvent).toMatchObject({
      runId: 'run-1',
      capsuleId: 'capsule-1',
      eventType: 'adk.research_memo.text',
      traceId: 'trace-1',
      data: { substrate: 'adk', agentKind: 'research_memo', author: 'memo_writer', sessionId: 'session-1' },
    });
    expect(textEvent.data).not.toHaveProperty('internalEstimatedCostCents');
    expect(statusEvent.eventType).toBe('adk.research_memo.status');
    expect(toolEvent).toMatchObject({
      eventType: 'adk.research_memo.tool_call',
      data: { toolName: 'sourceability', toolRisk: 'medium' },
    });
  });

  it('rejects missing capsule id', () => {
    expect(() => validateAdkRunAllowed(makeInput({ run: makeRun({ capsuleId: '' }) })))
      .toThrow('ADK run requires a capsule id.');
  });

  it('rejects high-risk action without approval', () => {
    expect(() => validateAdkRunAllowed(makeInput({ requestedActionRisk: 'high' })))
      .toThrow('High-risk ADK action requires approval before execution.');
  });

  it('builds prompt with user, situation, source, and output context', () => {
    const prompt = buildAdkPromptFromContextCapsule(makeInput());

    expect(prompt).toContain('Capsule id: capsule-1');
    expect(prompt).toContain('<user-core>');
    expect(prompt).toContain('foreign policy analyst');
    expect(prompt).toContain('<situation-core>');
    expect(prompt).toContain('sanctions posture');
    expect(prompt).toContain('<source-core>');
    expect(prompt).toContain('ReliefWeb');
    expect(prompt).toContain('<output-core>');
    expect(prompt).toContain('evidence gaps');
  });

  it('does not expose internal cost fields in prompt or event data', () => {
    const input = makeInput();
    const prompt = buildAdkPromptFromContextCapsule(input);
    const event = mapAdkEventToPraxisRunEvent({
      run: input.run,
      agentKind: 'daily_brief',
      event: { type: 'done', message: 'Done.' },
    });

    expect(prompt).not.toContain('999');
    expect(prompt).not.toContain('internalEstimatedCostCents');
    expect(JSON.stringify(event.data)).not.toContain('internalSpendCents');
    expect(JSON.stringify(event.data)).not.toContain('123');
  });
});
