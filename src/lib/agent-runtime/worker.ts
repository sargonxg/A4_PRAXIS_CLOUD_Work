import type { AgentRun } from '@/lib/agent-runtime/types';
import { getAgentRun, updateAgentRunStatus } from '@/lib/agent-runtime/postgres';
import { saveMemoDraft, type SaveMemoDraftInput } from '@/lib/firebase/memo-service';
import { getPolicyAgent } from '@/lib/product/policy-agents';
import { buildResearchMemoReasoningLoop } from '@/lib/agent-runtime/reasoning-loop';
import {
  buildCapsuleWorkerContext,
  mirrorWorkerEvent,
  type AgentRuntimeMirrorDeps,
} from '@/lib/agent-runtime/mirror';

export type ExecuteAgentRunPayload = {
  runId: string;
  ownerUid: string;
  capsuleId: string;
  traceId: string;
  dispatchId: string;
  attempt: number;
  requestedAt: string;
};

export type ExecuteAgentRunResult = {
  runId: string;
  status: AgentRun['status'];
  executionMode: 'noop' | 'research-memo';
  traceId: string;
  idempotent?: boolean;
  outputHref?: string;
  memoId?: string;
};

type WorkerDeps = {
  getRun?: typeof getAgentRun;
  updateStatus?: typeof updateAgentRunStatus;
  runNoopStep?: (run: AgentRun, payload: ExecuteAgentRunPayload) => Promise<void>;
  saveMemoDraft?: (uid: string, input: SaveMemoDraftInput) => Promise<{ memo: { id: string } }>;
} & AgentRuntimeMirrorDeps;

export async function executeAgentRun(
  payload: ExecuteAgentRunPayload,
  deps: WorkerDeps = {},
): Promise<ExecuteAgentRunResult> {
  const getRun = deps.getRun ?? getAgentRun;
  const run = await getRun(payload.ownerUid, payload.runId);
  if (!run) {
    throw new AgentWorkerError('Agent run not found', 404);
  }
  const policyAgentId = typeof run.metadata?.policyAgentId === 'string' ? run.metadata.policyAgentId : null;
  if (getPolicyAgent(policyAgentId)?.id === 'research-memo') {
    return executeResearchMemoAgentRun(payload, { ...deps, getRun: async () => run });
  }
  return executeNoopAgentRun(payload, { ...deps, getRun: async () => run });
}

export async function executeNoopAgentRun(
  payload: ExecuteAgentRunPayload,
  deps: WorkerDeps = {},
): Promise<ExecuteAgentRunResult> {
  const getRun = deps.getRun ?? getAgentRun;
  const updateStatus = deps.updateStatus ?? updateAgentRunStatus;
  const run = await getRun(payload.ownerUid, payload.runId);
  if (!run) {
    throw new AgentWorkerError('Agent run not found', 404);
  }
  if (run.traceId !== payload.traceId || run.capsuleId !== payload.capsuleId) {
    throw new AgentWorkerError('Agent run execute payload does not match ledger pointers', 409);
  }
  if (run.status === 'succeeded') {
    return {
      runId: run.id,
      status: run.status,
      executionMode: 'noop',
      traceId: run.traceId,
      idempotent: true,
    };
  }
  if (run.status !== 'queued' && run.status !== 'running') {
    throw new AgentWorkerError(`Agent run cannot be executed from ${run.status}`, 409);
  }

  let running = run;
  try {
    if (run.status !== 'running') {
      const next = await updateStatus({
        ownerUid: run.ownerUid,
        runId: run.id,
        toStatus: 'running',
        message: 'No-op agent worker accepted the queued dispatch.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          requestedAt: payload.requestedAt,
        },
      });
      if (!next) throw new AgentWorkerError('Agent run disappeared before execution', 404);
      running = next;
    }

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: 'Agent worker resolved the PRAXIS ContextCapsule pointers for execution.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        workerContext: buildCapsuleWorkerContext(running),
        executionMode: 'noop',
      },
    }, deps);

    await (deps.runNoopStep?.(running, payload) ?? Promise.resolve());

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'noop_step_completed',
      message: 'No-op worker step completed; Genkit/ADK execution remains deferred.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        genkitReady: true,
        adkReady: true,
      },
    }, deps);

    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: 'No-op agent worker completed without model or tool execution.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'noop',
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'noop',
      traceId: running.traceId,
    };
  } catch (err) {
    if (err instanceof AgentWorkerError) throw err;
    await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'failed',
      message: 'No-op agent worker failed before completion.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        error: err instanceof Error ? err.message : String(err),
      },
    }).catch(() => null);
    throw new AgentWorkerError('Agent run execution failed', 500);
  }
}

