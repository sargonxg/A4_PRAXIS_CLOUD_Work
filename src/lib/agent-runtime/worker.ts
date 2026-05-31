import { createHash } from 'crypto';
import { generateText as aiGenerateText, type LanguageModel } from 'ai';
import type {
  AgentApproval,
  AgentReasoningLoopResult,
  AgentRun,
  AgentToolCall,
  AgentToolRisk,
} from '@/lib/agent-runtime/types';
import { buildCapsuleReadReceiptFromEvidencePack, buildCapsuleReadReceiptFromRun, type CapsuleReadReceipt } from '@/lib/agent-runtime/capsule-read-receipt';
import {
  appendAgentApproval,
  appendAgentToolCall,
  getAgentRun,
  listAgentApprovals,
  updateAgentRunStatus,
} from '@/lib/agent-runtime/postgres';
import { saveMemoDraft, type SaveMemoDraftInput } from '@/lib/firebase/memo-service';
import { searchWeb, type WebSearchResult } from '@/lib/ai/grounded-research';
import { getDeepThinkModel, getProModel, hasServerAiProvider } from '@/lib/ai/providers';
import { getPolicyAgent, policyAgentRunIntent, type PolicyAgentOutputDestination } from '@/lib/product/policy-agents';
import { buildOutputFormatterReasoningLoop, buildResearchMemoReasoningLoop } from '@/lib/agent-runtime/reasoning-loop';
import { buildCapsuleEvidencePack, formatEvidencePackPromptBlock, type CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { buildSourceabilityLedgerFromEvidencePack, buildSourceabilityLedgerFromRun, type SourceabilityClaim, type SourceabilityLedger } from '@/lib/agent-runtime/sourceability-ledger';
import { makeAgentApproval, makeAgentToolCall } from '@/lib/agent-runtime/state';
import { getAgentToolDefinition } from '@/lib/agent-runtime/tool-registry';
import {
  normalizeAgentApprovalThreshold,
  requiresAgentApproval,
  type AgentApprovalThreshold,
} from '@/lib/agent-runtime/tool-risk';
import { buildAgentWorkflowPlan, type AgentWorkflowPlan } from '@/lib/agent-runtime/workflow-plan';
import { saveOutputCapsule, type SaveOutputCapsuleInput } from '@/lib/output-capsules/storage';
import {
  buildCapsuleWorkerContext,
  mirrorWorkerEvent,
  type AgentRuntimeMirrorDeps,
} from '@/lib/agent-runtime/mirror';
import { runCapsuleFactoryDraft, type CapsuleFactoryDeps } from '@/lib/agent-runtime/capsule-factory';
import type { CreateCapsuleReviewCardInput, CapsuleReviewCard } from '@/lib/context/capsule-service';
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
  | 'multi-agent-supervisor'
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
  listApprovals?: typeof listAgentApprovals;
  runGroundedSearch?: AgentGroundedSearchRunner;
  generateText?: AgentTextGenerator;
  createReviewCard?: (uid: string, capsuleId: string, input: CreateCapsuleReviewCardInput) => Promise<CapsuleReviewCard>;
} & AgentRuntimeMirrorDeps & CapsuleFactoryDeps;

type AgentTextGenerator = (input: {
  model?: LanguageModel;
  modelPurpose: 'pro' | 'deep-think';
  system: string;
  prompt: string;
  temperature?: number;
  providerOptions?: Record<string, unknown>;
}) => Promise<{ text: string }>;

type AgentGroundedSearchReceipt = {
  sourceReceiptId: string;
  title: string;
  url: string | null;
  snippet: string;
  provider: string | null;
  publishedDate?: string | null;
  confidence: number;
};

type AgentGroundedSearchRunner = (input: {
  run: AgentRun;
  query: string;
  objective: string;
  sourceClasses: string[];
  freshnessNeed: string;
  timeframe: string | null;
}) => Promise<{
  query: string;
  sourceReceipts: AgentGroundedSearchReceipt[];
  degradedReason: string | null;
}>;

type LiveSearchEvidence = {
  selectedToolIds: string[];
  querySet: string[];
  sourceClasses: string[];
  freshnessNeed: string;
  timeframe: string | null;
  sourceReceipts: AgentGroundedSearchReceipt[];
  sourceReceiptIds: string[];
  groundingPosture: string;
  degradedReason: string | null;
  gaps: string[];
};

