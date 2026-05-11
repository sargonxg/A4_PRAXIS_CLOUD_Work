import { z } from 'zod';
import type { MethodDefinition } from '@/lib/methods/catalog';
import { getMethodSourceTool } from '@/lib/methods/catalog';
import { createContextProvider } from '@/lib/tools/context-provider';
import { buildMarketplaceToolRun } from '@/lib/tools/marketplace/runner';
import type { ContextSnapshot } from '@/types/context';

export type MethodCostClass = 'free' | 'cheap' | 'medium' | 'expensive';

export const MethodRunInputSchema = z.object({
  caseId: z.string().min(1),
  prompt: z.string().max(8000).optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  toolRunId: z.string().min(1).max(160).optional(),
});

export const MethodRunOutputSchema = z.object({
  methodId: z.string(),
  runtimeId: z.string(),
  caseId: z.string(),
  summary: z.string(),
  findings: z.array(z.object({
    title: z.string(),
    detail: z.string(),
    confidence: z.number().min(0).max(1),
    provenance: z.array(z.string()),
  })),
  artifacts: z.array(z.object({
    kind: z.string(),
    title: z.string(),
    content: z.string(),
  })),
  citations: z.array(z.object({
    label: z.string(),
    sourceId: z.string(),
    tier: z.string(),
  })),
  gaps: z.array(z.string()),
  nextActions: z.array(z.string()),
  persistence: z.object({
    ownerScoped: z.literal(true),
    artifactCollection: z.string(),
  }),
  runtime: z.object({
    lPatterns: z.array(z.string()),
    costClass: z.enum(['free', 'cheap', 'medium', 'expensive']),
    latencyBudgetP95Ms: z.number().int().positive(),
    handlerStage: z.string(),
    providerPath: z.string(),
  }),
});

export type MethodRunInput = z.infer<typeof MethodRunInputSchema>;
export type MethodRunOutput = z.infer<typeof MethodRunOutputSchema>;

export interface MethodRuntimeContract {
  methodId: string;
  runtimeId: string;
  lPatterns: string[];
  costClass: MethodCostClass;
  latencyBudgetP95Ms: number;
  ontologyRequirements: { domain: string[]; work?: string[] };
  composition: { canChainInto: string[]; canConsumeFrom: string[] };
}

export const METHOD_RUNTIME_CONTRACTS: Record<string, MethodRuntimeContract> = {
  'position-interest-decoder': contract('analysis.position-vs-interest', ['L4'], 'medium', ['mediation', 'conflict'], ['memo-drafter', 'mediation-brief'], ['stakeholder-power-interest-map']),
  'scenario-projector': contract('analysis.scenario-projector', ['L5'], 'medium', ['conflict', 'governance', 'security'], ['memo-drafter', 'commitment-tracker'], ['deep-research', 'stakeholder-power-interest-map']),
  ach: contract('analysis.ach-hypothesis', ['L4', 'L9'], 'medium', ['conflict', 'governance', 'narrative'], ['memo-drafter', 'contradiction-finder'], ['deep-research']),
  'memo-drafter': contract('drafting.memo-drafter', ['L12'], 'medium', ['conflict', 'mediation', 'governance', 'narrative'], [], ['deep-research', 'contradiction-finder', 'ach']),
  'frame-narrative-analyzer': contract('analysis.frame-narrative', ['L6'], 'medium', ['narrative', 'governance'], ['memo-drafter', 'contradiction-finder'], ['deep-research']),
  'contradiction-finder': contract('analysis.contradiction-finder', ['L9'], 'cheap', ['conflict', 'governance', 'narrative'], ['ach', 'memo-drafter'], ['deep-research']),
  'deep-research': contract('research.deep-research-agent', ['L2', 'L3', 'L9'], 'medium', ['conflict', 'mediation', 'governance', 'narrative'], ['ach', 'contradiction-finder', 'memo-drafter'], []),
  'stakeholder-power-interest-map': contract('analysis.stakeholder-power-interest', ['L8'], 'cheap', ['conflict', 'governance', 'mediation'], ['coalition-detector', 'memo-drafter'], ['deep-research']),
  'coalition-detector': contract('analysis.coalition-detector', [], 'free', ['governance', 'mediation', 'conflict'], ['scenario-projector', 'memo-drafter'], ['stakeholder-power-interest-map']),
  'commitment-tracker': contract('analysis.commitment-tracker', ['L7'], 'cheap', ['conflict', 'legal', 'governance'], ['memo-drafter', 'scenario-projector'], ['deep-research']),
};

export function getMethodRuntimeContract(methodId: string): MethodRuntimeContract | null {
  return METHOD_RUNTIME_CONTRACTS[methodId] ?? null;
}

