import type { AgentRun } from '@/lib/agent-runtime/types';
import {
  appendAgentApproval,
  appendAgentToolCall,
  getAgentRun,
  updateAgentRunStatus,
} from '@/lib/agent-runtime/postgres';
import { saveMemoDraft, type SaveMemoDraftInput } from '@/lib/firebase/memo-service';
import { getPolicyAgent } from '@/lib/product/policy-agents';
import { buildOutputFormatterReasoningLoop, buildResearchMemoReasoningLoop } from '@/lib/agent-runtime/reasoning-loop';
import { buildCapsuleEvidencePack, type CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { makeAgentApproval, makeAgentToolCall } from '@/lib/agent-runtime/state';
import { getAgentToolDefinition } from '@/lib/agent-runtime/tool-registry';
import { saveOutputCapsule, type SaveOutputCapsuleInput } from '@/lib/output-capsules/storage';
import {
  buildCapsuleWorkerContext,
  mirrorWorkerEvent,
  type AgentRuntimeMirrorDeps,
} from '@/lib/agent-runtime/mirror';
import { runCapsuleFactoryDraft, type CapsuleFactoryDeps } from '@/lib/agent-runtime/capsule-factory';

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
  executionMode: 'noop' | 'capsule-factory' | 'research-memo' | 'output-formatter' | 'sourceability-reviewer' | 'red-team-analyst' | 'handover-builder';
  traceId: string;
  idempotent?: boolean;
  outputHref?: string;
  memoId?: string;
  outputCapsuleId?: string;
};

