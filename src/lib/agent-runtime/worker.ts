import type { AgentRun } from '@/lib/agent-runtime/types';
import { buildCapsuleReadReceiptFromEvidencePack, buildCapsuleReadReceiptFromRun, type CapsuleReadReceipt } from '@/lib/agent-runtime/capsule-read-receipt';
import {
  appendAgentApproval,
  appendAgentToolCall,
  getAgentRun,
  updateAgentRunStatus,
} from '@/lib/agent-runtime/postgres';
import { saveMemoDraft, type SaveMemoDraftInput } from '@/lib/firebase/memo-service';
import { getPolicyAgent, policyAgentRunIntent, type PolicyAgentOutputDestination } from '@/lib/product/policy-agents';
import { buildOutputFormatterReasoningLoop, buildResearchMemoReasoningLoop } from '@/lib/agent-runtime/reasoning-loop';
import { buildCapsuleEvidencePack, type CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { buildSourceabilityLedgerFromEvidencePack, buildSourceabilityLedgerFromRun, type SourceabilityLedger } from '@/lib/agent-runtime/sourceability-ledger';
import { makeAgentApproval, makeAgentToolCall } from '@/lib/agent-runtime/state';
import { getAgentToolDefinition } from '@/lib/agent-runtime/tool-registry';
import { buildAgentWorkflowPlan, type AgentWorkflowPlan } from '@/lib/agent-runtime/workflow-plan';
import { saveOutputCapsule, type SaveOutputCapsuleInput } from '@/lib/output-capsules/storage';
import {
  buildCapsuleWorkerContext,
  mirrorWorkerEvent,
  type AgentRuntimeMirrorDeps,
} from '@/lib/agent-runtime/mirror';
import { runCapsuleFactoryDraft, type CapsuleFactoryDeps } from '@/lib/agent-runtime/capsule-factory';
import { boardroomParticipantLabel, type BoardroomOutput } from '@/lib/boardroom/schema';
import {
  BOARDROOM_MODEL_POLICY_ID,
  runLiveBoardroomDiscussion,
  type LiveBoardroomRunnerInput,
} from '@/lib/boardroom/live-runner';

export type ExecuteAgentRunPayload = {
  runId: string;
  ownerUid: string;
  capsuleId: string;
  traceId: string;
  dispatchId: string;
  attempt: number;
  requestedAt: string;
};

export type AgentRunExecutionMode =
  | 'noop'
  | 'capsule-factory'
  | 'research-memo'
  | 'boardroom-discussion'
  | 'output-formatter'
  | 'sourceability-reviewer'
  | 'red-team-analyst'
  | 'handover-builder';

export type AgentWorkerFailureDiagnostic = {
  category: string;
  runId: string;
  policyAgentId: string | null;
  executionMode: AgentRunExecutionMode;
  failedPhase: string;
  dispatchId: string;
  attempt: number;
  traceId: string;
  errorName: string;
  errorMessage: string;
};

export type ExecuteAgentRunResult = {
  runId: string;
  status: AgentRun['status'];
  executionMode: AgentRunExecutionMode;
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
  runBoardroomDiscussion?: (input: LiveBoardroomRunnerInput) => Promise<BoardroomOutput>;
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
  if (policyAgent?.id === 'boardroom-discussion') {
    return executeBoardroomAgentRun(payload, { ...deps, getRun: async () => run });
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
  let executionStage = 'starting';
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
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'context-resolved';
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

    executionStage = 'noop-step';
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

    executionStage = 'succeeded-transition';
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
    return failAgentRunExecution({
      updateStatus,
      running,
      payload,
      executionMode: 'noop',
      failedPhase: executionStage,
      message: 'No-op agent worker failed before completion.',
      err,
    });
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
  let executionStage = 'starting';
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
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'context-resolved';
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

    executionStage = 'capsule-draft';
    const draftOutput = await runCapsuleFactoryDraft(running, deps);
    const outputHref = '/app/capsules';

    executionStage = 'succeeded-transition';
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
    return failAgentRunExecution({
      updateStatus,
      running,
      payload,
      executionMode: 'capsule-factory',
      failedPhase: executionStage,
      message: 'Capsule AI failed before draft capsule persistence.',
      err,
    });
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
  let executionStage = 'starting';
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
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'context-build';
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
    executionStage = 'workflow-proof';
    const initialWorkflowProof = await emitCapsuleReadAndWorkflowPlan(running, deps);

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

    executionStage = 'search-evidence';
    await collectSearchEvidenceForRun(running, {
      appendToolCall: persistToolCall,
      appendEvent: deps.appendEvent,
    });

    executionStage = 'evidence-pack';
    const evidencePack = await getEvidencePack({
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      objective: running.objective,
      maxParagraphs: 8,
    });
    executionStage = 'sourceability-ledger';
    const capsuleReadReceipt = buildCapsuleReadReceiptFromEvidencePack(evidencePack, {
      selectedTools: initialWorkflowProof.workflowPlan.selectedTools,
      outputTarget: outputDestinationFromMetadata(running.metadata) ?? 'memo_studio',
      groundingPosture: initialWorkflowProof.capsuleReadReceipt.groundingPosture,
    });
    const workflowPlan = buildAgentWorkflowPlan({
      prompt: running.objective,
      runIntent: 'research_memo',
      policyAgentId: 'research-memo',
      selectedToolIds: initialWorkflowProof.workflowPlan.selectedTools,
      outputTarget: outputDestinationFromMetadata(running.metadata) ?? 'memo_studio',
      capsuleReadReceipt,
      groundingPosture: capsuleReadReceipt.groundingPosture,
    });
    const sourceabilityLedger = buildSourceabilityLedgerFromEvidencePack(evidencePack, {
      agentRunId: running.id,
      outputTarget: 'memo_studio',
    });
    await emitSourceabilityLedger(running, sourceabilityLedger, deps);
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
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'sourceability-reviewer',
      risk: getAgentToolDefinition('sourceability-reviewer').risk,
      status: sourceabilityLedger.summary.unsupportedClaims > 0 ? 'succeeded' : 'succeeded',
      input: { evidencePackId: evidencePack.packId, objective: running.objective },
      output: {
        ledgerId: sourceabilityLedger.ledgerId,
        summary: sourceabilityLedger.summary,
        unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
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
    executionStage = 'memo-persist';
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId,
      templateId: 'policy-memo',
      title,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:graph-gap`,
      changeNote: `Created by Research Memo Agent run ${running.id}.`,
      blocks: buildMemoBlocks(running, evidencePack, sourceabilityLedger),
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
    executionStage = 'output-capsule-persist';
    const outputCapsule = await persistOutputCapsule(
      running.ownerUid,
      buildOutputCapsuleInput(running, evidencePack, memoRecord.memo.id, sourceabilityLedger),
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
      message: 'Research Memo Agent created a Work draft and OutputCapsule with source and gap receipts.',
      data: {
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        sourceCount,
        gapCount: gapItems.length,
        evidencePackId: evidencePack.packId,
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
      },
    }, deps);

    executionStage = 'succeeded-transition';
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
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        selectedTools: workflowPlan.selectedTools,
        groundingPosture: workflowPlan.groundingPosture,
        outputTarget: workflowPlan.outputTarget,
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
    return failAgentRunExecution({
      updateStatus,
      running,
      payload,
      executionMode: 'research-memo',
      failedPhase: executionStage,
      message: 'Research Memo Agent failed before creating a memo draft.',
      err,
    });
  }
}

async function executeBoardroomAgentRun(
  payload: ExecuteAgentRunPayload,
  deps: WorkerDeps = {},
): Promise<ExecuteAgentRunResult> {
  const getRun = deps.getRun ?? getAgentRun;
  const updateStatus = deps.updateStatus ?? updateAgentRunStatus;
  const persistMemo = deps.saveMemoDraft ?? saveMemoDraft;
  const persistOutputCapsule = deps.saveOutputCapsule ?? saveOutputCapsule;
  const persistToolCall = deps.appendToolCall ?? appendAgentToolCall;
  const buildEvidencePack = deps.buildEvidencePack ?? buildCapsuleEvidencePack;
  const runBoardroomDiscussion = deps.runBoardroomDiscussion ?? runLiveBoardroomDiscussion;
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
      executionMode: 'boardroom-discussion',
      traceId: run.traceId,
      outputHref: outputHrefFromMetadata(run.metadata, `/app/boardroom?runId=${encodeURIComponent(run.id)}`),
      idempotent: true,
    };
  }
  if (run.status !== 'queued' && run.status !== 'running') {
    throw new AgentWorkerError(`Agent run cannot be executed from ${run.status}`, 409);
  }

  let running = run;
  let executionStage = 'starting';
  try {
    if (run.status !== 'running') {
      const next = await updateStatus({
        ownerUid: run.ownerUid,
        runId: run.id,
        toStatus: 'running',
        message: 'Boardroom Discussion accepted the queued capsule run.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          requestedAt: payload.requestedAt,
        },
      });
      if (!next) throw new AgentWorkerError('Agent run disappeared before execution', 404);
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'context-resolved';
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'context_resolved',
      message: 'Boardroom Discussion resolved the active ContextCapsule and boardroom spec.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        workerContext: buildCapsuleWorkerContext(running),
        executionMode: 'boardroom-discussion',
      },
    }, deps);

    executionStage = 'evidence-pack';
    const evidencePack = await buildEvidencePack({
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      objective: running.objective,
      maxParagraphs: 12,
    });

    executionStage = 'workflow-proof';
    const outputTarget = outputDestinationFromMetadata(running.metadata);
    const capsuleReadReceipt = buildCapsuleReadReceiptFromEvidencePack(evidencePack, {
      selectedTools: selectedWorkflowToolIds(running),
      outputTarget,
      groundingPosture: evidencePack.sourceReceiptIds.length ? 'Capsule source receipts attached' : 'No source receipts attached',
    });
    const { workflowPlan } = await emitCapsuleReadAndWorkflowPlan(running, deps, { readReceipt: capsuleReadReceipt });

    executionStage = 'sourceability-ledger';
    const sourceabilityLedger = buildSourceabilityLedgerFromEvidencePack(evidencePack, {
      agentRunId: running.id,
      outputTarget,
    });
    await emitSourceabilityLedger(running, sourceabilityLedger, deps);

    executionStage = 'boardroom-brief';
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'boardroom.brief_created',
      message: 'Boardroom Discussion created the live meeting brief from the active capsule evidence pack.',
      data: {
        modelPolicy: BOARDROOM_MODEL_POLICY_ID,
        evidencePackId: evidencePack.packId,
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerId: sourceabilityLedger.ledgerId,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        activeCapsule: {
          capsuleId: evidencePack.activeCapsule.capsuleId,
          label: evidencePack.activeCapsule.label,
          version: evidencePack.activeCapsule.version,
        },
        sourceCount: evidencePack.sourceReceiptIds.length,
        documentCount: running.selectedCoreIds.documentCoreIds.length,
        sourcedParagraphCount: evidencePack.sourcedParagraphs.length,
        openGaps: evidencePack.openGaps,
      },
    }, deps);

    executionStage = 'boardroom-live-discussion';
    const boardroomStartedAt = Date.now();
    const boardroom = await runBoardroomDiscussion({
      run: running,
      payload,
      evidencePack,
    });
    const boardroomLatencyMs = Date.now() - boardroomStartedAt;

    for (const turn of boardroom.transcript) {
      await mirrorWorkerEvent(running, {
        substrate: 'praxis',
        phase: `boardroom.turn.${turn.participantId}`,
        message: `${boardroomParticipantLabel(turn.participantId)} completed boardroom turn ${turn.round}.`,
        data: {
          modelPolicy: BOARDROOM_MODEL_POLICY_ID,
          participantId: turn.participantId,
          round: turn.round,
          turn,
          state: turn.state,
          confidence: turn.confidence,
          evidenceRefs: turn.evidenceRefs,
          sourceCount: boardroom.evidenceStats.sourceCount,
          documentCount: boardroom.evidenceStats.documentCount,
        },
      }, deps);
    }

    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'boardroom-deliberation',
      risk: getAgentToolDefinition('boardroom-deliberation').risk,
      status: 'succeeded',
      input: {
        objective: running.objective,
        participantIds: boardroom.roster.map((participant) => participant.participantId),
      },
      output: {
        transcriptTurnCount: boardroom.transcript.length,
        topicClusterCount: boardroom.topicClusters.length,
        confidenceDistribution: boardroom.confidenceDistribution,
        modelPolicy: BOARDROOM_MODEL_POLICY_ID,
        latencyMs: boardroomLatencyMs,
      },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'boardroom.synthesis_created',
      message: 'Synthesis Chair created the final boardroom synthesis.',
      data: {
        modelPolicy: BOARDROOM_MODEL_POLICY_ID,
        latencyMs: boardroomLatencyMs,
        finalSynthesis: boardroom.finalSynthesis,
        consensus: boardroom.consensus,
        divergences: boardroom.divergences,
        risks: boardroom.risks,
        openQuestions: boardroom.openQuestions,
        evidenceStats: boardroom.evidenceStats,
      },
    }, deps);

    executionStage = 'memo-persist';
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId: running.selectedCoreIds.situationCoreId ?? running.capsuleId,
      templateId: 'policy-memo',
      title: `Boardroom pack - ${running.objective.slice(0, 72)}`,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:boardroom`,
      changeNote: `Created by Boardroom Discussion run ${running.id}.`,
      capsuleId: running.capsuleId,
      runId: running.id,
      outputTarget: 'board_executive_pack',
      sourceReceiptIds: stringArray(running.metadata.sourceReceiptIds),
      blocks: buildBoardroomMemoBlocks(running, boardroom),
    });

    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'board-executive-pack',
      risk: getAgentToolDefinition('board-executive-pack').risk,
      status: 'succeeded',
      input: { objective: running.objective },
      output: { memoId: memoRecord.memo.id, evidenceStats: boardroom.evidenceStats },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));

    executionStage = 'output-capsule-persist';
    const outputCapsule = await persistOutputCapsule(
      running.ownerUid,
      buildBoardroomOutputCapsuleInput(running, boardroom, memoRecord.memo.id),
    );
    if (outputCapsule) {
      await persistToolCall(makeAgentToolCall({
        runId: running.id,
        ownerUid: running.ownerUid,
        capsuleId: running.capsuleId,
        toolId: 'output-capsule-save',
        risk: getAgentToolDefinition('output-capsule-save').risk,
        status: 'succeeded',
        input: { memoId: memoRecord.memo.id, templateId: 'board-executive-pack' },
        output: { outputCapsuleId: outputCapsule.id },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }));
    }

    const outputHref = outputCapsule?.id
      ? `/app/boardroom?runId=${encodeURIComponent(running.id)}&memoId=${encodeURIComponent(memoRecord.memo.id)}&outputCapsuleId=${encodeURIComponent(outputCapsule.id)}`
      : `/app/boardroom?runId=${encodeURIComponent(running.id)}&memoId=${encodeURIComponent(memoRecord.memo.id)}`;

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'boardroom.artifact_created',
      message: 'Boardroom Discussion persisted a Work draft and board-executive OutputCapsule.',
      data: {
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        modelPolicy: BOARDROOM_MODEL_POLICY_ID,
        latencyMs: boardroomLatencyMs,
        artifactIds: [memoRecord.memo.id, outputCapsule?.id].filter((item): item is string => Boolean(item)),
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        finalStatus: 'succeeded',
        boardroomOutput: boardroom,
      },
    }, deps);

    executionStage = 'succeeded-transition';
    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: 'Boardroom Discussion completed the capsule-grounded board pack.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'boardroom-discussion',
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        boardroomOutput: boardroom,
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        sourceCount: boardroom.evidenceStats.sourceCount,
        documentCount: boardroom.evidenceStats.documentCount,
        sourceReceiptIds: stringArray(running.metadata.sourceReceiptIds),
        modelPolicy: BOARDROOM_MODEL_POLICY_ID,
        latencyMs: boardroomLatencyMs,
        artifactIds: [memoRecord.memo.id, outputCapsule?.id].filter((item): item is string => Boolean(item)),
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'boardroom-discussion',
      traceId: running.traceId,
      outputHref,
      memoId: memoRecord.memo.id,
      outputCapsuleId: outputCapsule?.id,
    };
  } catch (err) {
    if (err instanceof AgentWorkerError) throw err;
    return failAgentRunExecution({
      updateStatus,
      running,
      payload,
      executionMode: 'boardroom-discussion',
      failedPhase: executionStage,
      message: 'Boardroom Discussion failed before creating the board pack.',
      err,
    });
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
  let executionStage = 'starting';
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
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'context-resolved';
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
    executionStage = 'workflow-proof';
    const { capsuleReadReceipt, workflowPlan } = await emitCapsuleReadAndWorkflowPlan(running, deps);
    executionStage = 'sourceability-ledger';
    const sourceabilityLedger = buildSourceabilityLedgerFromRun(running, {
      outputTarget: 'memo_studio',
    });
    await emitSourceabilityLedger(running, sourceabilityLedger, deps);

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
    executionStage = 'memo-persist';
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
            'Use Work export for Markdown, DOCX, PDF, or handover package.',
            'Run Sourceability Reviewer before final circulation.',
          ],
          citations: [],
          metadata: { sourceCount },
        },
        {
          id: 'claim-ledger-summary',
          type: 'bullets',
          title: 'Claim ledger summary',
          content: '',
          items: [
            `${sourceabilityLedger.summary.totalClaims} material claim(s) reviewed.`,
            `${sourceabilityLedger.summary.unsupportedClaims} unsupported claim(s) remain visible.`,
            `Generated ${sourceabilityLedger.outputReadiness.generatedAt} for run ${running.id}.`,
          ],
          citations: [],
          metadata: {
            capsuleId: running.capsuleId,
            agentRunId: running.id,
            sourceabilityLedgerId: sourceabilityLedger.ledgerId,
            sourceabilityLedgerSummary: sourceabilityLedger.summary,
          },
        },
      ],
    });
    const outputHref = `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}`;

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'formatted_output_created',
      message: 'Output Formatter created a Work draft with export readiness receipts.',
      data: {
        memoId: memoRecord.memo.id,
        outputHref,
        sourceCount,
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
      },
    }, deps);

    executionStage = 'succeeded-transition';
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
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
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
    return failAgentRunExecution({
      updateStatus,
      running,
      payload,
      executionMode: 'output-formatter',
      failedPhase: executionStage,
      message: 'Output Formatter failed before creating a formatted work product.',
      err,
    });
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
  let executionStage = 'starting';
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
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'context-resolved';
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
    executionStage = 'workflow-proof';
    const { capsuleReadReceipt, workflowPlan } = await emitCapsuleReadAndWorkflowPlan(running, deps);
    executionStage = 'sourceability-ledger';
    const sourceabilityLedger = buildSourceabilityLedgerFromRun(running, {
      outputTarget: executionMode === 'handover-builder' ? 'handover' : 'memo_studio',
    });
    await emitSourceabilityLedger(running, sourceabilityLedger, deps);

    executionStage = 'tool-call-persist';
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

    executionStage = 'memo-persist';
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId: running.selectedCoreIds.situationCoreId ?? running.capsuleId,
      templateId: 'policy-memo',
      title: `${reviewAgentLabel(executionMode)} - ${running.objective.slice(0, 72)}`,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:${executionMode}`,
      changeNote: `Created by ${reviewAgentLabel(executionMode)} run ${running.id}.`,
      blocks: buildReviewMemoBlocks(running, executionMode, sourceabilityLedger),
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
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
      },
    }, deps);

    executionStage = 'succeeded-transition';
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
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
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
    return failAgentRunExecution({
      updateStatus,
      running,
      payload,
      executionMode,
      failedPhase: executionStage,
      message: `${reviewAgentLabel(executionMode)} failed before creating a receipt.`,
      err,
    });
  }
}

async function failAgentRunExecution(input: {
  updateStatus: typeof updateAgentRunStatus;
  running: AgentRun;
  payload: ExecuteAgentRunPayload;
  executionMode: AgentRunExecutionMode;
  failedPhase: string;
  message: string;
  err: unknown;
  data?: Record<string, unknown>;
}): Promise<never> {
  const failure = buildAgentWorkerFailureDiagnostic({
    run: input.running,
    payload: input.payload,
    executionMode: input.executionMode,
    failedPhase: input.failedPhase,
    err: input.err,
  });

  await input.updateStatus({
    ownerUid: input.running.ownerUid,
    runId: input.running.id,
    toStatus: 'failed',
    message: input.message,
    data: {
      ...input.data,
      dispatchId: input.payload.dispatchId,
      attempt: input.payload.attempt,
      executionMode: input.executionMode,
      failedPhase: input.failedPhase,
      failure,
      error: failure.errorMessage,
    },
  }).catch(() => null);

  throw new AgentWorkerError('Agent run execution failed', 500, failure);
}

export function buildAgentWorkerFailureDiagnostic(input: {
  run: AgentRun;
  payload: ExecuteAgentRunPayload;
  executionMode: AgentRunExecutionMode;
  failedPhase: string;
  err: unknown;
}): AgentWorkerFailureDiagnostic {
  return {
    category: categorizeWorkerFailure(input.executionMode, input.failedPhase),
    runId: input.run.id,
    policyAgentId: typeof input.run.metadata?.policyAgentId === 'string' ? input.run.metadata.policyAgentId : null,
    executionMode: input.executionMode,
    failedPhase: input.failedPhase,
    dispatchId: input.payload.dispatchId,
    attempt: input.payload.attempt,
    traceId: input.run.traceId,
    errorName: input.err instanceof Error ? input.err.name : typeof input.err,
    errorMessage: sanitizeWorkerErrorMessage(input.err),
  };
}

function categorizeWorkerFailure(executionMode: AgentRunExecutionMode, failedPhase: string): string {
  if (failedPhase === 'evidence-pack') return 'evidence_pack_failed';
  if (failedPhase === 'sourceability-ledger') return 'sourceability_ledger_failed';
  if (failedPhase === 'memo-persist') return 'memo_persist_failed';
  if (failedPhase === 'output-capsule-persist') return 'output_capsule_persist_failed';
  if (failedPhase === 'succeeded-transition') return 'status_transition_failed';
  if (failedPhase.includes('approval')) return 'approval_gate_failed';
  if (failedPhase.includes('search')) return 'search_evidence_failed';
  if (failedPhase.includes('workflow')) return 'workflow_proof_failed';
  if (failedPhase.includes('context')) return 'context_resolution_failed';
  return `${executionMode.replace(/-/g, '_')}_failed`;
}

function sanitizeWorkerErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/(authorization:\s*bearer\s+)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b(token|secret|password|api[_-]?key|key)=([^&\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/\bAIza[0-9A-Za-z_-]+/g, '[REDACTED]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[REDACTED]')
    .slice(0, 500);
}

function outputHrefFromMetadata(metadata: Record<string, unknown>, fallback: string): string {
  const outputHref = metadata.outputHref;
  return typeof outputHref === 'string' && outputHref.startsWith('/app') ? outputHref : fallback;
}

async function emitCapsuleReadAndWorkflowPlan(
  running: AgentRun,
  deps: WorkerDeps,
  options: {
    readReceipt?: CapsuleReadReceipt;
    workflowPlan?: AgentWorkflowPlan;
  } = {},
): Promise<{ capsuleReadReceipt: CapsuleReadReceipt; workflowPlan: AgentWorkflowPlan }> {
  const selectedTools = selectedWorkflowToolIds(running);
  const outputTarget = outputDestinationFromMetadata(running.metadata);
  const groundingPosture = typeof running.metadata.groundingPosture === 'string' ? running.metadata.groundingPosture : 'No grounding metadata';
  const capsuleReadReceipt = options.readReceipt ?? buildCapsuleReadReceiptFromRun(running, {
    selectedTools,
    outputTarget,
    groundingPosture,
  });
  const workflowPlan = options.workflowPlan ?? buildAgentWorkflowPlan({
    prompt: running.objective,
    runIntent: policyAgentRunIntent(typeof running.metadata.policyAgentId === 'string' ? running.metadata.policyAgentId : null),
    policyAgentId: typeof running.metadata.policyAgentId === 'string' ? running.metadata.policyAgentId : null,
    selectedToolIds: selectedTools,
    outputTarget,
    capsuleReadReceipt,
    groundingPosture,
  });

  await mirrorWorkerEvent(running, {
    substrate: 'praxis',
    phase: 'capsule.read_receipt_created',
    message: 'Agent worker created the canonical ContextCapsule read receipt before downstream work.',
    data: { capsuleReadReceipt },
  }, deps);
  await mirrorWorkerEvent(running, {
    substrate: 'praxis',
    phase: 'workflow.plan_created',
    message: 'Agent worker created a bounded workflow plan from registered agents and tools.',
    data: { workflowPlan },
  }, deps);

  return { capsuleReadReceipt, workflowPlan };
}

async function emitSourceabilityLedger(
  running: AgentRun,
  ledger: SourceabilityLedger,
  deps: WorkerDeps,
): Promise<void> {
  await mirrorWorkerEvent(running, {
    substrate: 'praxis',
    phase: 'sourceability.ledger_created',
    message: 'Agent worker created the sourceability claim ledger for the generated work product.',
    data: {
      sourceabilityLedgerId: ledger.ledgerId,
      sourceabilityLedgerSummary: ledger.summary,
      unsupportedClaims: ledger.unsupportedClaims.map((claim) => ({
        id: claim.id,
        claim: claim.claim,
        supportLabel: claim.supportLabel,
      })),
      outputReadiness: ledger.outputReadiness,
    },
  }, deps);
}

function selectedWorkflowToolIds(run: AgentRun): string[] {
  const tools = [
    'context-resolve',
    ...stringArray(run.metadata.selectedTools),
    ...stringArray(run.metadata.selectedToolIds),
    ...run.selectedCoreIds.toolCoreIds,
  ];
  return Array.from(new Set(tools));
}

function outputDestinationFromMetadata(metadata: Record<string, unknown>): PolicyAgentOutputDestination | null {
  const destination = metadata.outputDestination;
  return destination === 'memo_studio' || destination === 'canvas' || destination === 'library' || destination === 'handover'
    ? destination
    : null;
}

async function collectSearchEvidenceForRun(
  running: AgentRun,
  deps: Pick<WorkerDeps, 'appendToolCall' | 'appendEvent'>,
): Promise<void> {
  const persistToolCall = deps.appendToolCall ?? appendAgentToolCall;
  const selectedToolIds = selectedSearchToolIds(running);
  if (!selectedToolIds.length) return;

  const searchPlan = normalizeSearchPlan(running.metadata.searchPlan, running.objective);
  const sourceReceiptIds = stringArray(running.metadata.sourceReceiptIds);
  const groundingPlan = isRecord(running.metadata.groundingPlan) ? running.metadata.groundingPlan : null;
  const googleGroundingActive = Array.isArray(groundingPlan?.modes) && groundingPlan.modes.includes('google_search');
  const groundingPosture = googleGroundingActive ? 'Google Search grounding active' : 'Grounding unavailable';
  const degradedReason = googleGroundingActive ? null : 'Google Search grounding is not configured.';
  const gaps = [
    ...(sourceReceiptIds.length ? [] : ['No current-source receipts were collected for this run.']),
    ...(degradedReason ? [degradedReason] : []),
  ];

  await mirrorWorkerEvent(running, {
    substrate: 'praxis',
    phase: 'grounding.search_evidence_started',
    message: 'Agent worker started the search evidence collection phase.',
    data: {
      selectedToolIds,
      querySet: searchPlan.queries,
      sourceClasses: searchPlan.sourceClasses,
      groundingPosture,
      degradedReason,
    },
  }, deps);

  for (const toolId of selectedToolIds) {
    const now = new Date().toISOString();
    const output = {
      receiptKind: 'search_evidence',
      querySet: searchPlan.queries,
      sourceClasses: searchPlan.sourceClasses,
      freshnessNeed: searchPlan.freshnessNeed,
      timeframe: searchPlan.timeframe,
      sourceReceiptIds,
      sourceReceiptCount: sourceReceiptIds.length,
      groundingPlan,
      groundingPosture,
      degradedReason,
      gaps,
    };
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId,
      risk: getAgentToolDefinition(toolId).risk,
      status: sourceReceiptIds.length || googleGroundingActive ? 'succeeded' : 'failed',
      input: {
        objective: running.objective,
        querySet: searchPlan.queries,
        sourceClasses: searchPlan.sourceClasses,
      },
      output,
      error: degradedReason,
      startedAt: now,
      completedAt: now,
    }));
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: `tool.${toolId}.completed`,
      message: `${getAgentToolDefinition(toolId).label} saved a search evidence receipt.`,
      data: {
        toolId,
        sourceReceiptCount: sourceReceiptIds.length,
        groundingPosture,
        degradedReason,
      },
    }, deps);
  }

  if (degradedReason) {
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'search_evidence_degraded',
      message: 'Search evidence collection continued with an explicit degraded grounding receipt.',
      data: {
        sourceReceiptCount: sourceReceiptIds.length,
        groundingPosture,
        degradedReason,
        gaps,
      },
    }, deps);
  }

  await mirrorWorkerEvent(running, {
    substrate: 'praxis',
    phase: 'search_evidence_collected',
    message: sourceReceiptIds.length
      ? 'Search evidence source receipts were attached to the run.'
      : 'Search evidence phase completed without live current-source receipts.',
    data: {
      sourceReceiptIds,
      sourceReceiptCount: sourceReceiptIds.length,
      querySet: searchPlan.queries,
      gaps,
      groundingPosture,
      degradedReason,
    },
  }, deps);
}

function selectedSearchToolIds(run: AgentRun): string[] {
  const toolIds = [
    ...stringArray(run.metadata.selectedTools),
    ...stringArray(run.metadata.selectedToolIds),
    ...run.selectedCoreIds.toolCoreIds,
  ];
  return Array.from(new Set(toolIds.filter((toolId) => toolId === 'grounded-search' || toolId === 'deep-search-agent')));
}

function normalizeSearchPlan(value: unknown, objective: string): {
  queries: string[];
  sourceClasses: string[];
  freshnessNeed: string;
  timeframe: string | null;
} {
  if (!isRecord(value)) {
    return {
      queries: [objective.slice(0, 240)],
      sourceClasses: ['attached_sources'],
      freshnessNeed: 'not_specified',
      timeframe: null,
    };
  }
  const queries = stringArray(value.queries);
  return {
    queries: queries.length ? queries : [objective.slice(0, 240)],
    sourceClasses: stringArray(value.sourceClasses).length ? stringArray(value.sourceClasses) : ['attached_sources'],
    freshnessNeed: typeof value.freshnessNeed === 'string' ? value.freshnessNeed : 'not_specified',
    timeframe: typeof value.timeframe === 'string' ? value.timeframe : null,
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildMemoBlocks(
  running: AgentRun,
  evidencePack: CapsuleEvidencePack,
  sourceabilityLedger?: SourceabilityLedger,
): SaveMemoDraftInput['blocks'] {
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
        'Open Work and revise the draft against the evidence receipt.',
        'Run Sourceability Reviewer before final export.',
        'Promote graph changes only after human approval.',
      ],
      citations: [],
      metadata: { outputDestination: 'memo_studio' },
    },
    ...(sourceabilityLedger ? [{
      id: 'claim-ledger-summary',
      type: 'bullets' as const,
      title: 'Claim ledger summary',
      content: '',
      items: [
        `${sourceabilityLedger.summary.totalClaims} material claim(s) reviewed.`,
        `${sourceabilityLedger.summary.unsupportedClaims} unsupported claim(s) remain visible.`,
        `Generated ${sourceabilityLedger.outputReadiness.generatedAt} for run ${running.id}.`,
      ],
      citations: paragraphCitation,
      metadata: {
        capsuleId: running.capsuleId,
        capsuleVersion: evidencePack.activeCapsule.version ?? null,
        agentRunId: running.id,
        sourceabilityLedgerId: sourceabilityLedger.ledgerId,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        unsupportedClaims: sourceabilityLedger.unsupportedClaims.map((claim) => claim.id),
        generatedAt: sourceabilityLedger.generatedAt,
        outputDestination: 'memo_studio',
      },
    }] : []),
  ];
}

function buildOutputCapsuleInput(
  running: AgentRun,
  evidencePack: CapsuleEvidencePack,
  memoId: string,
  sourceabilityLedger?: SourceabilityLedger,
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
        ...(sourceabilityLedger ? [{
          heading: 'Claim ledger',
          body: [
            `${sourceabilityLedger.summary.totalClaims} material claim(s) reviewed.`,
            `${sourceabilityLedger.summary.unsupportedClaims} unsupported claim(s) remain visible.`,
            `Generated ${sourceabilityLedger.outputReadiness.generatedAt}.`,
          ].join('\n'),
          citationIds: citations.map((citation) => citation.id),
        }] : []),
      ],
      sourceabilityLedgerSummary: sourceabilityLedger?.summary,
      unsupportedClaims: sourceabilityLedger?.unsupportedClaims.map((claim) => ({
        id: claim.id,
        claim: claim.claim,
        supportLabel: claim.supportLabel,
      })) ?? [],
      generatedAt: sourceabilityLedger?.generatedAt ?? new Date().toISOString(),
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

function buildBoardroomMemoBlocks(
  running: AgentRun,
  boardroom: BoardroomOutput,
): SaveMemoDraftInput['blocks'] {
  const baseMetadata = {
    runId: running.id,
    policyAgentId: 'boardroom-discussion',
    capsuleId: running.capsuleId,
    traceId: running.traceId,
  };
  return [
    {
      id: 'boardroom-title',
      type: 'heading',
      title: 'Boardroom pack',
      content: running.objective,
      citations: [],
      metadata: baseMetadata,
    },
    {
      id: 'boardroom-brief',
      type: 'paragraph',
      title: 'Meeting brief',
      content: boardroom.meetingBrief,
      citations: [],
      metadata: baseMetadata,
    },
    {
      id: 'boardroom-roster',
      type: 'bullets',
      title: 'Participant roster',
      content: '',
      items: boardroom.roster.map((participant) => `${participant.label}: ${participant.lens}`),
      citations: [],
      metadata: baseMetadata,
    },
    {
      id: 'boardroom-transcript',
      type: 'bullets',
      title: 'Turn transcript',
      content: '',
      items: boardroom.transcript.map((turn) => [
        `R${turn.round} ${boardroomParticipantLabel(turn.participantId)} (${turn.confidence})`,
        turn.claim,
        turn.critique ? `Critique: ${turn.critique}` : null,
        turn.recommendation ? `Recommendation: ${turn.recommendation}` : null,
      ].filter(Boolean).join(' - ')),
      citations: [],
      metadata: {
        ...baseMetadata,
        turnCount: boardroom.transcript.length,
      },
    },
    {
      id: 'boardroom-synthesis',
      type: 'paragraph',
      title: 'Chair synthesis',
      content: boardroom.finalSynthesis,
      citations: [],
      metadata: {
        ...baseMetadata,
        consensus: boardroom.consensus,
        divergences: boardroom.divergences,
        risks: boardroom.risks,
        openQuestions: boardroom.openQuestions,
      },
    },
    {
      id: 'boardroom-evidence-stats',
      type: 'bullets',
      title: 'Evidence and confidence stats',
      content: '',
      items: [
        `${boardroom.evidenceStats.sourceCount} source reference(s).`,
        `${boardroom.evidenceStats.documentCount} document reference(s).`,
        `${boardroom.evidenceStats.unsupportedClaimCount} unsupported claim marker(s).`,
        `Confidence distribution: high ${boardroom.confidenceDistribution.high}, medium ${boardroom.confidenceDistribution.medium}, low ${boardroom.confidenceDistribution.low}.`,
      ],
      citations: [],
      metadata: {
        ...baseMetadata,
        evidenceStats: boardroom.evidenceStats,
        confidenceDistribution: boardroom.confidenceDistribution,
      },
    },
    {
      id: 'boardroom-next-actions',
      type: 'bullets',
      title: 'Next actions',
      content: '',
      items: boardroom.nextActions.map((item) => `${item.urgency}: ${item.action} (${item.owner})`),
      citations: [],
      metadata: baseMetadata,
    },
  ];
}

function buildBoardroomOutputCapsuleInput(
  running: AgentRun,
  boardroom: BoardroomOutput,
  memoId: string,
): SaveOutputCapsuleInput {
  const citations = [
    ...stringArray(running.metadata.sourceReceiptIds).map((sourceReceiptId, index) => ({
      id: `src-${index + 1}`,
      title: sourceReceiptId,
      sourceReceiptId,
      confidence: 0.7,
    })),
    ...running.selectedCoreIds.documentCoreIds.map((documentId, index) => ({
      id: `doc-${index + 1}`,
      title: documentId,
      confidence: 0.6,
    })),
  ];
  const gaps = [
    ...boardroom.openQuestions.map((question, index) => ({
      id: `open-question-${index + 1}`,
      claim: question,
      reason: 'Boardroom run left this as an open question.',
      severity: 'medium' as const,
    })),
    ...(boardroom.evidenceStats.unsupportedClaimCount ? [{
      id: 'sourceability-gap-1',
      claim: 'Some boardroom claims remain weakly sourced.',
      reason: 'The run had limited source receipts or relied on capsule context only.',
      severity: 'high' as const,
    }] : []),
  ];
  return {
    id: `run-${running.id}-board-executive-pack`,
    situationId: running.selectedCoreIds.situationCoreId ?? running.capsuleId,
    contextCapsuleId: running.capsuleId,
    templateId: 'board-executive-pack',
    payload: {
      title: `Boardroom pack - ${running.objective.slice(0, 80)}`,
      summary: boardroom.finalSynthesis,
      meetingBrief: boardroom.meetingBrief,
      agenda: boardroom.agenda,
      roster: boardroom.roster,
      transcript: boardroom.transcript,
      topicClusters: boardroom.topicClusters,
      consensus: boardroom.consensus,
      divergences: boardroom.divergences,
      risks: boardroom.risks,
      openQuestions: boardroom.openQuestions,
      evidenceStats: boardroom.evidenceStats,
      confidenceDistribution: boardroom.confidenceDistribution,
      nextActions: boardroom.nextActions,
      memoId,
    },
    citations,
    gaps,
    provenance: {
      createdBy: running.ownerUid,
      toolIds: ['context-resolve', 'boardroom-deliberation', 'board-executive-pack', 'output-capsule-save'],
      agentIds: ['boardroom-discussion', running.id],
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
  sourceabilityLedger?: SourceabilityLedger,
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
        'Open this draft in Work for human review.',
        'Resolve flagged gaps before final export or sharing.',
        'Keep the AgentRun stream attached as the runtime proof.',
      ],
      citations: [],
      metadata: baseMetadata,
    },
    ...(sourceabilityLedger ? [{
      id: 'claim-ledger-summary',
      type: 'bullets' as const,
      title: 'Claim ledger summary',
      content: '',
      items: [
        `${sourceabilityLedger.summary.totalClaims} material claim(s) reviewed.`,
        `${sourceabilityLedger.summary.unsupportedClaims} unsupported claim(s) remain visible.`,
        `Generated ${sourceabilityLedger.outputReadiness.generatedAt} for run ${running.id}.`,
      ],
      citations: [],
      metadata: {
        ...baseMetadata,
        sourceabilityLedgerId: sourceabilityLedger.ledgerId,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        outputReadiness: sourceabilityLedger.outputReadiness,
      },
    }] : []),
  ];
}

export class AgentWorkerError extends Error {
  constructor(message: string, readonly status: number, readonly diagnostic?: AgentWorkerFailureDiagnostic) {
    super(message);
    this.name = 'AgentWorkerError';
  }
}
