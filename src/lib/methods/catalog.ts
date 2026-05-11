import { getMarketplaceTool, MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

export type MethodCategory = 'ai' | 'research' | 'deterministic';
export type MethodStatus = 'runtime-ready' | 'context-required' | 'phase-5-runtime';

export interface MethodDefinition {
  id: string;
  runtimeId: string;
  name: string;
  category: MethodCategory;
  summary: string;
  bestFor: string[];
  inputs: string[];
  outputs: string[];
  contextNeeds: string[];
  status: MethodStatus;
  sourceToolId?: string;
  runPath?: string;
  suggestionWeight: number;
}

export interface MethodSuggestion {
  method: MethodDefinition;
  score: number;
  rationale: string;
}

const method = (definition: MethodDefinition): MethodDefinition => definition;

export const MVP_METHODS: MethodDefinition[] = [
  method({
    id: 'position-interest-decoder',
    runtimeId: 'analysis.position-vs-interest',
    name: 'Position-vs-Interest Decoder',
    category: 'ai',
    summary: 'Separates stated positions from likely underlying interests, confidence, and evidence gaps.',
    bestFor: ['Negotiation prep', 'actor diagnosis', 'mediation briefs'],
    inputs: ['actor list', 'claims', 'source excerpts'],
    outputs: ['interest map', 'confidence notes', 'questions to resolve'],
    contextNeeds: ['named actors', 'claims or public demands', 'at least one source receipt'],
    status: 'runtime-ready',
    sourceToolId: 'mediation.position-vs-interest',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 96,
  }),
  method({
    id: 'scenario-projector',
    runtimeId: 'analysis.scenario-projector',
    name: 'Scenario Projector',
    category: 'ai',
    summary: 'Projects likely, high-risk, and opportunity paths from the current context and constraints.',
    bestFor: ['foresight', 'risk briefings', 'decision timing'],
    inputs: ['current frame', 'events', 'constraints', 'assumptions'],
    outputs: ['scenario set', 'warning indicators', 'decision triggers'],
    contextNeeds: ['recent events', 'actors', 'uncertainties', 'source coverage'],
    status: 'runtime-ready',
    sourceToolId: 'cross.scenario-projector',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 89,
  }),
  method({
    id: 'ach',
    runtimeId: 'analysis.ach-hypothesis',
    name: 'Analysis of Competing Hypotheses',
    category: 'ai',
    summary: 'Compares competing explanations and highlights evidence that weakens each explanation.',
    bestFor: ['uncertain judgments', 'red-team review', 'briefing confidence'],
    inputs: ['hypotheses', 'evidence items', 'assumptions'],
    outputs: ['hypothesis matrix', 'weak evidence flags', 'next collection moves'],
    contextNeeds: ['two or more explanations', 'evidence list', 'source provenance'],
    status: 'runtime-ready',
    sourceToolId: 'cross.ach',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 92,
  }),
  method({
    id: 'memo-drafter',
    runtimeId: 'drafting.memo-drafter',
    name: 'Memo Drafter',
    category: 'ai',
    summary: 'Turns selected context, findings, and gaps into a reviewable memo draft.',
    bestFor: ['policy memos', 'executive updates', 'decision support'],
    inputs: ['memo goal', 'audience', 'selected findings', 'citations'],
    outputs: ['structured draft', 'citation gaps', 'review checklist'],
    contextNeeds: ['audience', 'key findings', 'source receipts'],
    status: 'runtime-ready',
    sourceToolId: 'cross.memo-create',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 84,
  }),
  method({
    id: 'frame-narrative-analyzer',
    runtimeId: 'analysis.frame-narrative',
    name: 'Frame & Narrative Analyzer',
    category: 'ai',
    summary: 'Finds the frames, messengers, audiences, and claim movement shaping a case.',
    bestFor: ['communication risk', 'narrative conflict', 'public positioning'],
    inputs: ['claims', 'actors', 'source excerpts', 'audiences'],
    outputs: ['frame map', 'audience exposure', 'counter-frame needs'],
    contextNeeds: ['claims', 'messengers', 'audience or stakeholder notes'],
    status: 'runtime-ready',
    sourceToolId: 'narrative.frame-cascade',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 82,
  }),
  method({
    id: 'contradiction-finder',
    runtimeId: 'analysis.contradiction-finder',
    name: 'Contradiction Finder',
    category: 'ai',
    summary: 'Flags conflicting claims across sources, notes, graph facts, and prior outputs.',
    bestFor: ['quality control', 'source review', 'briefing cleanup'],
    inputs: ['claims', 'source receipts', 'prior outputs'],
    outputs: ['contradiction list', 'source conflict notes', 'resolution tasks'],
    contextNeeds: ['claim set', 'provenance', 'prior analysis if available'],
    status: 'runtime-ready',
    sourceToolId: 'cross.contradiction-finder',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 94,
  }),
  method({
    id: 'deep-research',
    runtimeId: 'research.deep-research-agent',
    name: 'Grounded Research',
    category: 'research',
    summary: 'Runs a sourced research pass using grounded search and Wikidata where available.',
    bestFor: ['case expansion', 'source discovery', 'fact refresh'],
    inputs: ['research question', 'case scope', 'source constraints'],
    outputs: ['sourced answer', 'open questions', 'entity candidates'],
    contextNeeds: ['question', 'case scope', 'acceptable source boundaries'],
    status: 'runtime-ready',
    runPath: '/api/research/run',
    suggestionWeight: 90,
  }),
  method({
    id: 'stakeholder-power-interest-map',
    runtimeId: 'analysis.stakeholder-power-interest',
    name: 'Stakeholder Power-Interest Map',
    category: 'deterministic',
    summary: 'Ranks actors by influence and interest so engagement priorities are explicit.',
    bestFor: ['stakeholder strategy', 'engagement planning', 'briefing tables'],
    inputs: ['actors', 'influence cues', 'interest cues'],
    outputs: ['power-interest grid', 'engagement posture', 'missing actor notes'],
    contextNeeds: ['actor list', 'influence evidence', 'interest evidence'],
    status: 'runtime-ready',
    sourceToolId: 'cross.stakeholder-power-interest',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 98,
  }),
  method({
    id: 'coalition-detector',
    runtimeId: 'analysis.coalition-detector',
    name: 'Coalition Detector',
    category: 'deterministic',
    summary: 'Maps supportive, blocking, and swing actors around a policy action or negotiation move.',
    bestFor: ['coalition planning', 'mandate review', 'blocking-risk analysis'],
    inputs: ['actors', 'positions', 'institutional ties'],
    outputs: ['coalition map', 'swing actors', 'blocking risks'],
    contextNeeds: ['actors', 'positions', 'relationship evidence'],
    status: 'runtime-ready',
    sourceToolId: 'governance.coalition-map',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 86,
  }),
  method({
    id: 'commitment-tracker',
    runtimeId: 'analysis.commitment-tracker',
    name: 'Commitment Tracker',
    category: 'deterministic',
    summary: 'Checks whether a proposed commitment is monitorable, attributable, and enforceable.',
    bestFor: ['agreement drafting', 'implementation monitoring', 'risk controls'],
    inputs: ['commitment text', 'responsible actor', 'timeline', 'verification cue'],
    outputs: ['monitorability score', 'gaps', 'follow-up checks'],
    contextNeeds: ['commitment text', 'actor', 'timeline or trigger'],
    status: 'runtime-ready',
    sourceToolId: 'conflict.commitment-check',
    runPath: '/api/tools/marketplace/run',
    suggestionWeight: 88,
  }),
];

export const CATEGORY_LABELS: Record<MethodCategory, string> = {
  ai: 'AI',
  research: 'Research',
  deterministic: 'Deterministic',
};

export const STATUS_LABELS: Record<MethodStatus, string> = {
  'runtime-ready': 'Ready from a context',
  'context-required': 'Needs context',
  'phase-5-runtime': 'Runtime scheduled',
};

export function getMethodById(id: string): MethodDefinition | null {
  return MVP_METHODS.find((methodDefinition) => methodDefinition.id === id) ?? null;
}

export function getMethodSourceTool(methodDefinition: MethodDefinition): MarketplaceToolDefinition | null {
  if (!methodDefinition.sourceToolId) return null;
  return getMarketplaceTool(methodDefinition.sourceToolId);
}

export function getDeferredMarketplaceTools(): MarketplaceToolDefinition[] {
  const mvpToolIds = new Set(MVP_METHODS.map((methodDefinition) => methodDefinition.sourceToolId).filter(Boolean));
  return MARKETPLACE_TOOLS.filter((tool) => !mvpToolIds.has(tool.id));
}

export function getMethodSuggestions(input?: { query?: string; hasContext?: boolean }): MethodSuggestion[] {
  const query = input?.query?.trim().toLowerCase() ?? '';
  const hasContext = input?.hasContext ?? false;

  return MVP_METHODS
    .map((methodDefinition) => {
      const haystack = [
        methodDefinition.name,
        methodDefinition.category,
        methodDefinition.summary,
        methodDefinition.bestFor.join(' '),
        methodDefinition.outputs.join(' '),
      ].join(' ').toLowerCase();
      const queryFit = query && haystack.includes(query) ? 18 : query ? 0 : 8;
      const contextFit = hasContext && methodDefinition.status !== 'phase-5-runtime' ? 12 : 0;
      const readinessFit = methodDefinition.status === 'runtime-ready' ? 8 : methodDefinition.status === 'context-required' ? 5 : 2;
      const score = methodDefinition.suggestionWeight + queryFit + contextFit + readinessFit;
      return {
        method: methodDefinition,
        score,
        rationale: buildSuggestionRationale(methodDefinition, hasContext, Boolean(queryFit)),
      };
    })
    .sort((a, b) => b.score - a.score || a.method.name.localeCompare(b.method.name))
    .slice(0, 3);
}

function buildSuggestionRationale(methodDefinition: MethodDefinition, hasContext: boolean, queryFit: boolean): string {
  const reasons = [];
  if (queryFit) reasons.push('matches the current search');
  if (hasContext && methodDefinition.status !== 'phase-5-runtime') reasons.push('can use an active context');
  if (methodDefinition.category === 'deterministic') reasons.push('works well for structured review');
  if (methodDefinition.category === 'research') reasons.push('helps expand the evidence base');
  if (methodDefinition.category === 'ai') reasons.push('helps synthesize case material');
  if (methodDefinition.status === 'phase-5-runtime') reasons.push('drafting runtime is scheduled for the next methods wave');
  return reasons.join('; ');
}
