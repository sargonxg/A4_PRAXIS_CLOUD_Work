import type { AgentRun } from '@/lib/agent-runtime/types';
import { buildCapsuleWorkerContext, mirrorGenkitFlowEvent, type AgentRuntimeMirrorDeps } from '@/lib/agent-runtime/mirror';
import {
  capsuleIntakeFlow,
  capsuleResearchPlanFlow,
  capsuleSynthesisFlow,
  capsuleWritingProfileFlow,
} from '@/lib/genkit/flows/capsule-factory';
import { createCapsuleReviewCard, type CapsuleReviewCard, type CreateCapsuleReviewCardInput } from '@/lib/context/capsule-service';
import type {
  CapsuleIntakeOutput,
  CapsuleResearchPlanOutput,
  CapsuleSynthesisOutput,
  CapsuleWritingProfileOutput,
} from '@/lib/genkit/schemas/capsule-factory';

export type CapsuleFactoryDraftOutput = {
  intake: CapsuleIntakeOutput;
  researchPlan: CapsuleResearchPlanOutput;
  synthesis: CapsuleSynthesisOutput;
  writingProfile: CapsuleWritingProfileOutput;
};

export type CapsuleFactoryDeps = AgentRuntimeMirrorDeps & {
  runIntakeFlow?: typeof capsuleIntakeFlow;
  runResearchPlanFlow?: typeof capsuleResearchPlanFlow;
  runSynthesisFlow?: typeof capsuleSynthesisFlow;
  runWritingProfileFlow?: typeof capsuleWritingProfileFlow;
  createReviewCard?: (uid: string, capsuleId: string, input: CreateCapsuleReviewCardInput) => Promise<CapsuleReviewCard>;
};

export async function runCapsuleFactoryDraft(
  run: AgentRun,
  deps: CapsuleFactoryDeps = {},
): Promise<CapsuleFactoryDraftOutput> {
  const runIntake = deps.runIntakeFlow ?? capsuleIntakeFlow;
  const runResearchPlan = deps.runResearchPlanFlow ?? capsuleResearchPlanFlow;
  const runSynthesis = deps.runSynthesisFlow ?? capsuleSynthesisFlow;
  const runWritingProfile = deps.runWritingProfileFlow ?? capsuleWritingProfileFlow;
  const workerContext = buildCapsuleWorkerContext(run);

  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleIntakeFlow',
    phase: 'started',
    schemaName: 'CapsuleIntakeOutput',
    message: 'Capsule AI started intake into draft core proposals.',
    data: { workerContext },
  }, deps);
  const intake = await runIntake({
    objective: run.objective,
    prompt: run.objective,
    documents: [],
    sourceSnippets: [],
    activeCapsuleId: run.capsuleId,
  });
  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleIntakeFlow',
    phase: 'succeeded',
    schemaName: 'CapsuleIntakeOutput',
    data: {
      path: intake.factoryTelemetry?.path ?? 'llm',
      draftCoreCount: intake.draftCores.length,
      sourceGapCount: intake.sourceGaps.length,
    },
  }, deps);

  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleResearchPlanFlow',
    phase: 'tool_call',
    schemaName: 'CapsuleResearchPlanOutput',
    toolId: 'capsule-repository-read',
    message: 'Capsule AI planned read-only source and corpus checks.',
    data: { approvalPosture: 'receipt_only' },
  }, deps);
  const researchPlan = await runResearchPlan({
    objective: run.objective,
    currentCores: intake.draftCores.map((core) => ({
      kind: core.kind,
      label: core.label,
      summary: core.summary,
    })),
    sourceSnippets: [],
  });
  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleResearchPlanFlow',
    phase: 'succeeded',
    schemaName: 'CapsuleResearchPlanOutput',
    data: {
      path: researchPlan.factoryTelemetry?.path ?? 'llm',
      sourceGapCount: researchPlan.sourceGaps.length,
      readOnlyTools: researchPlan.readOnlyTools.map((tool) => tool.toolId),
    },
  }, deps);

  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleSynthesisFlow',
    phase: 'started',
    schemaName: 'CapsuleSynthesisOutput',
    message: 'Capsule AI started draft ContextCapsule synthesis.',
  }, deps);
  const synthesis = await runSynthesis({
    objective: run.objective,
    draftCores: intake.draftCores,
    researchPlan,
    sourceSnippets: [],
  });
  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleSynthesisFlow',
    phase: 'succeeded',
    schemaName: 'CapsuleSynthesisOutput',
    data: {
      path: synthesis.factoryTelemetry?.path ?? 'llm',
      draftOutput: {
        contextCapsuleDraft: synthesis.contextCapsuleDraft,
        proposedCoreCount: synthesis.proposedCores.length,
        openQuestionCount: synthesis.openQuestions.length,
        applyActions: synthesis.applyActions,
      },
    },
  }, deps);

  const writingProfile = await runWritingProfile({
    objective: run.objective,
    outputGoal: run.selectedCoreIds.outputCoreIds[0] ?? 'memo',
    contextCapsuleDraft: synthesis.contextCapsuleDraft,
  });
  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleWritingProfileFlow',
    phase: 'succeeded',
    schemaName: 'CapsuleWritingProfileOutput',
    data: {
      path: writingProfile.factoryTelemetry?.path ?? 'llm',
      defaultFormat: writingProfile.defaultFormat,
      exportGates: writingProfile.exportGates,
    },
  }, deps);

  const reviewCards = await createCapsuleFactoryReviewCards(run, {
    intake,
    researchPlan,
    synthesis,
    writingProfile,
  }, deps);
  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleFactoryReviewCards',
    phase: 'succeeded',
    schemaName: 'CapsuleReviewCard',
    message: 'Capsule AI converted draft improvements into proposal-gated review cards.',
    data: {
      reviewCardIds: reviewCards.map((card) => card.reviewCardId),
      reviewCardCount: reviewCards.length,
      canonicalMutationPolicy: 'review-card-only',
      approvalSeam: 'TODO(session-3): supervisor orchestration should pause here for owner approval before apply.',
    },
  }, deps);

  return { intake, researchPlan, synthesis, writingProfile };
}

