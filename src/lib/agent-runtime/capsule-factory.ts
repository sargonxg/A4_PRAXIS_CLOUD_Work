import type { AgentRun } from '@/lib/agent-runtime/types';
import { buildCapsuleWorkerContext, mirrorGenkitFlowEvent, type AgentRuntimeMirrorDeps } from '@/lib/agent-runtime/mirror';
import {
  capsuleIntakeFlow,
  capsuleResearchPlanFlow,
  capsuleSynthesisFlow,
  capsuleWritingProfileFlow,
} from '@/lib/genkit/flows/capsule-factory';
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
    message: 'Capsule Factory started intake into draft core proposals.',
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
      draftCoreCount: intake.draftCores.length,
      sourceGapCount: intake.sourceGaps.length,
    },
  }, deps);

  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleResearchPlanFlow',
    phase: 'tool_call',
    schemaName: 'CapsuleResearchPlanOutput',
    toolId: 'capsule-repository-read',
    message: 'Capsule Factory planned read-only source and corpus checks.',
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
      sourceGapCount: researchPlan.sourceGaps.length,
      readOnlyTools: researchPlan.readOnlyTools.map((tool) => tool.toolId),
    },
  }, deps);

  await mirrorGenkitFlowEvent(run, {
    flowName: 'capsuleSynthesisFlow',
    phase: 'started',
    schemaName: 'CapsuleSynthesisOutput',
    message: 'Capsule Factory started draft ContextCapsule synthesis.',
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
      defaultFormat: writingProfile.defaultFormat,
      exportGates: writingProfile.exportGates,
    },
  }, deps);

  return { intake, researchPlan, synthesis, writingProfile };
}