export function runMvpMethod(input: {
  method: MethodDefinition;
  snapshot: ContextSnapshot;
  prompt?: string;
  analystInput?: Record<string, unknown>;
}): MethodRunOutput {
  const contract = getMethodRuntimeContract(input.method.id);
  if (!contract) throw new Error(`No Phase 5 runtime contract registered for ${input.method.id}`);

  const sourceTool = getMethodSourceTool(input.method);
  const providerPath = sourceTool ? `marketplace:${sourceTool.id}` : 'research-pipeline:grounded-search-wikidata';
  const runContext = sourceTool ? createContextProvider({ snapshot: input.snapshot }).forTool(sourceTool) : null;
  const marketplaceResult = sourceTool && runContext
    ? buildMarketplaceToolRun({
      tool: sourceTool,
      runContext,
      prompt: input.prompt,
      analystContext: input.analystInput,
    })
    : null;
  const caseName = !input.snapshot.case.frame.name || input.snapshot.case.frame.name === 'No active case'
    ? input.snapshot.case.caseId
    : input.snapshot.case.frame.name;
  const sourceIds = sourceLabels(input.snapshot);
  const claims = marketplaceResult?.structuredOutput.claims;
  const baseFinding = Array.isArray(claims) ? claims[0] as { text?: string; trustScore?: number } | undefined : undefined;

  const output: MethodRunOutput = {
    methodId: input.method.id,
    runtimeId: contract.runtimeId,
    caseId: input.snapshot.case.caseId,
    summary: summaryFor(input.method, caseName, input.prompt),
    findings: findingsFor(input.method.id, caseName, baseFinding, sourceIds),
    artifacts: artifactsFor(input.method.id, caseName),
    citations: sourceIds.map((sourceId, index) => ({
      label: index === 0 ? 'Active Context snapshot' : `Supporting source ${index + 1}`,
      sourceId,
      tier: index === 0 ? 'ContextSnapshot' : 'T5',
    })),
    gaps: gapsFor(input.method.id, input.snapshot),
    nextActions: nextActionsFor(input.method.id),
    persistence: {
      ownerScoped: true,
      artifactCollection: 'users/{uid}/situations/{caseId}/toolRunArtifacts',
    },
    runtime: {
      lPatterns: contract.lPatterns,
      costClass: contract.costClass,
      latencyBudgetP95Ms: contract.latencyBudgetP95Ms,
      handlerStage: marketplaceResult?.metadata.handlerStage === 'model-backed' ? 'model-backed' : 'phase-5-foundation',
      providerPath,
    },
  };

  return MethodRunOutputSchema.parse(output);
}

function contract(
  runtimeId: string,
  lPatterns: string[],
  costClass: MethodCostClass,
  domain: string[],
  canChainInto: string[],
  canConsumeFrom: string[],
): MethodRuntimeContract {
  return {
    methodId: runtimeId.split('.').at(-1) ?? runtimeId,
    runtimeId,
    lPatterns,
    costClass,
    latencyBudgetP95Ms: costClass === 'free' ? 3000 : costClass === 'cheap' ? 8000 : 60000,
    ontologyRequirements: { domain, work: ['foreign-policy-research', 'domestic-policy-analysis', 'corporate-strategic-analysis'] },
    composition: { canChainInto, canConsumeFrom },
  };
}

function sourceLabels(snapshot: ContextSnapshot): string[] {
  const labels = [`context:${snapshot.case.caseId}`];
  for (let index = 0; index < Math.min(snapshot.case.sourceCount, 4); index += 1) {
    labels.push(`source-receipt:${snapshot.case.caseId}:${index + 1}`);
  }
  return labels;
}

function summaryFor(method: MethodDefinition, caseName: string, prompt?: string): string {
  const focus = prompt?.trim() ? ` Focus: ${prompt.trim()}` : '';
  return `${method.name} completed a Phase 5 foundation run for ${caseName}.${focus}`;
}

function findingsFor(methodId: string, caseName: string, baseFinding: { text?: string; trustScore?: number } | undefined, sourceIds: string[]) {
  const confidence = typeof baseFinding?.trustScore === 'number' ? Math.max(0.35, Math.min(0.82, baseFinding.trustScore)) : 0.62;
  const detail = baseFinding?.text ?? detailFor(methodId, caseName);
  return [
    {
      title: titleFor(methodId),
      detail,
      confidence,
      provenance: sourceIds.slice(0, 3),
    },
    {
      title: 'Review posture',
      detail: 'Output is grounded in the active Context snapshot and remains review-required before graph promotion or external use.',
      confidence: 0.7,
      provenance: [sourceIds[0]],
    },
  ];
}

