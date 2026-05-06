import type { MarketplaceToolDefinition, SubagentId, ToolContractCategory } from '@/lib/tools/marketplace/types';
import type { ContextSpec } from '@/types/context';

const looseInput = (description: string) => ({
  type: 'object' as const,
  description,
  properties: {
    prompt: { type: 'string', description: 'Analyst instruction or tool question.' },
    context: { type: 'object', description: 'Workbench context, source receipts, graph snippets, and free-form notes.' },
  },
  additionalProperties: true,
});

const looseOutput = (description: string) => ({
  type: 'object' as const,
  description,
  properties: {
    summary: { type: 'string', description: 'Human-readable result.' },
    claims: { type: 'array', description: 'Claims or findings with optional provenance.' },
    artifacts: { type: 'array', description: 'Generated text, tables, plans, or graph changes.' },
  },
  additionalProperties: true,
});

function contractCategory(category: MarketplaceToolDefinition['category']): ToolContractCategory {
  if (category === 'cross') return 'synthesis';
  return 'analysis';
}

function defaultSubagents(category: MarketplaceToolDefinition['category']): SubagentId[] {
  if (category === 'cross') return ['context-preparer', 'output-refiner'];
  return ['context-preparer'];
}

function defaultContextSpec(input: Pick<MarketplaceToolDefinition, 'ontologyRequirements' | 'minContextHealth'>): ContextSpec {
  return {
    user: { role: true, preferences: true },
    workspace: { methodologyDocs: true },
    caseGraph: {
      minNodeCount: Math.max(1, Math.round(input.minContextHealth * 20)),
      requiredOntology: input.ontologyRequirements[0],
    },
    conversation: { focusedNodeRequired: false },
    minHealthScore: Math.round(input.minContextHealth * 100),
    graceful: true,
  };
}

function tool(
  input: Omit<
    MarketplaceToolDefinition,
    'inputSchema' | 'outputSchema' | 'persistence' | 'version' | 'title' | 'contractCategory' | 'contextSpec' | 'composition' | 'sideEffects' | 'subagentDeps' | 'skill'
  > & Partial<Pick<MarketplaceToolDefinition, 'contextHints' | 'subagentDeps' | 'sideEffects'>>
): MarketplaceToolDefinition {
  return {
    ...input,
    version: '2.0.0',
    title: input.name,
    contractCategory: contractCategory(input.category),
    inputSchema: looseInput(`${input.name} accepts structured context plus free-form analyst text.`),
    outputSchema: looseOutput(`${input.name} returns structured artifacts but permits raw generated text and nested context.`),
    contextSpec: defaultContextSpec(input),
    composition: {
      canChainInto: input.category === 'cross' ? [] : ['cross.brief-exporter', 'cross.contradiction-finder'],
      canChainFrom: [],
      contextProjection: 'src/lib/tools/marketplace/projections/default.ts',
    },
    sideEffects: {
      proposesGraphChanges: false,
      writesMemoBlocks: input.id === 'cross.brief-exporter',
      writesAuditLogs: true,
      ...input.sideEffects,
    },
    subagentDeps: input.subagentDeps ?? defaultSubagents(input.category),
    skill: {
      file: `skills/tools/${input.id}/SKILL.md`,
    },
    persistence: {
      storesRawText: true,
      storesContextDump: true,
      storesStructuredOutput: true,
    },
  };
}