type WorkerDeps = {
  getRun?: typeof getAgentRun;
  updateStatus?: typeof updateAgentRunStatus;
  runNoopStep?: (run: AgentRun, payload: ExecuteAgentRunPayload) => Promise<void>;
  saveMemoDraft?: (uid: string, input: SaveMemoDraftInput) => Promise<{ memo: { id: string } }>;
  saveOutputCapsule?: (uid: string, input: SaveOutputCapsuleInput) => Promise<{ id: string } | null>;
  buildEvidencePack?: typeof buildCapsuleEvidencePack;
  appendToolCall?: typeof appendAgentToolCall;
  appendApproval?: typeof appendAgentApproval;
} & AgentRuntimeMirrorDeps & CapsuleFactoryDeps;

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
  const policyAgent = getPolicyAgent(policyAgentId);
  if (policyAgent?.id === 'capsule-factory') {
    return executeCapsuleFactoryAgentRun(payload, { ...deps, getRun: async () => run });
  }
  if (policyAgent?.id === 'research-memo') {
    return executeResearchMemoAgentRun(payload, { ...deps, getRun: async () => run });
  }
  if (policyAgent?.id === 'output-formatter') {
    return executeOutputFormatterAgentRun(payload, { ...deps, getRun: async () => run });
  }
  if (policyAgent?.id === 'sourceability-reviewer' || policyAgent?.id === 'red-team-analyst' || policyAgent?.id === 'handover-builder') {
    return executeReviewAgentRun(payload, policyAgent.id, { ...deps, getRun: async () => run });
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

async function executeCapsuleFactoryAgentRun(
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
      executionMode: 'capsule-factory',
      traceId: run.traceId,
      outputHref: outputHrefFromMetadata(run.metadata, '/app/capsules'),
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
        message: 'Capsule AI accepted the queued capsule build.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          requestedAt: payload.requestedAt,
          executionMode: 'capsule-factory',
        },
      });
      if (!next) throw new AgentWorkerError('Agent run disappeared before execution', 404);
      running = next;
    }

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: 'Capsule AI resolved PRAXIS-owned capsule pointers before Genkit flow execution.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        workerContext: buildCapsuleWorkerContext(running),
        executionMode: 'capsule-factory',
      },
    }, deps);

    const draftOutput = await runCapsuleFactoryDraft(running, deps);
    const outputHref = '/app/capsules';

    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: 'Capsule AI completed reviewable draft capsule proposals.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'capsule-factory',
        outputHref,
        draftOutput,
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'capsule-factory',
      traceId: running.traceId,
      outputHref,
    };
  } catch (err) {
    if (err instanceof AgentWorkerError) throw err;
    await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'failed',
      message: 'Capsule AI failed before draft capsule persistence.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'capsule-factory',
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
  const persistOutputCapsule = deps.saveOutputCapsule ?? saveOutputCapsule;
  const getEvidencePack = deps.buildEvidencePack ?? buildCapsuleEvidencePack;
  const persistToolCall = deps.appendToolCall ?? appendAgentToolCall;
  const persistApproval = deps.appendApproval ?? appendAgentApproval;
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
      outputHref: outputHrefFromMetadata(run.metadata, '/app?panel=memo'),
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
      const toolCall = step.toolId
        ? makeAgentToolCall({
            runId: running.id,
            ownerUid: running.ownerUid,
            capsuleId: running.capsuleId,
            toolId: step.toolId,
            risk: step.risk,
            status: step.requiresApproval ? 'waiting_approval' : 'planned',
            input: { objective: running.objective, stepId: step.id },
          })
        : null;
      if (toolCall) await persistToolCall(toolCall);
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
          toolCallId: toolCall?.id ?? null,
        },
      }, deps);
      if (step.requiresApproval) {
        await persistApproval(makeAgentApproval({
          runId: running.id,
          ownerUid: running.ownerUid,
          capsuleId: running.capsuleId,
          toolCallId: toolCall?.id ?? null,
          risk: step.risk,
          reason: `${step.toolId ?? step.id} requires approval before execution.`,
        }));
      }
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

    const evidencePack = await getEvidencePack({
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      objective: running.objective,
      maxParagraphs: 8,
    });
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'capsule-evidence-pack',
      risk: getAgentToolDefinition('capsule-evidence-pack').risk,
      status: 'succeeded',
      input: { objective: running.objective },
      output: {
        packId: evidencePack.packId,
        paragraphCount: evidencePack.sourcedParagraphs.length,
        sourceReceiptCount: evidencePack.sourceReceiptIds.length,
        gapCount: evidencePack.openGaps.length,
      },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));

    const sourceCount = evidencePack.sourceReceiptIds.length + evidencePack.knowledgeDocuments.length;
    const gapItems = evidencePack.openGaps.length
      ? evidencePack.openGaps
      : ['No blocking capsule gaps were detected for this first memo pass.'];
    const caseId = running.selectedCoreIds.situationCoreId ?? running.capsuleId;
    const title = `Research memo - ${running.objective.slice(0, 80)}`;
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId,
      templateId: 'policy-memo',
      title,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:graph-gap`,
      changeNote: `Created by Research Memo Agent run ${running.id}.`,
      blocks: buildMemoBlocks(running, evidencePack),
    });
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'policy-memo',
      risk: getAgentToolDefinition('policy-memo').risk,
      status: 'succeeded',
      input: { evidencePackId: evidencePack.packId, objective: running.objective },
      output: { memoId: memoRecord.memo.id },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));
    const outputCapsule = await persistOutputCapsule(
      running.ownerUid,
      buildOutputCapsuleInput(running, evidencePack, memoRecord.memo.id),
    );
    if (outputCapsule) {
      await persistToolCall(makeAgentToolCall({
        runId: running.id,
        ownerUid: running.ownerUid,
        capsuleId: running.capsuleId,
        toolId: 'output-capsule-save',
        risk: getAgentToolDefinition('output-capsule-save').risk,
        status: 'succeeded',
        input: { evidencePackId: evidencePack.packId, memoId: memoRecord.memo.id },
        output: { outputCapsuleId: outputCapsule.id },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }));
    }
    const outputHref = outputCapsule?.id
      ? `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}&outputCapsuleId=${encodeURIComponent(outputCapsule.id)}`
      : `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}`;

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'memo_output_created',
      message: 'Research Memo Agent created a Memo Studio draft and OutputCapsule with source and gap receipts.',
      data: {
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        sourceCount,
        gapCount: gapItems.length,
        evidencePackId: evidencePack.packId,
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
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'research-memo',
      traceId: running.traceId,
      outputHref,
      memoId: memoRecord.memo.id,
      outputCapsuleId: outputCapsule?.id,
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

async function executeOutputFormatterAgentRun(
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
      executionMode: 'output-formatter',
      traceId: run.traceId,
      outputHref: outputHrefFromMetadata(run.metadata, '/app?panel=memo'),
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
        message: 'Output Formatter accepted the queued capsule run.',
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
    const loop = buildOutputFormatterReasoningLoop(running);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: 'Output Formatter resolved the active ContextCapsule.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        workerContext,
        executionMode: 'output-formatter',
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
        message: loop.nextApprovalReason ?? 'Output Formatter is waiting for approval before continuing.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          executionMode: 'output-formatter',
          approvalReason: loop.nextApprovalReason,
        },
      });
      return {
        runId: waiting?.id ?? running.id,
        status: waiting?.status ?? 'waiting_approval',
        executionMode: 'output-formatter',
        traceId: running.traceId,
      };
    }

    const sourceCount = running.selectedCoreIds.sourceCoreIds.length + running.selectedCoreIds.documentCoreIds.length;
    const caseId = running.selectedCoreIds.situationCoreId ?? running.capsuleId;
    const title = `Formatted work product - ${running.objective.slice(0, 72)}`;
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId,
      templateId: 'policy-memo',
      title,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:formatting`,
      changeNote: `Created by Output Formatter run ${running.id}.`,
      blocks: [
        {
          id: 'formatted-title',
          type: 'heading',
          title: 'Formatted work product',
          content: 'Capsule-grounded output draft',
          citations: [],
          metadata: { runId: running.id, policyAgentId: 'output-formatter' },
        },
        {
          id: 'format-request',
          type: 'paragraph',
          title: 'Formatting request',
          content: running.objective,
          citations: [],
          metadata: { capsuleId: running.capsuleId },
        },
        {
          id: 'structure',
          type: 'bullets',
          title: 'Recommended structure',
          content: '',
          items: [
            'Executive summary / BLUF',
            'Findings with source posture',
            'Gaps, caveats, and stale assumptions',
            'Decision options or handover next moves',
          ],
          citations: [],
          metadata: { outputDestination: 'memo_studio' },
        },
        {
          id: 'export-readiness',
          type: 'bullets',
          title: 'Export readiness receipt',
          content: '',
          items: [
            sourceCount > 0 ? `${sourceCount} source/document core(s) available for citation review.` : 'No source/document cores are attached; keep citation gaps visible.',
            'Use Memo Studio export for Markdown, DOCX, PDF, or handover package.',
            'Run Sourceability Reviewer before final circulation.',
          ],
          citations: [],
          metadata: { sourceCount },
        },
      ],
    });
    const outputHref = `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}`;

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'formatted_output_created',
      message: 'Output Formatter created a Memo Studio draft with export readiness receipts.',
      data: {
        memoId: memoRecord.memo.id,
        outputHref,
        sourceCount,
      },
    }, deps);

    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: 'Output Formatter completed the capsule-aware formatted work product.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'output-formatter',
        memoId: memoRecord.memo.id,
        outputHref,
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'output-formatter',
      traceId: running.traceId,
      outputHref,
      memoId: memoRecord.memo.id,
    };
  } catch (err) {
    if (err instanceof AgentWorkerError) throw err;
    await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'failed',
      message: 'Output Formatter failed before creating a formatted work product.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        error: err instanceof Error ? err.message : String(err),
      },
    }).catch(() => null);
    throw new AgentWorkerError('Agent run execution failed', 500);
  }
}