function titleFor(methodId: string): string {
  const titles: Record<string, string> = {
    'position-interest-decoder': 'Positions separated from interests',
    'scenario-projector': 'Scenario set prepared',
    ach: 'Hypotheses and diagnostic evidence prepared',
    'memo-drafter': 'Memo blocks prepared for Drafting Studio',
    'frame-narrative-analyzer': 'Narrative frames identified',
    'contradiction-finder': 'Contradictions queued for review',
    'deep-research': 'Grounded research scaffold prepared',
    'stakeholder-power-interest-map': 'Power-interest grid prepared',
    'coalition-detector': 'Coalition clusters prepared',
    'commitment-tracker': 'Commitment lifecycle table prepared',
  };
  return titles[methodId] ?? 'Method output prepared';
}

function detailFor(methodId: string, caseName: string): string {
  const details: Record<string, string> = {
    'position-interest-decoder': `For ${caseName}, stated demands should be reviewed against inferred interests, confidence, and mediator test questions.`,
    'scenario-projector': `${caseName} now has likely, high-risk, and opportunity paths with watch indicators ready for analyst review.`,
    ach: `${caseName} has a structured competing-hypotheses matrix scaffold with diagnosticity notes.`,
    'memo-drafter': `${caseName} has memo-ready sections with citation gaps visible before Phase 6 section actions.`,
    'frame-narrative-analyzer': `${caseName} has candidate frame clusters, messengers, audiences, and shift signals.`,
    'contradiction-finder': `${caseName} has conflicts grouped by consequence and source-resolution need.`,
    'deep-research': `${caseName} has a sourced research scaffold using Grounded Search and Wikidata as the MVP source path.`,
    'stakeholder-power-interest-map': `${caseName} actors are placed on a power-interest grid with engagement posture.`,
    'coalition-detector': `${caseName} has supportive, blocking, swing, and bridge actor clusters for review.`,
    'commitment-tracker': `${caseName} has commitments shaped for monitorability, attribution, and lifecycle state review.`,
  };
  return details[methodId] ?? `${caseName} has a reviewable method output.`;
}

function artifactsFor(methodId: string, caseName: string) {
  const artifactKind: Record<string, string> = {
    'position-interest-decoder': 'position-interest-table',
    'scenario-projector': 'scenario-set',
    ach: 'ach-matrix',
    'memo-drafter': 'memo-blocks',
    'frame-narrative-analyzer': 'frame-map',
    'contradiction-finder': 'contradiction-list',
    'deep-research': 'source-matrix',
    'stakeholder-power-interest-map': 'power-interest-grid',
    'coalition-detector': 'coalition-map',
    'commitment-tracker': 'commitment-table',
  };
  return [{
    kind: artifactKind[methodId] ?? 'method-artifact',
    title: `${caseName} ${titleFor(methodId)}`,
    content: 'Foundation artifact produced by the Phase 5 MVP method runtime. Keep review and provenance visible before export.',
  }];
}

function gapsFor(methodId: string, snapshot: ContextSnapshot): string[] {
  const gaps = [];
  if (snapshot.case.sourceCount < 3) gaps.push('Add more source receipts before treating this as a final answer.');
  if (snapshot.case.graphNodeCount < 10) gaps.push('Graph coverage is thin; verify actor and claim extraction.');
  if (methodId === 'memo-drafter') gaps.push('Phase 6 will add final templates and section-level AI actions.');
  if (methodId === 'deep-research') gaps.push('Live credentials determine whether grounded search runs or returns the local unavailable state.');
  if (gaps.length === 0) gaps.push('No blocking gaps detected; analyst review still required.');
  return gaps;
}

function nextActionsFor(methodId: string): string[] {
  const common = ['Review citations and confidence before sharing.', 'Save accepted output as an owner-scoped tool artifact.'];
  const map: Record<string, string[]> = {
    'position-interest-decoder': ['Test inferred interests with mediator questions.'],
    'scenario-projector': ['Attach indicators to the timeline panel.'],
    ach: ['Challenge the leading hypothesis with disconfirming evidence.'],
    'memo-drafter': ['Open Drafting Studio and choose a Phase 6 template when available.'],
    'frame-narrative-analyzer': ['Compare frames across source tiers before using public lines.'],
    'contradiction-finder': ['Resolve high-stakes contradictions before memo export.'],
    'deep-research': ['Promote verified source candidates into the Context source panel.'],
    'stakeholder-power-interest-map': ['Use the grid to choose outreach priority.'],
    'coalition-detector': ['Inspect bridge actors and blocking risks.'],
    'commitment-tracker': ['Clarify verification triggers and accountable actor fields.'],
  };
  return [...(map[methodId] ?? []), ...common];
}
