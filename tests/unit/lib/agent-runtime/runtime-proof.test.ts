import { describe, expect, it } from 'vitest';
import { buildAgentRunTask, makeAgentRunDispatchPayload } from '@/lib/agent-runtime/cloud-tasks';
import { CreateManualAgentRunRequestSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';
import { normalizeCreateAgentRunInput } from '@/lib/agent-runtime/state';
import { executeAgentRun } from '@/lib/agent-runtime/worker';
import { encodeSseEvents } from '@/app/api/agents/runs/[runId]/stream/route';
import type { AgentApproval, AgentRun, AgentRunEvent, AgentToolCall, CreateAgentRunInput } from '@/lib/agent-runtime/types';

describe('agent runtime proof smoke', () => {
  it('proves the create -> dispatch -> execute -> stream -> output receipt path with in-memory doubles', async () => {
    const request = CreateManualAgentRunRequestSchema.parse({
      capsuleId: 'cap-1',
      contextPackageId: 'pack-1',
      policyAgentId: 'research-memo',
      outputDestination: 'memo_studio',
      objective: 'Draft a source-backed options memo for the active capsule.',
      traceId: 'trace-runtime-proof',
      idempotencyKey: 'runtime-proof-idempotency-key',
      selectedCoreIds: {
        situationCoreId: 'situation-core-1',
        sourceCoreIds: ['source-1'],
        documentCoreIds: ['doc-1'],
        outputCoreIds: ['options-memo'],
      },
    });
    const normalized = normalizeCreateAgentRunInput({
      ownerUid: 'user-1',
      capsuleId: request.capsuleId ?? 'cap-1',
      contextStackId: request.contextStackId ?? request.capsuleId ?? null,
      contextPackageId: request.contextPackageId ?? null,
      selectedCoreIds: request.selectedCoreIds,
      agentSpecId: request.agentSpecId ?? null,
      triggerType: request.triggerType,
      objective: request.objective,
      traceId: request.traceId,
      parentRunId: request.parentRunId ?? null,
      idempotencyKey: request.idempotencyKey,
      maxStep: request.maxStep,
      maxSessionMinutes: request.maxSessionMinutes,
      internalEstimatedCostCents: request.internalEstimatedCostCents ?? null,
      metadata: {
        policyAgentId: request.policyAgentId,
        outputDestination: request.outputDestination,
        executionMode: 'queued-only',
      },
    } satisfies CreateAgentRunInput);
    let run = makeRun('queued', normalized);

    expect(toAgentRunOutput(run)).toMatchObject({
      runId: 'run-runtime-proof',
      status: 'queued',
      policyAgentId: 'research-memo',
      policyAgentLabel: 'Research Memo Agent',
      readiness: 'live',
      outputDestination: 'memo_studio',
    });

    const dispatchPayload = makeAgentRunDispatchPayload({
      runId: run.id,
      ownerUid: run.ownerUid,
      capsuleId: run.capsuleId,
      traceId: run.traceId,
      dispatchId: 'dispatch-runtime-proof',
      requestedAt: new Date('2026-05-17T12:00:00.000Z'),
    });
    const task = buildAgentRunTask({
      payload: dispatchPayload,
      targetUrl: 'https://praxis.tacitus.me/api/agents/runs/run-runtime-proof/execute',
      serviceAccountEmail: 'praxis-agents-sa@praxisbytacitus.iam.gserviceaccount.com',
    });
    expect(JSON.parse(Buffer.from(task.httpRequest.body, 'base64').toString('utf8'))).toMatchObject({
      runId: 'run-runtime-proof',
      traceId: 'trace-runtime-proof',
      dispatchId: 'dispatch-runtime-proof',
    });
    expect(task.httpRequest.oidcToken?.audience).toBe('https://praxis.tacitus.me/api/agents/runs/run-runtime-proof/execute');

    const events: AgentRunEvent[] = [];
    const toolCalls: AgentToolCall[] = [];
    const approvals: AgentApproval[] = [];
    const result = await executeAgentRun(dispatchPayload, {
      getRun: async () => run,
      updateStatus: async (input) => {
        run = {
          ...run,
          status: input.toStatus,
          updatedAt: '2026-05-17T12:00:01.000Z',
          startedAt: input.toStatus === 'running' ? '2026-05-17T12:00:01.000Z' : run.startedAt,
          completedAt: input.toStatus === 'succeeded' ? '2026-05-17T12:00:02.000Z' : run.completedAt,
        };
        events.push({
          id: `status-${input.toStatus}`,
          runId: run.id,
          ownerUid: run.ownerUid,
          capsuleId: run.capsuleId,
          eventType: 'status_transition',
          fromStatus: null,
          toStatus: input.toStatus,
          message: input.message ?? null,
          data: input.data ?? {},
          traceId: run.traceId,
          createdAt: run.updatedAt,
        });
        return run;
      },
      appendEvent: async (event) => {
        events.push(event);
        return event;
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push(toolCall);
        return toolCall;
      },
      appendApproval: async (approval) => {
        approvals.push(approval);
        return approval;
      },
      buildEvidencePack: async () => ({
        packId: 'evidence-runtime-proof',
        ownerUid: run.ownerUid,
        capsuleId: run.capsuleId,
        objective: run.objective,
        builtAt: '2026-05-17T12:00:01.000Z',
        activeCapsule: { capsuleId: run.capsuleId, version: 1 } as never,
        knowledgeDocuments: [{ documentId: 'doc-1', title: 'Evidence document' } as never],
        sourceReceiptIds: ['source-receipt-1'],
        sourcedParagraphs: [{
          id: 'paragraph-1',
          documentId: 'doc-1',
          chunkId: 'chunk-1',
          sourceReceiptId: 'source-receipt-1',
          pageRef: 'p.1',
          paragraphRef: 'para-1',
          charStart: 0,
          charEnd: 22,
          excerpt: 'A sourced paragraph.',
          score: 0.91,
          confidence: 0.86,
          citationLabel: '[D1:p.1]',
        }],
        documentDigests: [],
        outputHistory: [],
        memories: [],
        openGaps: ['Freshness needs human review before circulation.'],
        receipts: {
          sourcesUsed: 1,
          paragraphsUsed: 1,
          unsupportedGaps: ['Freshness needs human review before circulation.'],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      saveMemoDraft: async (_uid, input) => {
        expect(input.blocks.map((block) => block.id)).toEqual(expect.arrayContaining([
          'sourced-paragraphs',
          'source-receipt',
          'gap-receipt',
        ]));
        return { memo: { id: 'memo-runtime-proof' } };
      },
      saveOutputCapsule: async (_uid, input) => {
        expect(input.provenance.traceId).toBe('trace-runtime-proof');
        expect(input.citations).toHaveLength(1);
        expect(input.gaps).toHaveLength(1);
        return { id: 'output-runtime-proof' };
      },
    });

    expect(result).toMatchObject({
      runId: 'run-runtime-proof',
      status: 'succeeded',
      executionMode: 'research-memo',
      memoId: 'memo-runtime-proof',
      outputCapsuleId: 'output-runtime-proof',
    });
    expect(result.outputHref).toContain('memo-runtime-proof');
    expect(toolCalls.map((toolCall) => `${toolCall.toolId}:${toolCall.status}`)).toEqual(expect.arrayContaining([
      'capsule-evidence-pack:succeeded',
      'policy-memo:succeeded',
      'output-capsule-save:succeeded',
    ]));
    expect(approvals).toHaveLength(0);
    expect(events.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      'status_transition',
      'praxis.context_resolved',
      'praxis.reasoning.plan',
      'praxis.reasoning.act',
      'praxis.memo_output_created',
    ]));
    expect(encodeSseEvents(events)).toContain('event: praxis.memo_output_created');
    expect(encodeSseEvents(events)).toContain('memo-runtime-proof');
  });
});

function makeRun(status: AgentRun['status'], input: ReturnType<typeof normalizeCreateAgentRunInput>): AgentRun {
  return {
    id: 'run-runtime-proof',
    agentSpecId: input.agentSpecId ?? null,
    ownerUid: input.ownerUid,
    capsuleId: input.capsuleId,
    contextStackId: input.contextStackId,
    contextPackageId: input.contextPackageId,
    selectedCoreIds: input.selectedCoreIds,
    status,
    triggerType: input.triggerType,
    objective: input.objective,
    traceId: input.traceId,
    parentRunId: input.parentRunId,
    idempotencyKey: input.idempotencyKey,
    maxStep: input.maxStep,
    maxSessionMinutes: input.maxSessionMinutes,
    internalEstimatedCostCents: input.internalEstimatedCostCents,
    internalSpendCents: 0,
    metadata: input.metadata,
    createdAt: '2026-05-17T12:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
    queuedAt: '2026-05-17T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    expiresAt: '2026-05-17T12:30:00.000Z',
  };
}