export const MARKETPLACE_TOOLS: MarketplaceToolDefinition[] = [
  tool({
    id: 'conflict.leverage-trace',
    name: 'Leverage Trace',
    category: 'conflict',
    description: 'Trace pressure points from actors to constraints, interests, and likely concessions.',
    ontologyRequirements: ['conflict'],
    minContextHealth: 0.45,
    estimatedRuntimeMs: 14000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'conflict.commitment-check',
    name: 'Commitment Check',
    category: 'conflict',
    description: 'Check whether a proposed commitment is monitorable and mapped to enforcement conditions.',
    ontologyRequirements: ['conflict'],
    minContextHealth: 0.4,
    estimatedRuntimeMs: 10000,
    costClass: 'low',
    streaming: false,
    canaryCaseIds: ['syria-2026'],
  }),
  tool({
    id: 'conflict.escalation-timeline',
    name: 'Escalation Timeline',
    category: 'conflict',
    description: 'Generate a time-ordered escalation and de-escalation chronology with provenance gaps called out.',
    ontologyRequirements: ['conflict'],
    minContextHealth: 0.5,
    estimatedRuntimeMs: 16000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'mediation.position-vs-interest',
    name: 'Position vs Interest',
    category: 'mediation',
    description: 'Separate stated demands from likely underlying interests and evidence confidence.',
    ontologyRequirements: ['mediation'],
    minContextHealth: 0.35,
    estimatedRuntimeMs: 12000,
    costClass: 'low',
    streaming: true,
    canaryCaseIds: ['nordalia-2026'],
  }),
  tool({
    id: 'mediation.zopa-finder',
    name: 'ZOPA Finder',
    category: 'mediation',
    description: 'Estimate zones of possible agreement from interests, red lines, and available guarantees.',
    ontologyRequirements: ['mediation'],
    minContextHealth: 0.55,
    estimatedRuntimeMs: 18000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['nordalia-2026'],
  }),
  tool({
    id: 'mediation.mediation-brief',
    name: 'Mediation Brief',
    category: 'mediation',
    description: 'Produce a mediator-ready brief with parties, issues, options, risks, and receipt gaps.',
    ontologyRequirements: ['mediation'],
    minContextHealth: 0.45,
    estimatedRuntimeMs: 22000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'governance.veto-probability',
    name: 'Veto Probability',
    category: 'governance',
    description: 'Score likely veto points and explain drivers with mandate and coalition evidence.',
    ontologyRequirements: ['governance'],
    minContextHealth: 0.5,
    estimatedRuntimeMs: 15000,
    costClass: 'medium',
    streaming: false,
    canaryCaseIds: ['nordalia-2026'],
  }),
  tool({
    id: 'governance.mandate-traceback',
    name: 'Mandate Traceback',
    category: 'governance',
    description: 'Trace an action back to legal, procedural, or political authority claims.',
    ontologyRequirements: ['governance'],
    minContextHealth: 0.45,
    estimatedRuntimeMs: 13000,
    costClass: 'low',
    streaming: false,
    canaryCaseIds: ['syria-2026'],
  }),
  tool({
    id: 'governance.coalition-map',
    name: 'Coalition Map',
    category: 'governance',
    description: 'Map supportive, blocking, and swing actors around a mandate or policy action.',
    ontologyRequirements: ['governance'],
    minContextHealth: 0.45,
    estimatedRuntimeMs: 15000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['nordalia-2026'],
  }),
  tool({
    id: 'narrative.frame-cascade',
    name: 'Frame Cascade',
    category: 'narrative',
    description: 'Track how a frame moves across claims, messengers, audiences, and events.',
    ontologyRequirements: ['narrative'],
    minContextHealth: 0.4,
    estimatedRuntimeMs: 15000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['syria-2026'],
  }),
  tool({
    id: 'narrative.counter-narrative-finder',
    name: 'Counter-Narrative Finder',
    category: 'narrative',
    description: 'Find credible counter-frames and the evidence needed before use.',
    ontologyRequirements: ['narrative'],
    minContextHealth: 0.5,
    estimatedRuntimeMs: 18000,
    costClass: 'medium',
    streaming: true,
    canaryCaseIds: ['syria-2026'],
  }),
  tool({
    id: 'narrative.fact-check-traceback',
    name: 'Fact-Check Traceback',
    category: 'narrative',
    description: 'Trace a claim to source receipts, conflicts, uncertainty, and open gaps.',
    ontologyRequirements: ['narrative'],
    minContextHealth: 0.35,
    estimatedRuntimeMs: 11000,
    costClass: 'low',
    streaming: false,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'cross.contradiction-finder',
    name: 'Contradiction Finder',
    category: 'cross',
    description: 'Find contradictory claims across context, graph, sources, and generated artifacts.',
    ontologyRequirements: ['conflict', 'mediation', 'governance', 'narrative'],
    minContextHealth: 0.3,
    estimatedRuntimeMs: 12000,
    costClass: 'low',
    streaming: false,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'cross.context-health-explainer',
    name: 'Context Health Explainer',
    category: 'cross',
    description: 'Explain missing context, stale receipts, weak graph coverage, and next collection moves.',
    ontologyRequirements: ['conflict', 'mediation', 'governance', 'narrative'],
    minContextHealth: 0,
    estimatedRuntimeMs: 8000,
    costClass: 'low',
    streaming: false,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'cross.brief-exporter',
    name: 'Brief Exporter',
    category: 'cross',
    description: 'Export selected outputs into a decision brief with claim-level trust metadata.',
    ontologyRequirements: ['conflict', 'mediation', 'governance', 'narrative'],
    minContextHealth: 0.4,
    estimatedRuntimeMs: 9000,
    costClass: 'low',
    streaming: false,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
  tool({
    id: 'cross.scenario-projector',
    name: 'Scenario Projector',
    category: 'cross',
    description: 'Project plausible scenario paths from graph state, claims, leverage, and constraints.',
    ontologyRequirements: ['conflict', 'mediation', 'governance', 'narrative'],
    minContextHealth: 0.55,
    estimatedRuntimeMs: 26000,
    costClass: 'high',
    streaming: true,
    canaryCaseIds: ['syria-2026', 'nordalia-2026'],
  }),
];

export function getMarketplaceTool(id: string): MarketplaceToolDefinition | null {
  return MARKETPLACE_TOOLS.find((toolDefinition) => toolDefinition.id === id) ?? null;
}