async function executeReviewAgentRun(
  payload: ExecuteAgentRunPayload,
  executionMode: 'sourceability-reviewer' | 'red-team-analyst' | 'handover-builder',
  deps: WorkerDeps = {},
): Promise<ExecuteAgentRunResult> {
  const getRun = deps.getRun ?? getAgentRun;
  const updateStatus = deps.updateStatus ?? updateAgentRunStatus;
  const persistMemo = deps.saveMemoDraft ?? saveMemoDraft;
  const persistToolCall = deps.appendToolCall ?? appendAgentToolCall;
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
      executionMode,
      traceId: run.traceId,
      outputHref: outputHrefFromMetadata(run.metadata, executionMode === 'handover-builder' ? '/app?panel=handover' : '/app?panel=memo'),
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
        message: `${reviewAgentLabel(executionMode)} accepted the queued capsule run.`,
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          requestedAt: payload.requestedAt,
        },
      });
      if (!next) throw new AgentWorkerError('Agent run disappeared before execution', 404);
      running = next;
    }

    const toolId = reviewAgentToolId(executionMode);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: `${reviewAgentLabel(executionMode)} resolved the active ContextCapsule.`,
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        workerContext: buildCapsuleWorkerContext(running),
        executionMode,
      },
    }, deps);

    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId,
      risk: getAgentToolDefinition(toolId).risk,
      status: 'succeeded',
      input: { objective: running.objective, capsuleId: running.capsuleId },
      output: { receiptKind: executionMode, traceId: running.traceId },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));

    const memoRecord = await persistMemo(running.ownerUid, {
      caseId: running.selectedCoreIds.situationCoreId ?? running.capsuleId,
      templateId: 'policy-memo',
      title: `${reviewAgentLabel(executionMode)} - ${running.objective.slice(0, 72)}`,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:${executionMode}`,
      changeNote: `Created by ${reviewAgentLabel(executionMode)} run ${running.id}.`,
      blocks: buildReviewMemoBlocks(running, executionMode),
    });
    const outputHref = executionMode === 'handover-builder'
      ? `/app?panel=handover&memoId=${encodeURIComponent(memoRecord.memo.id)}`
      : `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}`;

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: `${executionMode}_receipt_created`,
      message: `${reviewAgentLabel(executionMode)} created a reviewable capsule receipt.`,
      data: {
        memoId: memoRecord.memo.id,
        outputHref,
        toolId,
      },
    }, deps);

    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: `${reviewAgentLabel(executionMode)} completed the capsule-aware receipt.`,
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode,
        memoId: memoRecord.memo.id,
        outputHref,
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode,
      traceId: running.traceId,
      outputHref,
      memoId: memoRecord.memo.id,
    };
  } catch (err) {
    if (err instanceof AgentWorkerError) throw err;
    await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'failed',
      message: `${reviewAgentLabel(executionMode)} failed before creating a receipt.`,
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        error: err instanceof Error ? err.message : String(err),
      },
    }).catch(() => null);
    throw new AgentWorkerError('Agent run execution failed', 500);
  }
}

function outputHrefFromMetadata(metadata: Record<string, unknown>, fallback: string): string {
  const outputHref = metadata.outputHref;
  return typeof outputHref === 'string' && outputHref.startsWith('/app') ? outputHref : fallback;
}

function buildMemoBlocks(running: AgentRun, evidencePack: CapsuleEvidencePack): SaveMemoDraftInput['blocks'] {
  const citedReceiptIds = evidencePack.sourcedParagraphs
    .map((paragraph) => paragraph.sourceReceiptId)
    .filter((value): value is string => Boolean(value));
  const paragraphCitation = citedReceiptIds.length
    ? [{ nodeIds: [], sourceReceiptIds: citedReceiptIds, surface: 'footnote' as const }]
    : [];

  return [
    {
      id: 'bluf',
      type: 'heading',
      title: 'BLUF',
      content: 'Capsule-grounded research memo draft',
      citations: [],
      metadata: { runId: running.id, policyAgentId: 'research-memo', evidencePackId: evidencePack.packId },
    },
    {
      id: 'question',
      type: 'paragraph',
      title: 'Task',
      content: running.objective,
      citations: paragraphCitation,
      metadata: { capsuleId: running.capsuleId },
    },
    {
      id: 'sourced-paragraphs',
      type: 'bullets',
      title: 'Sourced paragraphs',
      content: '',
      items: evidencePack.sourcedParagraphs.length
        ? evidencePack.sourcedParagraphs.map((paragraph) => `${paragraph.citationLabel} ${paragraph.excerpt}`)
        : ['No matching source paragraphs were retrieved. Treat this draft as a scaffold.'],
      citations: paragraphCitation,
      metadata: {
        paragraphCount: evidencePack.sourcedParagraphs.length,
        paragraphIds: evidencePack.sourcedParagraphs.map((paragraph) => paragraph.id),
      },
    },
    {
      id: 'source-receipt',
      type: 'bullets',
      title: 'Source receipt',
      content: '',
      items: evidencePack.sourceReceiptIds.length
        ? evidencePack.sourceReceiptIds.map((sourceReceiptId) => `Source receipt: ${sourceReceiptId}`)
        : ['No source receipts were attached to this run.'],
      citations: paragraphCitation,
      metadata: {
        sourceReceiptIds: evidencePack.sourceReceiptIds,
        documentIds: evidencePack.knowledgeDocuments.map((doc) => doc.documentId),
      },
    },
    {
      id: 'gap-receipt',
      type: 'bullets',
      title: 'Gap receipt',
      content: '',
      items: evidencePack.openGaps.length ? evidencePack.openGaps : ['No blocking capsule gaps were detected for this first memo pass.'],
      citations: [],
      metadata: { gapCount: evidencePack.openGaps.length },
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
  ];
}

function buildOutputCapsuleInput(
  running: AgentRun,
  evidencePack: CapsuleEvidencePack,
  memoId: string,
): SaveOutputCapsuleInput {
  const citations = evidencePack.sourcedParagraphs.map((paragraph) => ({
    id: paragraph.id,
    title: paragraph.citationLabel,
    sourceReceiptId: paragraph.sourceReceiptId ?? undefined,
    confidence: paragraph.confidence,
  }));
  const gaps = evidencePack.openGaps.map((gap, index) => ({
    id: `gap-${index + 1}`,
    claim: gap,
    reason: 'Evidence pack sourceability check flagged this as unresolved.',
    severity: index === 0 ? 'high' as const : 'medium' as const,
  }));

  return {
    id: `run-${running.id}-options-memo`,
    situationId: running.selectedCoreIds.situationCoreId ?? running.capsuleId,
    contextCapsuleId: running.capsuleId,
    templateId: 'options-memo',
    payload: {
      title: `Research memo - ${running.objective.slice(0, 80)}`,
      summary: `Draft memo ${memoId} generated from capsule ${running.capsuleId} with ${evidencePack.sourcedParagraphs.length} sourced paragraph(s).`,
      sections: [
        {
          heading: 'Task',
          body: running.objective,
          citationIds: citations.slice(0, 3).map((citation) => citation.id),
        },
        {
          heading: 'Evidence receipt',
          body: evidencePack.sourcedParagraphs.length
            ? evidencePack.sourcedParagraphs.map((paragraph) => `${paragraph.citationLabel} ${paragraph.excerpt}`).join('\n')
            : 'No sourced paragraphs were retrieved.',
          citationIds: citations.map((citation) => citation.id),
        },
        {
          heading: 'Gaps',
          body: evidencePack.openGaps.length ? evidencePack.openGaps.join('\n') : 'No blocking gaps detected.',
          citationIds: [],
        },
      ],
    },
    citations,
    gaps,
    provenance: {
      createdBy: running.ownerUid,
      toolIds: ['capsule-evidence-pack', 'policy-memo', 'sourceability-reviewer'],
      agentIds: ['research-memo', running.id],
      traceId: running.traceId,
    },
  };
}

function reviewAgentLabel(mode: 'sourceability-reviewer' | 'red-team-analyst' | 'handover-builder'): string {
  switch (mode) {
    case 'sourceability-reviewer':
      return 'Sourceability Reviewer';
    case 'red-team-analyst':
      return 'Red-Team Analyst';
    case 'handover-builder':
      return 'Handover Builder';
  }
}

function reviewAgentToolId(mode: 'sourceability-reviewer' | 'red-team-analyst' | 'handover-builder') {
  switch (mode) {
    case 'sourceability-reviewer':
      return 'sourceability-reviewer';
    case 'red-team-analyst':
      return 'red-team-review';
    case 'handover-builder':
      return 'handover-package';
  }
}

function buildReviewMemoBlocks(
  running: AgentRun,
  mode: 'sourceability-reviewer' | 'red-team-analyst' | 'handover-builder',
): SaveMemoDraftInput['blocks'] {
  const sourceCount = running.selectedCoreIds.sourceCoreIds.length + running.selectedCoreIds.documentCoreIds.length;
  const baseMetadata = {
    runId: running.id,
    policyAgentId: mode,
    capsuleId: running.capsuleId,
    traceId: running.traceId,
  };
  const modeItems = mode === 'sourceability-reviewer'
    ? [
        sourceCount > 0 ? `${sourceCount} source/document core(s) available for claim support review.` : 'No source/document cores are attached; preserve unsupported-claim gaps.',
        'Mark claims as supported, weak, contradicted, or unsourced before hardening the output.',
        'Escalate missing citations back to Library or the capsule evidence pack.',
      ]
    : mode === 'red-team-analyst'
      ? [
          'Challenge assumptions, incentives, feasibility, and second-order effects.',
          'Separate adversarial critique from policy recommendation.',
          'Keep safety boundaries intact; do not produce operational targeting advice.',
        ]
      : [
          'Package the objective, capsule pointer, open gaps, receipts, and next moves.',
          'Preserve thread/run IDs so another analyst or agent can resume the work.',
          'Review sensitive material before sharing externally.',
        ];

  return [
    {
      id: 'review-title',
      type: 'heading',
      title: reviewAgentLabel(mode),
      content: 'Capsule-grounded agent receipt',
      citations: [],
      metadata: baseMetadata,
    },
    {
      id: 'objective',
      type: 'paragraph',
      title: 'Objective',
      content: running.objective,
      citations: [],
      metadata: baseMetadata,
    },
    {
      id: 'receipt',
      type: 'bullets',
      title: 'Receipt',
      content: '',
      items: modeItems,
      citations: [],
      metadata: {
        ...baseMetadata,
        sourceCount,
        outputDestination: mode === 'handover-builder' ? 'handover' : 'memo_studio',
      },
    },
    {
      id: 'next-actions',
      type: 'bullets',
      title: 'Next actions',
      content: '',
      items: [
        'Open this draft in Memo Studio for human review.',
        'Resolve flagged gaps before final export or sharing.',
        'Keep the AgentRun stream attached as the runtime proof.',
      ],
      citations: [],
      metadata: baseMetadata,
    },
  ];
}

export class AgentWorkerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
