import type { AgentRun } from '@/lib/agent-runtime/types';
import { buildCapsuleEvidencePack, type CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
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
  CapsuleIntakeInput,
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
  buildEvidencePack?: typeof buildCapsuleEvidencePack;
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
  const evidencePack = await (deps.buildEvidencePack ?? buildCapsuleEvidencePack)({
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    objective: run.objective,
    maxParagraphs: 20,
  });
  if (evidencePack.ownerUid !== run.ownerUid || evidencePack.capsuleId !== run.capsuleId) {
    throw new Error('Capsule Factory evidence does not belong to this run.');
  }
  const evidence = factoryEvidence(evidencePack);

  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleIntakeFlow',
    phase: 'started',
    schemaName: 'CapsuleIntakeOutput',
    message: 'Capsule AI started intake into draft core proposals.',
    data: {
      workerContext,
      evidencePackId: evidencePack.packId,
      documentCount: evidence.documents.length,
      sourceSnippetCount: evidence.sourceSnippets.length,
      evidenceGaps: evidence.gaps,
    },
  }, deps);
  const intake = await runIntake({
    objective: run.objective,
    prompt: run.objective,
    documents: evidence.documents,
    sourceSnippets: evidence.sourceSnippets,
    activeCapsuleId: run.capsuleId,
  });
  intake.sourceGaps = boundedGaps(evidence.gaps, intake.sourceGaps);
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
    sourceSnippets: evidence.sourceSnippets,
  });
  researchPlan.sourceGaps = boundedGaps(evidence.gaps, researchPlan.sourceGaps);
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
    sourceSnippets: evidence.sourceSnippets,
  });
  synthesis.openQuestions = boundedGaps(evidence.gaps, synthesis.openQuestions);
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

function factoryEvidence(pack: CapsuleEvidencePack): {
  documents: CapsuleIntakeInput['documents'];
  sourceSnippets: CapsuleIntakeInput['sourceSnippets'];
  gaps: string[];
} {
  const titles = new Map(pack.knowledgeDocuments.map((doc) => [doc.documentId, doc.title]));
  for (const digest of pack.documentDigests) titles.set(digest.documentId, digest.title);
  const title = (id: string) => (titles.get(id)?.trim() || id).slice(0, 300);
  const paragraphs = pack.sourcedParagraphs.filter((paragraph) => paragraph.excerpt.trim());
  const digests = pack.documentDigests.map((digest) => ({
    ...digest,
    text: [digest.shortSummary, ...digest.keyClaims].filter((text) => text.trim()).join('\n'),
  })).filter((digest) => digest.text);
  const sourceSnippets: CapsuleIntakeInput['sourceSnippets'] = [
    ...paragraphs.map((paragraph) => ({
      id: paragraph.id.slice(0, 160),
      title: title(paragraph.documentId),
      span: `${paragraph.citationLabel} Document ${paragraph.documentId}: ${paragraph.excerpt}`.slice(0, 4000),
      source: 'firestore' as const,
    })),
    ...digests.map((digest) => ({
      id: `digest:${digest.documentId}`.slice(0, 160),
      title: title(digest.documentId),
      span: `Document digest (generated summary; verify against original):\n${digest.text}`.slice(0, 4000),
      source: 'firestore' as const,
    })),
  ].slice(0, 20);
  const documentIds = uniqueStrings([...paragraphs.map((paragraph) => paragraph.documentId), ...digests.map((digest) => digest.documentId)]);
  const documents = documentIds.slice(0, 10).map((id) => ({
    id: id.slice(0, 160),
    title: title(id),
    text: [
      ...paragraphs.filter((paragraph) => paragraph.documentId === id).map((paragraph) => `${paragraph.citationLabel} ${paragraph.excerpt}`),
      ...digests.filter((digest) => digest.documentId === id).map((digest) => `Document digest (generated summary; verify against original):\n${digest.text}`),
    ].join('\n\n').slice(0, 8000),
  }));
  return {
    documents,
    sourceSnippets,
    gaps: boundedGaps([
      ...(!sourceSnippets.length ? ['No readable document excerpts or digests were retrieved. This draft is based on the objective only; attach evidence before use.'] : []),
      ...(paragraphs.length + digests.length > 20 || documentIds.length > 10 ? ['Evidence exceeds the factory input limits; this draft uses a bounded selection and needs review against the remaining documents.'] : []),
      ...digests.flatMap((digest) => digest.sourceabilityWarnings),
      ...pack.openGaps,
    ]),
  };
}

function boundedGaps(...groups: string[][]): string[] {
  return uniqueStrings(groups.flat().map((gap) => gap.slice(0, 240))).slice(0, 12);
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
      claimId: `factory-claim-${index + 1}`,
      text: `${core.label}: ${core.summary}`.slice(0, 900),
      support: 'needs_source' as const,
      caveat: `Proposed by Capsule Factory run ${run.id}; requires source receipts before final use.`,
    })),
    ...draft.synthesis.openQuestions.map((question, index) => ({
      claimId: `factory-open-question-${index + 1}`,
      text: question.slice(0, 900),
      support: 'needs_source' as const,
      caveat: `Open question from Capsule Factory run ${run.id}; requires source receipts before final use.`,
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
          sourceRefIds: [],
          asOf: now,
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