async function executeResearchMemoAgentRun(
  payload: ExecuteAgentRunPayload,
  deps: WorkerDeps = {},
): Promise<ExecuteAgentRunResult> {
  const getRun = deps.getRun ?? getAgentRun;
  const updateStatus = deps.updateStatus ?? updateAgentRunStatus;
  const persistMemo = deps.saveMemoDraft ?? saveMemoDraft;
  const run = await getRun(payload.ownerUid, payload.runId);
  if (!run) {
    throw new AgentWorkerError('Agent run not found', 404);
  }
  if (run.traceId !== payload.traceId || run.capsuleId !== payload.capsuleId) {
    throw new AgentWorkerError('Agent run execute payload does not match ledger pointers', 409);
  }
  if (run.status === 'succeeded') {
    return {
      runId: run.id,
      status: run.status,
      executionMode: 'research-memo',
      traceId: run.traceId,
      outputHref: '/app',
      idempotent: true,
    };
  }
  if (run.status !== 'queued' && run.status !== 'running') {
    throw new AgentWorkerError(`Agent run cannot be executed from ${run.status}`, 409);
  }

  let running = run;
  try {
    if (run.status !== 'running') {
      const next = await updateStatus({
        ownerUid: run.ownerUid,
        runId: run.id,
        toStatus: 'running',
        message: 'Research Memo Agent accepted the queued capsule run.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          requestedAt: payload.requestedAt,
        },
      });
      if (!next) throw new AgentWorkerError('Agent run disappeared before execution', 404);
      running = next;
    }

    const workerContext = buildCapsuleWorkerContext(running);
    const loop = buildResearchMemoReasoningLoop(running);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: 'Research Memo Agent resolved the active ContextCapsule.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        workerContext,
        executionMode: 'research-memo',
      },
    }, deps);

    for (const step of loop.steps) {
      await mirrorWorkerEvent(running, {
        substrate: 'praxis',
        phase: `reasoning.${step.phase}`,
        message: step.message,
        data: {
          stepId: step.id,
          toolId: step.toolId,
          risk: step.risk,
          requiresApproval: step.requiresApproval,
          receiptId: step.receiptId,
          stoppedForApproval: loop.stoppedForApproval,
        },
      }, deps);
    }

    if (loop.stoppedForApproval) {
      const waiting = await updateStatus({
        ownerUid: running.ownerUid,
        runId: running.id,
        toStatus: 'waiting_approval',
        message: loop.nextApprovalReason ?? 'Agent run is waiting for approval before continuing.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          executionMode: 'research-memo',
          approvalReason: loop.nextApprovalReason,
        },
      });
      return {
        runId: waiting?.id ?? running.id,
        status: waiting?.status ?? 'waiting_approval',
        executionMode: 'research-memo',
        traceId: running.traceId,
      };
    }

    const sourceCount = running.selectedCoreIds.sourceCoreIds.length + running.selectedCoreIds.documentCoreIds.length;
    const gapItems = [
      sourceCount === 0 ? 'Attach source receipts or documents before treating recommendations as settled.' : null,
      running.selectedCoreIds.graphCoreId ? null : 'Review actor and relationship coverage before final export.',
      running.selectedCoreIds.timeCoreId ? null : 'Set the relevant time horizon and freshness posture.',
    ].filter((item): item is string => Boolean(item));
    const caseId = running.selectedCoreIds.situationCoreId ?? running.capsuleId;
    const title = `Research memo - ${running.objective.slice(0, 80)}`;
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId,
      templateId: 'policy-memo',
      title,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:graph-gap`,
      changeNote: `Created by Research Memo Agent run ${running.id}.`,
      blocks: [
        {
          id: 'bluf',
          type: 'heading',
          title: 'BLUF',
          content: 'Capsule-grounded research memo draft',
          citations: [],
          metadata: { runId: running.id, policyAgentId: 'research-memo' },
        },
        {
          id: 'question',
          type: 'paragraph',
          title: 'Task',
          content: running.objective,
          citations: [],
          metadata: { capsuleId: running.capsuleId },
        },
        {
          id: 'source-receipt',
          type: 'bullets',
          title: 'Source receipt',
          content: '',
          items: sourceCount > 0
            ? [
                `${running.selectedCoreIds.sourceCoreIds.length} source core(s) attached.`,
                `${running.selectedCoreIds.documentCoreIds.length} document core(s) attached.`,
              ]
            : ['No source or document cores were attached to this run. Treat this draft as a scaffold.'],
          citations: [],
          metadata: { sourceCoreIds: running.selectedCoreIds.sourceCoreIds, documentCoreIds: running.selectedCoreIds.documentCoreIds },
        },
        {
          id: 'gap-receipt',
          type: 'bullets',
          title: 'Gap receipt',
          content: '',
          items: gapItems.length ? gapItems : ['No blocking capsule gaps were detected for this first memo pass.'],
          citations: [],
          metadata: { gapCount: gapItems.length },
        },
        {
          id: 'next-moves',
          type: 'bullets',
          title: 'Review actions',
          content: '',
          items: [
            'Open Memo Studio and revise the draft against the evidence receipt.',
            'Run Sourceability Reviewer before final export.',
            'Promote graph changes only after human approval.',
          ],
          citations: [],
          metadata: { outputDestination: 'memo_studio' },
        },
      ],
    });

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'memo_draft_created',
      message: 'Research Memo Agent created a Memo Studio draft with source and gap receipts.',
      data: {
        memoId: memoRecord.memo.id,
        outputHref: '/app',
        sourceCount,
        gapCount: gapItems.length,
      },
    }, deps);

    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: 'Research Memo Agent completed the capsule-aware memo draft.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'research-memo',
        memoId: memoRecord.memo.id,
        outputHref: '/app',
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'research-memo',
      traceId: running.traceId,
      outputHref: '/app',
      memoId: memoRecord.memo.id,
    };
  } catch (err) {
    if (err instanceof AgentWorkerError) throw err;
    await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'failed',
      message: 'Research Memo Agent failed before creating a memo draft.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        error: err instanceof Error ? err.message : String(err),
      },
    }).catch(() => null);
    throw new AgentWorkerError('Agent run execution failed', 500);
  }
}

export class AgentWorkerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