type LiveMemoDraft = {
  draftText: string;
  critiqueText: string;
  finalText: string;
  modelPosture: 'live' | 'fallback';
  degradedReason: string | null;
};

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
  if (workflowKindFromMetadata(run.metadata) === 'multi_agent_review') {
    return executeMultiAgentSupervisorRun(payload, { ...deps, getRun: async () => run });
  }
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

    const reasoningGate = await emitReasoningLoopProofAndMaybePause({
      running,
      payload,
      loop,
      executionMode: 'research-memo',
      deps,
      updateStatus,
      persistToolCall,
      persistApproval,
    });
    if (reasoningGate.state !== 'continue') return reasoningGate.result;

    executionStage = 'research-plan';
    const liveResearchPlan = normalizeSearchPlan(running.metadata.searchPlan, running.objective);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'research.plan_created',
      message: 'Research Memo Agent created a live retrieval and source-check plan.',
      data: {
        querySet: liveResearchPlan.queries,
        sourceClasses: liveResearchPlan.sourceClasses,
        freshnessNeed: liveResearchPlan.freshnessNeed,
        timeframe: liveResearchPlan.timeframe,
        agentOperatingContract: agentOperatingContractFromRun(running),
        approvalSeam: 'Durable approval gates are persisted as agent_approvals rows before medium/high-risk tool execution.',
      },
    }, deps);
    const contractDecision = evaluateAgentOperatingContract(running);
    if (!contractDecision.allowed) {
      const contractGate = await pauseForApprovalGate({
        running,
        payload,
        deps,
        updateStatus,
        persistToolCall,
        persistApproval,
        executionMode: 'research-memo',
        key: 'agent-operating-contract',
        toolId: 'agent-operating-contract',
        risk: 'high',
        phase: 'agent.contract.stop_condition',
        message: contractDecision.reason,
        proposedAction: {
          kind: 'agent_operating_contract_override',
          contractDecision,
          objective: running.objective,
        },
      });
      if (contractGate.state !== 'continue') return contractGate.result;
    }

    executionStage = 'search-evidence';
    const liveSearchEvidence = await collectSearchEvidenceForRun(running, {
      appendToolCall: persistToolCall,
      appendEvent: deps.appendEvent,
      runGroundedSearch: deps.runGroundedSearch,
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
    let sourceabilityLedger = buildSourceabilityLedgerFromEvidencePack(evidencePack, {
      agentRunId: running.id,
      outputTarget: 'memo_studio',
    });
    sourceabilityLedger = verifySourceabilityLedgerWithLiveSearch(sourceabilityLedger, liveSearchEvidence);
    await emitSourceabilityLedger(running, sourceabilityLedger, deps);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'sourceability.claims_verified',
      message: 'Sourceability Reviewer checked draft claims against capsule evidence and live retrieval receipts.',
      data: {
        ledgerId: sourceabilityLedger.ledgerId,
        checkedClaimCount: sourceabilityLedger.summary.totalClaims,
        unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
        weakClaimCount: sourceabilityLedger.summary.weakClaims,
        contradictedClaimCount: sourceabilityLedger.summary.contradictedClaims,
        liveSourceReceiptCount: liveSearchEvidence.sourceReceiptIds.length,
        sourceReceiptIds: liveSearchEvidence.sourceReceiptIds,
      },
    }, deps);
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
        checkedClaimCount: sourceabilityLedger.summary.totalClaims,
        liveSourceReceiptCount: liveSearchEvidence.sourceReceiptIds.length,
        sourceReceiptIds: liveSearchEvidence.sourceReceiptIds,
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
    executionStage = 'memo-draft';
    const liveMemoDraft = await draftAndCritiqueMemo(running, evidencePack, sourceabilityLedger, liveSearchEvidence, deps);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'memo.draft_created',
      message: liveMemoDraft.modelPosture === 'live'
        ? 'Research Memo Agent drafted memo text with inline source receipts.'
        : 'Research Memo Agent produced a fallback memo draft because the model runtime was unavailable.',
      data: {
        modelPosture: liveMemoDraft.modelPosture,
        degradedReason: liveMemoDraft.degradedReason,
        sourceReceiptIds: liveSearchEvidence.sourceReceiptIds,
        unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
      },
    }, deps);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'memo.self_critique_completed',
      message: 'Research Memo Agent completed sourceability self-critique before finalizing the artifact.',
      data: {
        critiquePreview: liveMemoDraft.critiqueText.slice(0, 900),
        unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
        weakClaimCount: sourceabilityLedger.summary.weakClaims,
      },
    }, deps);

    executionStage = 'memo-persist';
    const combinedSourceReceiptIds = uniqueStrings([
      ...evidencePack.sourceReceiptIds,
      ...evidencePack.sourcedParagraphs.map((paragraph) => paragraph.sourceReceiptId).filter((value): value is string => Boolean(value)),
      ...liveSearchEvidence.sourceReceiptIds,
    ]);
    const claimChecks = sourceabilityLedger.claims.map((claim) => ({
      id: claim.id,
      claim: claim.claim,
      status: claim.supportLabel,
      confidence: claim.confidence,
      sourceReceiptIds: claim.sourceReceiptIds,
      documentParagraphIds: claim.documentParagraphIds,
      reviewNote: claim.reviewNote,
    }));
    const unsupportedClaims = sourceabilityLedger.unsupportedClaims.map((claim) => claim.claim);
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId,
      templateId: 'policy-memo',
      title,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:graph-gap`,
      changeNote: `Created by Research Memo Agent run ${running.id}.`,
      capsuleId: running.capsuleId,
      capsuleVersion: evidencePack.activeCapsule.version ?? null,
      runId: running.id,
      outputTarget: 'policy-memo',
      sourceReceiptIds: combinedSourceReceiptIds,
      sourceReceipts: liveSearchEvidence.sourceReceipts,
      unsupportedClaims,
      claimChecks,
      blocks: buildMemoBlocks(running, evidencePack, sourceabilityLedger, {
        liveMemoDraft,
        liveSearchEvidence,
        combinedSourceReceiptIds,
      }),
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
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'artifact.finalized',
      message: 'Research Memo Agent finalized the memo artifact link and sourceability gate receipt.',
      data: {
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        sourceReceiptIds: combinedSourceReceiptIds,
        unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
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

async function executeMultiAgentSupervisorRun(
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
      executionMode: 'multi-agent-supervisor',
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
        message: 'Multi-agent supervisor accepted the queued capsule run.',
        data: {
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
          requestedAt: payload.requestedAt,
          executionMode: 'multi-agent-supervisor',
        },
      });
      if (!next) throw new AgentWorkerError('Agent run disappeared before execution', 404);
      running = { ...next, metadata: { ...run.metadata, ...next.metadata } };
    }

    executionStage = 'supervisor-approval';
    const approvalThreshold = approvalThresholdFromRun(running);
    if (requiresAgentApproval('medium', approvalThreshold)) {
      const supervisorGate = await pauseForApprovalGate({
        running,
        payload,
        deps,
        updateStatus,
        persistToolCall,
        persistApproval,
        executionMode: 'multi-agent-supervisor',
        key: 'supervisor:multi-agent-review',
        toolId: 'multi-agent-review',
        risk: 'medium',
        phase: 'supervisor.approval_gate',
        message: 'Multi-agent review will run research, drafting, red-team, and revise agents before saving the final memo.',
        proposedAction: {
          kind: 'multi_agent_review',
          approvalThreshold,
          rounds: ['research', 'drafting', 'red-team', 'revise'],
          maxRounds: 1,
          objective: running.objective,
        },
      });
      if (supervisorGate.state !== 'continue') return supervisorGate.result;
    }

    executionStage = 'context-resolved';
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'supervisor.graph.created',
      message: 'Multi-agent supervisor created the bounded agent graph.',
      data: {
        agentGraph: [
          { agentId: 'research-agent', consumes: ['capsule', 'searchPlan'], produces: ['evidencePack', 'sourceReceipts'] },
          { agentId: 'drafting-agent', consumes: ['evidencePack', 'sourceReceipts'], produces: ['draftMemo'] },
          { agentId: 'red-team-agent', consumes: ['draftMemo', 'claimLedger'], produces: ['redTeamFindings'] },
          { agentId: 'revise-agent', consumes: ['draftMemo', 'redTeamFindings'], produces: ['finalMemo'] },
        ],
        maxRounds: 1,
        executionMode: 'multi-agent-supervisor',
      },
    }, deps);
    const initialWorkflowProof = await emitCapsuleReadAndWorkflowPlan(running, deps);

    executionStage = 'search-evidence';
    const liveSearchEvidence = await collectSearchEvidenceForRun(running, {
      appendToolCall: persistToolCall,
      appendEvent: deps.appendEvent,
      runGroundedSearch: deps.runGroundedSearch,
    });

    executionStage = 'research-agent';
    const evidencePack = await getEvidencePack({
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      objective: running.objective,
      maxParagraphs: 10,
    });
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'capsule-evidence-pack',
      risk: getAgentToolDefinition('capsule-evidence-pack').risk,
      status: 'succeeded',
      input: { objective: running.objective, supervisorAgentId: 'research-agent' },
      output: {
        packId: evidencePack.packId,
        sourceReceiptIds: uniqueStrings([...evidencePack.sourceReceiptIds, ...liveSearchEvidence.sourceReceiptIds]),
        paragraphCount: evidencePack.sourcedParagraphs.length,
      },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'supervisor.agent.research.succeeded',
      message: 'Research agent produced the evidence pack and source receipt set for downstream drafting.',
      data: {
        agentId: 'research-agent',
        consumes: ['capsule', 'searchPlan'],
        produces: ['evidencePack', 'sourceReceipts'],
        evidencePackId: evidencePack.packId,
        sourceReceiptIds: uniqueStrings([...evidencePack.sourceReceiptIds, ...liveSearchEvidence.sourceReceiptIds]),
        paragraphCount: evidencePack.sourcedParagraphs.length,
      },
    }, deps);

    executionStage = 'sourceability-ledger';
    const capsuleReadReceipt = buildCapsuleReadReceiptFromEvidencePack(evidencePack, {
      selectedTools: initialWorkflowProof.workflowPlan.selectedTools,
      outputTarget: outputDestinationFromMetadata(running.metadata) ?? 'memo_studio',
      groundingPosture: initialWorkflowProof.capsuleReadReceipt.groundingPosture,
    });
    const workflowPlan = buildAgentWorkflowPlan({
      prompt: running.objective,
      runIntent: 'red_team_review',
      policyAgentId: 'red-team-analyst',
      selectedToolIds: initialWorkflowProof.workflowPlan.selectedTools,
      outputTarget: outputDestinationFromMetadata(running.metadata) ?? 'memo_studio',
      capsuleReadReceipt,
      groundingPosture: capsuleReadReceipt.groundingPosture,
    });
    let sourceabilityLedger = buildSourceabilityLedgerFromEvidencePack(evidencePack, {
      agentRunId: running.id,
      outputTarget: 'memo_studio',
    });
    sourceabilityLedger = verifySourceabilityLedgerWithLiveSearch(sourceabilityLedger, liveSearchEvidence);
    await emitSourceabilityLedger(running, sourceabilityLedger, deps);

    executionStage = 'drafting-agent';
    const liveMemoDraft = await draftAndCritiqueMemo(running, evidencePack, sourceabilityLedger, liveSearchEvidence, deps);
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'policy-memo',
      risk: getAgentToolDefinition('policy-memo').risk,
      status: 'succeeded',
      input: { evidencePackId: evidencePack.packId, supervisorAgentId: 'drafting-agent' },
      output: { draftLength: liveMemoDraft.finalText.length },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'supervisor.agent.drafting.succeeded',
      message: 'Drafting agent consumed research output and produced the first memo draft.',
      data: {
        agentId: 'drafting-agent',
        consumes: ['evidencePack', 'sourceReceipts', 'claimLedger'],
        produces: ['draftMemo'],
        evidencePackId: evidencePack.packId,
        sourceabilityLedgerId: sourceabilityLedger.ledgerId,
        unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
      },
    }, deps);

    executionStage = 'red-team-agent';
    const redTeamText = await generateRedTeamFindings(running, liveMemoDraft.finalText, sourceabilityLedger, deps);
    const redTeamFindings = redTeamFindingsFromText(redTeamText);
    await persistToolCall(makeAgentToolCall({
      runId: running.id,
      ownerUid: running.ownerUid,
      capsuleId: running.capsuleId,
      toolId: 'red-team-review',
      risk: getAgentToolDefinition('red-team-review').risk,
      status: 'succeeded',
      input: { draftLength: liveMemoDraft.finalText.length, supervisorAgentId: 'red-team-agent' },
      output: { findings: redTeamFindings },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'supervisor.agent.red_team.succeeded',
      message: 'Red-team agent challenged the draft and produced revision findings.',
      data: {
        agentId: 'red-team-agent',
        consumes: ['draftMemo', 'claimLedger'],
        produces: ['redTeamFindings'],
        findings: redTeamFindings,
        findingCount: redTeamFindings.length,
      },
    }, deps);

    executionStage = 'revise-agent';
    const finalMemoText = await reviseMemoWithRedTeamFindings(running, liveMemoDraft.finalText, redTeamFindings, deps);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'supervisor.agent.revise.succeeded',
      message: 'Revise agent consumed red-team findings and produced the final memo.',
      data: {
        agentId: 'revise-agent',
        consumes: ['draftMemo', 'redTeamFindings'],
        produces: ['finalMemo'],
        addressedFindings: redTeamFindings,
        finalTextPreview: finalMemoText.slice(0, 500),
      },
    }, deps);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'supervisor.graph.updated',
      message: 'Multi-agent supervisor recorded the consumed and produced artifacts for the proof rail.',
      data: {
        edges: [
          { from: 'research-agent', to: 'drafting-agent', artifact: 'evidencePack' },
          { from: 'drafting-agent', to: 'red-team-agent', artifact: 'draftMemo' },
          { from: 'red-team-agent', to: 'revise-agent', artifact: 'redTeamFindings' },
        ],
        finalAgentId: 'revise-agent',
      },
    }, deps);

    executionStage = 'memo-persist';
    const combinedSourceReceiptIds = uniqueStrings([
      ...evidencePack.sourceReceiptIds,
      ...evidencePack.sourcedParagraphs.map((paragraph) => paragraph.sourceReceiptId).filter((value): value is string => Boolean(value)),
      ...liveSearchEvidence.sourceReceiptIds,
    ]);
    const memoRecord = await persistMemo(running.ownerUid, {
      caseId: running.selectedCoreIds.situationCoreId ?? running.capsuleId,
      templateId: 'policy-memo',
      title: `Multi-agent review - ${running.objective.slice(0, 72)}`,
      graphSnapshotId: running.selectedCoreIds.graphCoreId ?? `capsule:${running.capsuleId}:multi-agent-review`,
      changeNote: `Created by multi-agent supervisor run ${running.id}.`,
      capsuleId: running.capsuleId,
      capsuleVersion: evidencePack.activeCapsule.version ?? null,
      runId: running.id,
      outputTarget: 'policy-memo',
      sourceReceiptIds: combinedSourceReceiptIds,
      sourceReceipts: liveSearchEvidence.sourceReceipts,
      unsupportedClaims: sourceabilityLedger.unsupportedClaims.map((claim) => claim.claim),
      claimChecks: sourceabilityLedger.claims.map((claim) => ({
        id: claim.id,
        claim: claim.claim,
        status: claim.supportLabel,
        confidence: claim.confidence,
        sourceReceiptIds: claim.sourceReceiptIds,
        documentParagraphIds: claim.documentParagraphIds,
        reviewNote: claim.reviewNote,
      })),
      blocks: buildMultiAgentReviewMemoBlocks(running, {
        evidencePack,
        sourceabilityLedger,
        liveMemoDraft,
        liveSearchEvidence,
        finalMemoText,
        redTeamFindings,
        combinedSourceReceiptIds,
      }),
    });
    const outputCapsule = await persistOutputCapsule(
      running.ownerUid,
      buildOutputCapsuleInput(running, evidencePack, memoRecord.memo.id, sourceabilityLedger),
    );
    const outputHref = outputCapsule?.id
      ? `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}&outputCapsuleId=${encodeURIComponent(outputCapsule.id)}`
      : `/app?panel=memo&memoId=${encodeURIComponent(memoRecord.memo.id)}`;

    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'artifact.finalized',
      message: 'Multi-agent supervisor finalized the memo after red-team revision.',
      data: {
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        sourceReceiptIds: combinedSourceReceiptIds,
        redTeamFindings,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
      },
    }, deps);

    executionStage = 'succeeded-transition';
    const succeeded = await updateStatus({
      ownerUid: running.ownerUid,
      runId: running.id,
      toStatus: 'succeeded',
      message: 'Multi-agent supervisor completed research, drafting, red-team, and revision.',
      data: {
        dispatchId: payload.dispatchId,
        attempt: payload.attempt,
        executionMode: 'multi-agent-supervisor',
        memoId: memoRecord.memo.id,
        outputCapsuleId: outputCapsule?.id ?? null,
        outputHref,
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary: sourceabilityLedger.summary,
        selectedTools: workflowPlan.selectedTools,
        groundingPosture: workflowPlan.groundingPosture,
        redTeamFindings,
      },
    });

    return {
      runId: succeeded?.id ?? running.id,
      status: succeeded?.status ?? 'succeeded',
      executionMode: 'multi-agent-supervisor',
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
      executionMode: 'multi-agent-supervisor',
      failedPhase: executionStage,
      message: 'Multi-agent supervisor failed before creating the revised memo.',
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
    let streamedTurnCount = 0;
    let streamedSynthesis = false;
    const boardroom = await runBoardroomDiscussion({
      run: running,
      payload,
      evidencePack,
      onTurn: async (event) => {
        streamedTurnCount += 1;
        await mirrorWorkerEvent(running, {
          substrate: 'praxis',
          phase: `boardroom.turn.${event.turn.participantId}`,
          message: `${boardroomParticipantLabel(event.turn.participantId)} completed boardroom turn ${event.turn.round}.`,
          data: {
            modelPolicy: BOARDROOM_MODEL_POLICY_ID,
            participantId: event.turn.participantId,
            participantRole: event.participant.role,
            agent: {
              id: event.turn.participantId,
              label: event.participant.label,
              role: event.participant.role,
            },
            consumes: {
              capsuleId: running.capsuleId,
              evidencePackId: evidencePack.packId,
              sourceReceiptIds: evidencePack.sourceReceiptIds,
              priorTurnCount: streamedTurnCount - 1,
            },
            produces: {
              turnId: event.turn.turnId,
              evidenceRefs: event.turn.evidenceRefs,
              confidence: event.turn.confidence,
              unsupported: event.turn.state === 'unsupported',
            },
            round: event.turn.round,
            turn: event.turn,
            state: event.turn.state,
            confidence: event.turn.confidence,
            evidenceRefs: event.turn.evidenceRefs,
            rejectedEvidenceRefs: event.rejectedEvidenceRefs,
            evidenceHallucinationCount: event.rejectedEvidenceRefs.length,
            sourceCount: evidencePack.sourceReceiptIds.length,
            documentCount: running.selectedCoreIds.documentCoreIds.length,
          },
        }, deps);
        if (event.rejectedEvidenceRefs.length) {
          await mirrorWorkerEvent(running, {
            substrate: 'praxis',
            phase: 'boardroom.evidence_ref_rejected',
            message: `${boardroomParticipantLabel(event.turn.participantId)} cited unavailable evidence refs; PRAXIS rejected them.`,
            data: {
              modelPolicy: BOARDROOM_MODEL_POLICY_ID,
              participantId: event.turn.participantId,
              round: event.turn.round,
              rejectedEvidenceRefs: event.rejectedEvidenceRefs,
              turnId: event.turn.turnId,
              evalSignal: 'boardroom_evidence_ref_hallucination',
            },
          }, deps);
        }
      },
      onSynthesis: async (event) => {
        streamedSynthesis = true;
        await mirrorWorkerEvent(running, {
          substrate: 'praxis',
          phase: 'boardroom.synthesis_created',
          message: 'Synthesis Chair created the final boardroom synthesis.',
          data: {
            modelPolicy: BOARDROOM_MODEL_POLICY_ID,
            finalSynthesis: event.output.finalSynthesis,
            agent: {
              id: 'synthesis-chair',
              label: boardroomParticipantLabel('synthesis-chair'),
              role: 'chair',
            },
            consumes: {
              capsuleId: running.capsuleId,
              transcriptTurnIds: event.output.transcript.map((turn) => turn.turnId),
              evidenceStats: event.output.evidenceStats,
            },
            produces: {
              artifactKind: 'board_executive_pack',
              consensusCount: event.output.consensus.length,
              riskCount: event.output.risks.length,
              nextActionCount: event.output.nextActions.length,
            },
            consensus: event.output.consensus,
            divergences: event.output.divergences,
            risks: event.output.risks,
            openQuestions: event.output.openQuestions,
            evidenceStats: event.output.evidenceStats,
          },
        }, deps);
      },
    });
    const boardroomLatencyMs = Date.now() - boardroomStartedAt;

    if (streamedTurnCount === 0) {
      for (const turn of boardroom.transcript) {
        await mirrorWorkerEvent(running, {
          substrate: 'praxis',
          phase: `boardroom.turn.${turn.participantId}`,
          message: `${boardroomParticipantLabel(turn.participantId)} completed boardroom turn ${turn.round}.`,
          data: {
            modelPolicy: BOARDROOM_MODEL_POLICY_ID,
            participantId: turn.participantId,
            agent: {
              id: turn.participantId,
              label: boardroomParticipantLabel(turn.participantId),
              role: null,
            },
            consumes: {
              capsuleId: running.capsuleId,
              evidencePackId: evidencePack.packId,
              sourceReceiptIds: evidencePack.sourceReceiptIds,
            },
            produces: {
              turnId: turn.turnId,
              evidenceRefs: turn.evidenceRefs,
              confidence: turn.confidence,
              unsupported: turn.state === 'unsupported',
            },
            round: turn.round,
            turn,
            state: turn.state,
            confidence: turn.confidence,
            evidenceRefs: turn.evidenceRefs,
            rejectedEvidenceRefs: turn.unsupportedEvidenceRefs ?? [],
            evidenceHallucinationCount: turn.unsupportedEvidenceRefs?.length ?? 0,
            sourceCount: boardroom.evidenceStats.sourceCount,
            documentCount: boardroom.evidenceStats.documentCount,
          },
        }, deps);
      }
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

    if (!streamedSynthesis) {
      await mirrorWorkerEvent(running, {
        substrate: 'praxis',
        phase: 'boardroom.synthesis_created',
        message: 'Synthesis Chair created the final boardroom synthesis.',
        data: {
          modelPolicy: BOARDROOM_MODEL_POLICY_ID,
          latencyMs: boardroomLatencyMs,
          finalSynthesis: boardroom.finalSynthesis,
          agent: {
            id: 'synthesis-chair',
            label: boardroomParticipantLabel('synthesis-chair'),
            role: 'chair',
          },
          consumes: {
            capsuleId: running.capsuleId,
            transcriptTurnIds: boardroom.transcript.map((turn) => turn.turnId),
            evidenceStats: boardroom.evidenceStats,
          },
          produces: {
            artifactKind: 'board_executive_pack',
            consensusCount: boardroom.consensus.length,
            riskCount: boardroom.risks.length,
            nextActionCount: boardroom.nextActions.length,
          },
          consensus: boardroom.consensus,
          divergences: boardroom.divergences,
          risks: boardroom.risks,
          openQuestions: boardroom.openQuestions,
          evidenceStats: boardroom.evidenceStats,
        },
      }, deps);
    }

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

    const reasoningGate = await emitReasoningLoopProofAndMaybePause({
      running,
      payload,
      loop,
      executionMode: 'output-formatter',
      deps,
      updateStatus,
      persistToolCall,
      persistApproval,
    });
    if (reasoningGate.state !== 'continue') return reasoningGate.result;

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
    let sourceabilityLedger = buildSourceabilityLedgerFromRun(running, {
      outputTarget: executionMode === 'handover-builder' ? 'handover' : 'memo_studio',
    });
    if (executionMode === 'sourceability-reviewer') {
      const liveSearchEvidence = await collectSearchEvidenceForRun(running, {
        appendToolCall: persistToolCall,
        appendEvent: deps.appendEvent,
        runGroundedSearch: deps.runGroundedSearch,
      });
      sourceabilityLedger = verifySourceabilityLedgerWithLiveSearch(sourceabilityLedger, liveSearchEvidence);
      await mirrorWorkerEvent(running, {
        substrate: 'praxis',
        phase: 'sourceability.claims_verified',
        message: 'Sourceability Reviewer checked draft claims against live retrieval receipts.',
        data: {
          ledgerId: sourceabilityLedger.ledgerId,
          checkedClaimCount: sourceabilityLedger.summary.totalClaims,
          unsupportedClaimCount: sourceabilityLedger.summary.unsupportedClaims,
          weakClaimCount: sourceabilityLedger.summary.weakClaims,
          liveSourceReceiptCount: liveSearchEvidence.sourceReceiptIds.length,
          sourceReceiptIds: liveSearchEvidence.sourceReceiptIds,
        },
      }, deps);
    }
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
      capsuleId: running.capsuleId,
      runId: running.id,
      outputTarget: executionMode === 'handover-builder' ? 'handover' : 'policy-memo',
      sourceReceiptIds: uniqueStrings(sourceabilityLedger.claims.flatMap((claim) => claim.sourceReceiptIds)),
      unsupportedClaims: sourceabilityLedger.unsupportedClaims.map((claim) => claim.claim),
      claimChecks: sourceabilityLedger.claims.map((claim) => ({
        id: claim.id,
        claim: claim.claim,
        status: claim.supportLabel,
        confidence: claim.confidence,
        sourceReceiptIds: claim.sourceReceiptIds,
        documentParagraphIds: claim.documentParagraphIds,
        reviewNote: claim.reviewNote,
      })),
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

type ApprovalGateOutcome =
  | { state: 'continue' }
  | { state: 'waiting' | 'failed'; result: ExecuteAgentRunResult };

async function emitReasoningLoopProofAndMaybePause(input: {
  running: AgentRun;
  payload: ExecuteAgentRunPayload;
  loop: AgentReasoningLoopResult;
  executionMode: AgentRunExecutionMode;
  deps: WorkerDeps;
  updateStatus: typeof updateAgentRunStatus;
  persistToolCall: typeof appendAgentToolCall;
  persistApproval: typeof appendAgentApproval;
}): Promise<ApprovalGateOutcome> {
  for (const step of input.loop.steps) {
    if (step.requiresApproval) {
      const gate = await pauseForApprovalGate({
        running: input.running,
        payload: input.payload,
        deps: input.deps,
        updateStatus: input.updateStatus,
        persistToolCall: input.persistToolCall,
        persistApproval: input.persistApproval,
        executionMode: input.executionMode,
        key: `reasoning:${step.id}`,
        toolId: step.toolId ?? step.id,
        risk: step.risk,
        phase: `reasoning.${step.phase}`,
        message: step.message,
        proposedAction: {
          kind: 'reasoning_step',
          stepId: step.id,
          toolId: step.toolId,
          receiptId: step.receiptId,
          objective: input.running.objective,
          approvalReason: input.loop.nextApprovalReason ?? `${step.toolId ?? step.id} requires approval before execution.`,
        },
        receiptId: step.receiptId,
      });
      if (gate.state !== 'continue') return gate;
      continue;
    }

    const toolCall = step.toolId
      ? makeStableAgentToolCall(input.running, `reasoning:${step.id}`, {
          toolId: step.toolId,
          risk: step.risk,
          status: 'planned',
          input: {
            objective: input.running.objective,
            stepId: step.id,
            receiptId: step.receiptId,
          },
        })
      : null;
    if (toolCall) await persistIgnoringDuplicate(() => input.persistToolCall(toolCall));
    await mirrorWorkerEvent(input.running, {
      substrate: 'praxis',
      phase: `reasoning.${step.phase}`,
      message: step.message,
      data: {
        stepId: step.id,
        toolId: step.toolId,
        risk: step.risk,
        requiresApproval: false,
        receiptId: step.receiptId,
        stoppedForApproval: input.loop.stoppedForApproval,
        toolCallId: toolCall?.id ?? null,
      },
    }, input.deps);
  }

  return { state: 'continue' };
}

async function pauseForApprovalGate(input: {
  running: AgentRun;
  payload: ExecuteAgentRunPayload;
  deps: WorkerDeps;
  updateStatus: typeof updateAgentRunStatus;
  persistToolCall: typeof appendAgentToolCall;
  persistApproval: typeof appendAgentApproval;
  executionMode: AgentRunExecutionMode;
  key: string;
  toolId: string;
  risk: AgentToolRisk;
  phase: string;
  message: string;
  proposedAction: Record<string, unknown>;
  receiptId?: string | null;
}): Promise<ApprovalGateOutcome> {
  const toolCallId = stableToolCallId(input.running, input.key, input.toolId);
  const approvalId = stableApprovalId(input.running, input.key, input.toolId);
  const approvals = await listApprovalsForRun(input.running, input.deps);
  const existing = approvals.find((approval) => approval.id === approvalId);

  if (existing?.status === 'approved') {
    await mirrorWorkerEvent(input.running, {
      substrate: 'praxis',
      phase: input.phase,
      message: `${input.message} Approved; worker resumed from persisted approval ${existing.id}.`,
      data: {
        ...input.proposedAction,
        approvalId: existing.id,
        toolCallId,
        risk: input.risk,
        requiresApproval: true,
        approvalStatus: 'approved',
        receiptId: input.receiptId ?? null,
      },
    }, input.deps);
    await mirrorWorkerEvent(input.running, {
      substrate: 'praxis',
      phase: 'approval.granted',
      message: 'Persisted owner approval found; worker resumed the saved checkpoint.',
      data: {
        approvalId: existing.id,
        toolCallId,
        toolId: input.toolId,
        risk: input.risk,
        receiptId: input.receiptId ?? null,
      },
    }, input.deps);
    return { state: 'continue' };
  }

  if (existing?.status === 'rejected') {
    const failed = await input.updateStatus({
      ownerUid: input.running.ownerUid,
      runId: input.running.id,
      toStatus: 'failed',
      message: 'Agent run stopped because a persisted approval was rejected.',
      data: {
        dispatchId: input.payload.dispatchId,
        attempt: input.payload.attempt,
        executionMode: input.executionMode,
        approvalId: existing.id,
        toolCallId,
        toolId: input.toolId,
        risk: input.risk,
      },
    });
    return {
      state: 'failed',
      result: {
        runId: failed?.id ?? input.running.id,
        status: failed?.status ?? 'failed',
        executionMode: input.executionMode,
        traceId: input.running.traceId,
      },
    };
  }

  const toolCall = makeStableAgentToolCall(input.running, input.key, {
    toolId: input.toolId,
    risk: input.risk,
    status: 'waiting_approval',
    input: {
      objective: input.running.objective,
      proposedAction: input.proposedAction,
      receiptId: input.receiptId ?? null,
      approvalId,
    },
  });
  const approval: AgentApproval = {
    ...makeAgentApproval({
      runId: input.running.id,
      ownerUid: input.running.ownerUid,
      capsuleId: input.running.capsuleId,
      toolCallId,
      risk: input.risk,
      reason: input.message,
    }),
    id: approvalId,
  };

  if (!existing) {
    await persistIgnoringDuplicate(() => input.persistToolCall(toolCall));
    await persistIgnoringDuplicate(() => input.persistApproval(approval));
  }
  await mirrorWorkerEvent(input.running, {
    substrate: 'praxis',
    phase: input.phase,
    message: input.message,
    data: {
      ...input.proposedAction,
      approvalId,
      toolCallId,
      risk: input.risk,
      requiresApproval: true,
      approvalStatus: 'pending',
      receiptId: input.receiptId ?? null,
    },
  }, input.deps);
  await mirrorWorkerEvent(input.running, {
    substrate: 'praxis',
    phase: 'approval.required',
    message: input.message,
    data: {
      approvalId,
      toolCallId,
      toolId: input.toolId,
      risk: input.risk,
      proposedAction: input.proposedAction,
      receiptId: input.receiptId ?? null,
      dispatchId: input.payload.dispatchId,
      attempt: input.payload.attempt,
    },
  }, input.deps);
  const waiting = await input.updateStatus({
    ownerUid: input.running.ownerUid,
    runId: input.running.id,
    toStatus: 'waiting_approval',
    message: input.message,
    data: {
      dispatchId: input.payload.dispatchId,
      attempt: input.payload.attempt,
      executionMode: input.executionMode,
      approvalId,
      toolCallId,
      toolId: input.toolId,
      risk: input.risk,
      proposedAction: input.proposedAction,
    },
  });
  return {
    state: 'waiting',
    result: {
      runId: waiting?.id ?? input.running.id,
      status: waiting?.status ?? 'waiting_approval',
      executionMode: input.executionMode,
      traceId: input.running.traceId,
    },
  };
}

function makeStableAgentToolCall(
  run: AgentRun,
  key: string,
  input: Omit<Parameters<typeof makeAgentToolCall>[0], 'runId' | 'ownerUid' | 'capsuleId'>,
): AgentToolCall {
  return {
    ...makeAgentToolCall({
      runId: run.id,
      ownerUid: run.ownerUid,
      capsuleId: run.capsuleId,
      ...input,
    }),
    id: stableToolCallId(run, key, input.toolId),
  };
}

async function listApprovalsForRun(run: AgentRun, deps: WorkerDeps): Promise<AgentApproval[]> {
  const listApprovals = deps.listApprovals ?? listAgentApprovals;
  return listApprovals({ ownerUid: run.ownerUid, runId: run.id });
}

async function persistIgnoringDuplicate<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (err) {
    if (isDuplicateKeyError(err)) return null;
    throw err;
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code?: unknown }).code) : '';
  const message = err instanceof Error ? err.message : String(err);
  return code === '23505' || /duplicate key|unique constraint/i.test(message);
}

function stableToolCallId(run: AgentRun, key: string, toolId: string): string {
  return `tool:${stableShortId(`${run.id}:${key}:${toolId}`)}`;
}

function stableApprovalId(run: AgentRun, key: string, toolId: string): string {
  return `approval:${stableShortId(`${run.id}:${key}:${toolId}`)}`;
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

async function generateRedTeamFindings(
  running: AgentRun,
  draftText: string,
  sourceabilityLedger: SourceabilityLedger,
  deps: Pick<WorkerDeps, 'generateText'>,
): Promise<string> {
  try {
    return (await generateAgentText(deps, {
      modelPurpose: 'deep-think',
      system: 'You are the PRAXIS red-team analyst. Challenge assumptions, weak sources, option framing, and unsupported claims without inventing new evidence.',
      prompt: [
        `Objective: ${running.objective}`,
        'Draft memo:',
        draftText,
        claimLedgerPromptBlock(sourceabilityLedger),
        'Return concise findings that the revise agent must address.',
      ].join('\n\n'),
      temperature: 0,
      providerOptions: { google: { thinking_level: 'high' } },
    })).text.trim();
  } catch {
    const blockers = sourceabilityLedger.unsupportedClaims.map((claim) => claim.claim);
    return [
      'Verify weak or unsupported claims before export.',
      blockers.length ? `Unsupported claim pressure: ${blockers.slice(0, 3).join(' | ')}` : 'Check whether the recommendation depends on hidden assumptions not present in the capsule.',
      'Make the revision explicitly identify caveats and decision dependencies.',
    ].join('\n');
  }
}

async function reviseMemoWithRedTeamFindings(
  running: AgentRun,
  draftText: string,
  redTeamFindings: string[],
  deps: Pick<WorkerDeps, 'generateText'>,
): Promise<string> {
  let revised: string;
  try {
    revised = (await generateAgentText(deps, {
      modelPurpose: 'pro',
      system: 'You are the PRAXIS revise agent. Revise only the supplied draft and explicitly address red-team findings.',
      prompt: [
        `Objective: ${running.objective}`,
        'Draft memo:',
        draftText,
        'Red-team findings to address:',
        redTeamFindings.map((finding, index) => `${index + 1}. ${finding}`).join('\n'),
        'Return the revised memo. Include a short section naming the red-team findings addressed.',
      ].join('\n\n'),
      temperature: 0.15,
    })).text.trim();
  } catch {
    revised = draftText;
  }
  return [
    revised,
    '',
    'Red-team findings addressed in revision:',
    ...redTeamFindings.map((finding, index) => `${index + 1}. Addressed: ${finding}`),
  ].join('\n').trim();
}

function redTeamFindingsFromText(text: string): string[] {
  const findings = text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
  return findings.length ? findings : ['Red-team review found no discrete finding; human review remains required before export.'];
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

function workflowKindFromMetadata(metadata: Record<string, unknown>): string | null {
  if (typeof metadata.workflowKind === 'string') return metadata.workflowKind;
  if (typeof metadata.runIntent === 'string') return metadata.runIntent;
  const workflowPlan = isRecord(metadata.workflowPlan) ? metadata.workflowPlan : null;
  return typeof workflowPlan?.workflowKind === 'string' ? workflowPlan.workflowKind : null;
}

function approvalThresholdFromRun(run: AgentRun): AgentApprovalThreshold {
  const contract = isRecord(run.metadata.agentOperatingContract) ? run.metadata.agentOperatingContract : {};
  return normalizeAgentApprovalThreshold(contract.approvalThreshold)
    ?? normalizeAgentApprovalThreshold(contract.approvalRiskThreshold)
    ?? normalizeAgentApprovalThreshold(run.metadata.approvalThreshold)
    ?? normalizeAgentApprovalThreshold(run.metadata.approvalRiskThreshold)
    ?? 'medium';
}

function outputDestinationFromMetadata(metadata: Record<string, unknown>): PolicyAgentOutputDestination | null {
  const destination = metadata.outputDestination;
  return destination === 'memo_studio' || destination === 'canvas' || destination === 'library' || destination === 'handover'
    ? destination
    : null;
}

async function collectSearchEvidenceForRun(
  running: AgentRun,
  deps: Pick<WorkerDeps, 'appendToolCall' | 'appendEvent' | 'runGroundedSearch'>,
): Promise<LiveSearchEvidence> {
  const persistToolCall = deps.appendToolCall ?? appendAgentToolCall;
  const selectedToolIds = selectedSearchToolIds(running);
  const searchPlan = normalizeSearchPlan(running.metadata.searchPlan, running.objective);
  if (!selectedToolIds.length) {
    return {
      selectedToolIds: [],
      querySet: searchPlan.queries,
      sourceClasses: searchPlan.sourceClasses,
      freshnessNeed: searchPlan.freshnessNeed,
      timeframe: searchPlan.timeframe,
      sourceReceipts: [],
      sourceReceiptIds: [],
      groundingPosture: 'No search tool selected',
      degradedReason: null,
      gaps: [],
    };
  }

  let sourceReceipts: AgentGroundedSearchReceipt[] = [];
  let liveSearchError: string | null = null;
  if (deps.runGroundedSearch || shouldUseDefaultLiveSearch()) {
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: 'grounding.live_retrieval_started',
      message: 'Agent worker started live grounded retrieval.',
      data: {
        selectedToolIds,
        querySet: searchPlan.queries,
        sourceClasses: searchPlan.sourceClasses,
        freshnessNeed: searchPlan.freshnessNeed,
      },
    }, deps);
    for (const query of searchPlan.queries) {
      try {
        const result = deps.runGroundedSearch
          ? await deps.runGroundedSearch({
              run: running,
              query,
              objective: running.objective,
              sourceClasses: searchPlan.sourceClasses,
              freshnessNeed: searchPlan.freshnessNeed,
              timeframe: searchPlan.timeframe,
            })
          : await runDefaultGroundedSearch({
              run: running,
              query,
              objective: running.objective,
              sourceClasses: searchPlan.sourceClasses,
              freshnessNeed: searchPlan.freshnessNeed,
              timeframe: searchPlan.timeframe,
            });
        sourceReceipts.push(...result.sourceReceipts);
        if (result.degradedReason) liveSearchError = result.degradedReason;
      } catch (err) {
        liveSearchError = err instanceof Error ? err.message : String(err);
      }
    }
    sourceReceipts = dedupeSourceReceipts(sourceReceipts);
    await mirrorWorkerEvent(running, {
      substrate: 'praxis',
      phase: sourceReceipts.length ? 'grounding.live_retrieval_succeeded' : 'grounding.live_retrieval_degraded',
      message: sourceReceipts.length
        ? 'Live grounded retrieval returned source receipts for sourceability review.'
        : 'Live grounded retrieval completed without source receipts.',
      data: {
        selectedToolIds,
        querySet: searchPlan.queries,
        sourceReceiptIds: sourceReceipts.map((receipt) => receipt.sourceReceiptId),
        sourceReceiptCount: sourceReceipts.length,
        degradedReason: liveSearchError,
      },
    }, deps);
  }
  const sourceReceiptIds = uniqueStrings([
    ...stringArray(running.metadata.sourceReceiptIds),
    ...sourceReceipts.map((receipt) => receipt.sourceReceiptId),
  ]);
  const groundingPlan = isRecord(running.metadata.groundingPlan) ? running.metadata.groundingPlan : null;
  const googleGroundingActive = Array.isArray(groundingPlan?.modes) && groundingPlan.modes.includes('google_search');
  const groundingPosture = sourceReceipts.length
    ? 'Live grounded retrieval completed'
    : googleGroundingActive
      ? 'Google Search grounding active'
      : 'Grounding unavailable';
  const degradedReason = sourceReceipts.length || googleGroundingActive
    ? liveSearchError
    : (liveSearchError ?? 'Google Search grounding is not configured.');
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
      sourceReceipts,
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
        sourceReceiptIds,
        risk: getAgentToolDefinition(toolId).risk,
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
      sourceReceipts,
      querySet: searchPlan.queries,
      gaps,
      groundingPosture,
      degradedReason,
    },
  }, deps);
  return {
    selectedToolIds,
    querySet: searchPlan.queries,
    sourceClasses: searchPlan.sourceClasses,
    freshnessNeed: searchPlan.freshnessNeed,
    timeframe: searchPlan.timeframe,
    sourceReceipts,
    sourceReceiptIds,
    groundingPosture,
    degradedReason,
    gaps,
  };
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

function shouldUseDefaultLiveSearch(): boolean {
  return hasServerAiProvider() || process.env.PRAXIS_AGENT_LIVE_SEARCH === 'true';
}

async function runDefaultGroundedSearch(input: Parameters<AgentGroundedSearchRunner>[0]): Promise<Awaited<ReturnType<AgentGroundedSearchRunner>>> {
  const results = await searchWeb(input.query, {
    numResults: 5,
    timeRange: /current|latest|today|week/i.test(input.freshnessNeed) ? 'month' : 'all',
  });
  const sourceReceipts = results.slice(0, 8).map((result) => sourceReceiptFromSearchResult(input.query, result));
  return {
    query: input.query,
    sourceReceipts,
    degradedReason: sourceReceipts.length ? null : 'Live grounded search returned no source receipts.',
  };
}

function sourceReceiptFromSearchResult(query: string, result: WebSearchResult): AgentGroundedSearchReceipt {
  const basis = `${query}:${result.url}:${result.title}`;
  return {
    sourceReceiptId: `web:${stableShortId(basis)}`,
    title: result.title || result.url || 'Live source',
    url: result.url || null,
    snippet: (result.content || result.description || '').replace(/\s+/g, ' ').slice(0, 900),
    provider: result.provider ?? 'web-search',
    publishedDate: result.publishedDate ?? null,
    confidence: result.success ? 0.72 : 0.35,
  };
}

function verifySourceabilityLedgerWithLiveSearch(
  ledger: SourceabilityLedger,
  liveSearchEvidence: LiveSearchEvidence,
): SourceabilityLedger {
  if (!ledger.claims.length || !liveSearchEvidence.sourceReceipts.length) return ledger;
  const claims = ledger.claims.map((claim) => {
    if (claim.supportLabel === 'unsupported') return claim;
    const matchingReceipts = liveSearchEvidence.sourceReceipts.filter((receipt) => receiptMatchesClaim(receipt, claim.claim));
    if (!matchingReceipts.length) return claim;
    const sourceReceiptIds = uniqueStrings([
      ...claim.sourceReceiptIds,
      ...matchingReceipts.map((receipt) => receipt.sourceReceiptId),
    ]);
    const confidence = Math.max(claim.confidence, ...matchingReceipts.map((receipt) => receipt.confidence));
    const supportLabel = confidence >= 0.7 ? 'supported' : 'weak';
    return {
      ...claim,
      supportLabel,
      sourceReceiptIds,
      confidence,
      reviewNote: `Live sourceability check attached ${matchingReceipts.length} grounded receipt(s).`,
    } satisfies SourceabilityClaim;
  });
  return rebuildSourceabilityLedger(ledger, claims);
}

async function draftAndCritiqueMemo(
  running: AgentRun,
  evidencePack: CapsuleEvidencePack,
  sourceabilityLedger: SourceabilityLedger,
  liveSearchEvidence: LiveSearchEvidence,
  deps: Pick<WorkerDeps, 'generateText'>,
): Promise<LiveMemoDraft> {
  const evidencePrompt = [
    formatEvidencePackPromptBlock(evidencePack),
    sourceReceiptsPromptBlock(liveSearchEvidence),
    claimLedgerPromptBlock(sourceabilityLedger),
  ].join('\n\n');
  const draftPrompt = [
    `Objective: ${running.objective}`,
    evidencePrompt,
    'Draft a concise policy memo paragraph set. Use inline bracket citations with the available source receipt ids. Flag weak or unsupported claims explicitly.',
  ].join('\n\n');

  let modelPosture: LiveMemoDraft['modelPosture'] = 'live';
  let degradedReason: string | null = null;
  let draftText: string;
  try {
    draftText = (await generateAgentText(deps, {
      modelPurpose: 'pro',
      system: 'You are PRAXIS Research Memo Agent. Draft only from the supplied capsule evidence and live source receipts.',
      prompt: draftPrompt,
      temperature: 0.2,
    })).text.trim();
  } catch (err) {
    modelPosture = 'fallback';
    degradedReason = err instanceof Error ? err.message : String(err);
    draftText = fallbackMemoDraft(running, evidencePack, sourceabilityLedger, liveSearchEvidence);
  }

  let critiqueText: string;
  try {
    critiqueText = (await generateAgentText(deps, {
      modelPurpose: 'deep-think',
      system: 'You are PRAXIS sourceability self-critique. Identify unsupported paragraphs, weak citations, and export blockers.',
      prompt: [
        'Review this memo draft for sourceability gates.',
        draftText,
        claimLedgerPromptBlock(sourceabilityLedger),
      ].join('\n\n'),
      temperature: 0,
      providerOptions: { google: { thinking_level: 'high' } },
    })).text.trim();
  } catch (err) {
    modelPosture = 'fallback';
    degradedReason = degradedReason ?? (err instanceof Error ? err.message : String(err));
    critiqueText = sourceabilityLedger.summary.unsupportedClaims
      ? `${sourceabilityLedger.summary.unsupportedClaims} unsupported claim(s) block export-ready use.`
      : 'No unsupported claims were detected by the ledger; human review is still required before export.';
  }

  return {
    draftText,
    critiqueText,
    finalText: [draftText, '', 'Sourceability self-critique:', critiqueText].join('\n').trim(),
    modelPosture,
    degradedReason,
  };
}

async function generateAgentText(
  deps: Pick<WorkerDeps, 'generateText'>,
  input: Parameters<AgentTextGenerator>[0],
): Promise<{ text: string }> {
  if (deps.generateText) return deps.generateText(input);
  if (!hasServerAiProvider()) {
    throw new Error('Server AI provider is not configured for live memo drafting.');
  }
  const model = input.modelPurpose === 'deep-think' ? getDeepThinkModel('high') : getProModel();
  const result = await aiGenerateText({
    model,
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature,
    ...(input.providerOptions ? { providerOptions: input.providerOptions as never } : {}),
  });
  return { text: result.text };
}

function fallbackMemoDraft(
  running: AgentRun,
  evidencePack: CapsuleEvidencePack,
  sourceabilityLedger: SourceabilityLedger,
  liveSearchEvidence: LiveSearchEvidence,
): string {
  const sourceIds = uniqueStrings([
    ...evidencePack.sourceReceiptIds,
    ...evidencePack.sourcedParagraphs.map((paragraph) => paragraph.sourceReceiptId).filter((value): value is string => Boolean(value)),
    ...liveSearchEvidence.sourceReceiptIds,
  ]);
  return [
    `Task: ${running.objective}`,
    evidencePack.sourcedParagraphs.length
      ? evidencePack.sourcedParagraphs.map((paragraph) => `${paragraph.excerpt} ${paragraph.sourceReceiptId ? `[${paragraph.sourceReceiptId}]` : paragraph.citationLabel}`).join('\n')
      : 'No sourced capsule paragraphs were retrieved.',
    sourceIds.length ? `Inline source receipts available: ${sourceIds.join(', ')}.` : 'No live source receipts are available.',
    sourceabilityLedger.summary.unsupportedClaims
      ? `Unsupported paragraphs remain: ${sourceabilityLedger.unsupportedClaims.map((claim) => claim.claim).join(' | ')}`
      : 'No unsupported paragraphs were recorded by the claim ledger.',
  ].join('\n\n');
}

function sourceReceiptsPromptBlock(liveSearchEvidence: LiveSearchEvidence): string {
  const lines = ['## Live Source Receipts'];
  if (!liveSearchEvidence.sourceReceipts.length) {
    lines.push(`- none${liveSearchEvidence.degradedReason ? ` (${liveSearchEvidence.degradedReason})` : ''}`);
    return lines.join('\n');
  }
  for (const receipt of liveSearchEvidence.sourceReceipts) {
    lines.push(`- [${receipt.sourceReceiptId}] ${receipt.title}${receipt.url ? ` ${receipt.url}` : ''}: ${receipt.snippet}`);
  }
  return lines.join('\n');
}

function claimLedgerPromptBlock(sourceabilityLedger: SourceabilityLedger): string {
  return [
    '## Claim Ledger',
    ...sourceabilityLedger.claims.map((claim) => `- ${claim.supportLabel} (${Math.round(claim.confidence * 100)}%): ${claim.claim} [${claim.sourceReceiptIds.join(', ') || 'no receipt'}]`),
  ].join('\n');
}

function rebuildSourceabilityLedger(
  ledger: SourceabilityLedger,
  claims: SourceabilityClaim[],
): SourceabilityLedger {
  const summary = {
    totalClaims: claims.length,
    supportedClaims: claims.filter((item) => item.supportLabel === 'supported').length,
    weakClaims: claims.filter((item) => item.supportLabel === 'weak').length,
    unsupportedClaims: claims.filter((item) => item.supportLabel === 'unsupported').length,
    contradictedClaims: claims.filter((item) => item.supportLabel === 'contradicted').length,
    modelPriorClaims: claims.filter((item) => item.supportLabel === 'model_prior').length,
    assumptionClaims: claims.filter((item) => item.supportLabel === 'assumption').length,
  };
  const sourceReceiptIds = uniqueStrings(claims.flatMap((claim) => claim.sourceReceiptIds));
  return {
    ...ledger,
    claims,
    summary,
    unsupportedClaims: claims.filter((claim) => claim.supportLabel === 'unsupported'),
    outputReadiness: {
      ...ledger.outputReadiness,
      sourceReceiptIds,
    },
  };
}

function receiptMatchesClaim(receipt: AgentGroundedSearchReceipt, claim: string): boolean {
  const haystack = `${receipt.title} ${receipt.snippet}`.toLowerCase();
  const tokens = claim.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 4)
    .slice(0, 18);
  if (!tokens.length) return false;
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits >= Math.min(2, tokens.length);
}

function agentOperatingContractFromRun(run: AgentRun): {
  allowedActions: string[];
  forbiddenActions: string[];
  stopConditions: string[];
} {
  const contract = isRecord(run.metadata.agentOperatingContract) ? run.metadata.agentOperatingContract : {};
  return {
    allowedActions: uniqueStrings([
      ...stringArray(contract.allowedActions),
      ...stringArray(run.metadata.allowedActions),
    ]),
    forbiddenActions: uniqueStrings([
      ...stringArray(contract.forbiddenActions),
      ...stringArray(run.metadata.forbiddenActions),
    ]),
    stopConditions: uniqueStrings([
      ...stringArray(contract.stopConditions),
      ...stringArray(run.metadata.stopConditions),
    ]),
  };
}

function evaluateAgentOperatingContract(run: AgentRun): {
  allowed: boolean;
  reason: string;
  forbiddenActions: string[];
  missingAllowedActions: string[];
} {
  const contract = agentOperatingContractFromRun(run);
  const requiredActions = uniqueStrings([
    selectedSearchToolIds(run).length ? 'search_grounded' : '',
    'draft_policy_memo',
    'check_sourceability',
  ]);
  const forbiddenActions = requiredActions.filter((action) => contract.forbiddenActions.includes(action));
  const strictAllowed = run.metadata.strictAgentOperatingContract === true;
  const missingAllowedActions = strictAllowed && contract.allowedActions.length
    ? requiredActions.filter((action) => !contract.allowedActions.includes(action))
    : [];
  const allowed = forbiddenActions.length === 0 && missingAllowedActions.length === 0;
  return {
    allowed,
    reason: allowed
      ? 'Agent operating contract permits this read, source-check, and memo draft sequence.'
      : `Agent operating contract stopped the run before ${[...forbiddenActions, ...missingAllowedActions].join(', ')}.`,
    forbiddenActions,
    missingAllowedActions,
  };
}

function dedupeSourceReceipts(receipts: AgentGroundedSearchReceipt[]): AgentGroundedSearchReceipt[] {
  const seen = new Set<string>();
  const out: AgentGroundedSearchReceipt[] = [];
  for (const receipt of receipts) {
    const key = receipt.sourceReceiptId || receipt.url || `${receipt.title}:${receipt.snippet.slice(0, 80)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(receipt);
  }
  return out.slice(0, 24);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean))).slice(0, 100);
}