async function createCapsuleFactoryReviewCards(
  run: AgentRun,
  draft: CapsuleFactoryDraftOutput,
  deps: CapsuleFactoryDeps,
): Promise<Array<Pick<CapsuleReviewCard, 'reviewCardId'>>> {
  const createReview = deps.createReviewCard ?? createCapsuleReviewCard;
  const now = new Date().toISOString();
  const cards: CreateCapsuleReviewCardInput[] = [];

  const sourceGaps = uniqueStrings([
    ...draft.intake.sourceGaps,
    ...draft.researchPlan.sourceGaps,
    ...draft.synthesis.openQuestions.filter((question) => /source|evidence|official|current|verify|confirm/i.test(question)),
  ]);
  if (sourceGaps.length) {
    cards.push({
      reviewCardId: `factory-source-gap-${stableId(`${run.id}:source-gap`)}`,
      title: `Source gaps from Capsule Factory - ${run.objective.slice(0, 72)}`,
      sourceType: 'agent',
      target: 'sourceGap',
      evidence: [],
      proposedEnvelopePatch: {
        sourceRefs: sourceGaps.map((gap, index) => ({
          id: `factory-source-gap-${index + 1}`,
          label: gap.slice(0, 160),
          reviewState: 'proposed',
          generatedBy: 'capsule-factory',
          runId: run.id,
          createdAt: now,
        })),
        latestGateState: 'proposed',
      },
    });
  }

  const claimCandidates = [
    ...draft.synthesis.proposedCores.map((core, index) => ({
      id: `factory-claim-${index + 1}`,
      claim: `${core.label}: ${core.summary}`.slice(0, 900),
      status: 'weak',
    })),
    ...draft.synthesis.openQuestions.map((question, index) => ({
      id: `factory-open-question-${index + 1}`,
      claim: question.slice(0, 900),
      status: 'unsupported',
    })),
  ];
  if (claimCandidates.length) {
    cards.push({
      reviewCardId: `factory-claim-ledger-${stableId(`${run.id}:claim-ledger`)}`,
      title: `Claim ledger proposals from Capsule Factory - ${run.objective.slice(0, 72)}`,
      sourceType: 'agent',
      target: 'claimLedger',
      evidence: [],
      proposedEnvelopePatch: {
        claimLedger: claimCandidates.map((candidate) => ({
          ...candidate,
          sourceReceiptIds: [],
          reviewState: 'proposed',
          generatedBy: 'capsule-factory',
          runId: run.id,
          createdAt: now,
        })),
        latestGateState: 'proposed',
      },
    });
  }

  cards.push({
    reviewCardId: `factory-agent-instructions-${stableId(`${run.id}:agent-instructions`)}`,
    title: `Agent instruction proposals from Capsule Factory - ${run.objective.slice(0, 72)}`,
    sourceType: 'agent',
    target: 'agentInstructions',
    evidence: [],
    proposedEnvelopePatch: {
      memoryPosture: {
        advisoryCogneeRecall: [
          draft.synthesis.contextCapsuleDraft.summary,
          ...draft.writingProfile.exportGates.map((gate) => `Export gate: ${gate}`),
        ].filter(Boolean).slice(0, 12),
        graphProposals: draft.synthesis.applyActions.slice(0, 12),
        sessionMemory: [`Capsule Factory run ${run.id} produced review-gated proposals only.`],
        cogneeMode: 'advisory-only',
      },
      agentPermissions: {
        generatedBy: 'capsule-factory',
        runId: run.id,
        canonicalMutationPolicy: 'review-card-only',
        defaultFormat: draft.writingProfile.defaultFormat,
      },
      latestGateState: 'proposed',
    },
  });

  const created: Array<Pick<CapsuleReviewCard, 'reviewCardId'>> = [];
  for (const card of cards) {
    created.push(await createReview(run.ownerUid, run.capsuleId, card));
  }
  return created;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 100);
}

function stableId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 12);
}