function stableShortId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function buildMemoBlocks(
  running: AgentRun,
  evidencePack: CapsuleEvidencePack,
  sourceabilityLedger?: SourceabilityLedger,
  options: {
    liveMemoDraft?: LiveMemoDraft;
    liveSearchEvidence?: LiveSearchEvidence;
    combinedSourceReceiptIds?: string[];
  } = {},
): SaveMemoDraftInput['blocks'] {
  const citedReceiptIds = uniqueStrings([
    ...evidencePack.sourcedParagraphs
      .map((paragraph) => paragraph.sourceReceiptId)
      .filter((value): value is string => Boolean(value)),
    ...(options.combinedSourceReceiptIds ?? []),
  ]);
  const paragraphCitation = citedReceiptIds.length
    ? [{ nodeIds: [], sourceReceiptIds: citedReceiptIds, surface: 'footnote' as const }]
    : [];
  const weakSourceHighlight = Boolean(
    sourceabilityLedger &&
    (sourceabilityLedger.summary.weakClaims > 0 || sourceabilityLedger.summary.unsupportedClaims > 0 || sourceabilityLedger.summary.contradictedClaims > 0)
  );

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
    ...(options.liveMemoDraft ? [{
      id: 'live-memo-draft',
      type: 'paragraph' as const,
      title: 'Draft memo with inline citations',
      content: options.liveMemoDraft.finalText,
      citations: paragraphCitation,
      metadata: {
        runId: running.id,
        capsuleId: running.capsuleId,
        modelPosture: options.liveMemoDraft.modelPosture,
        degradedReason: options.liveMemoDraft.degradedReason,
        weakSourceHighlight,
        sourceReceiptIds: citedReceiptIds,
        liveSourceReceiptIds: options.liveSearchEvidence?.sourceReceiptIds ?? [],
        sourceabilityLedgerSummary: sourceabilityLedger?.summary,
        paragraphSourceability: sourceabilityLedger?.claims.map((claim) => ({
          claimId: claim.id,
          status: claim.supportLabel,
          confidence: claim.confidence,
          sourceReceiptIds: claim.sourceReceiptIds,
        })) ?? [],
      },
    }] : []),
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

function buildMultiAgentReviewMemoBlocks(
  running: AgentRun,
  input: {
    evidencePack: CapsuleEvidencePack;
    sourceabilityLedger: SourceabilityLedger;
    liveMemoDraft: LiveMemoDraft;
    liveSearchEvidence: LiveSearchEvidence;
    finalMemoText: string;
    redTeamFindings: string[];
    combinedSourceReceiptIds: string[];
  },
): SaveMemoDraftInput['blocks'] {
  const paragraphCitation = input.combinedSourceReceiptIds.length
    ? [{ nodeIds: [], sourceReceiptIds: input.combinedSourceReceiptIds, surface: 'footnote' as const }]
    : [];
  return [
    {
      id: 'multi-agent-final',
      type: 'paragraph',
      title: 'Final revised memo',
      content: input.finalMemoText,
      citations: paragraphCitation,
      metadata: {
        runId: running.id,
        capsuleId: running.capsuleId,
        workflowKind: 'multi_agent_review',
        consumedAgents: ['research-agent', 'drafting-agent', 'red-team-agent', 'revise-agent'],
        addressedRedTeamFindings: input.redTeamFindings,
        weakSourceHighlight: input.sourceabilityLedger.summary.weakClaims > 0 || input.sourceabilityLedger.summary.unsupportedClaims > 0,
      },
    },
    {
      id: 'agent-graph-receipt',
      type: 'bullets',
      title: 'Agent graph receipt',
      content: '',
      items: [
        'research-agent produced evidencePack and sourceReceipts.',
        'drafting-agent consumed research-agent output and produced draftMemo.',
        'red-team-agent consumed draftMemo and claimLedger and produced redTeamFindings.',
        'revise-agent consumed draftMemo and redTeamFindings and produced finalMemo.',
      ],
      citations: [],
      metadata: { workflowKind: 'multi_agent_review' },
    },
    {
      id: 'red-team-findings',
      type: 'bullets',
      title: 'Red-team findings addressed',
      content: '',
      items: input.redTeamFindings,
      citations: [],
      metadata: {
        sourceabilityLedgerId: input.sourceabilityLedger.ledgerId,
        unsupportedClaimCount: input.sourceabilityLedger.summary.unsupportedClaims,
      },
    },
    {
      id: 'drafting-agent-output',
      type: 'paragraph',
      title: 'Drafting agent output before red-team revision',
      content: input.liveMemoDraft.finalText,
      citations: paragraphCitation,
      metadata: {
        modelPosture: input.liveMemoDraft.modelPosture,
        degradedReason: input.liveMemoDraft.degradedReason,
        liveSourceReceiptIds: input.liveSearchEvidence.sourceReceiptIds,
      },
    },
    {
      id: 'sourceability-ledger-summary',
      type: 'bullets',
      title: 'Sourceability ledger summary',
      content: '',
      items: [
        `${input.sourceabilityLedger.summary.totalClaims} material claim(s) reviewed.`,
        `${input.sourceabilityLedger.summary.weakClaims} weak claim(s) remain visible.`,
        `${input.sourceabilityLedger.summary.unsupportedClaims} unsupported claim(s) remain visible.`,
      ],
      citations: paragraphCitation,
      metadata: {
        capsuleVersion: input.evidencePack.activeCapsule.version ?? null,
        sourceabilityLedgerId: input.sourceabilityLedger.ledgerId,
        sourceabilityLedgerSummary: input.sourceabilityLedger.summary,
      },
    },
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
