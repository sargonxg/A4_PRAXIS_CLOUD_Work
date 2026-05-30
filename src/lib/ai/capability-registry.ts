export type RouteFamilyId =
  | 'ask'
  | 'brief'
  | 'dossier'
  | 'framework-analysis'
  | 'scenario'
  | 'document'
  | 'extract'
  | 'search'
  | 'graph-propose'
  | 'risk'
  | 'timeline'
  | 'comparison'
  | 'visualize'
  | 'critique'
  | 'translate-tone';

export type SuperToolId =
  | 'ask-praxis'
  | 'context-builder'
  | 'research'
  | 'ontology-extractor'
  | 'graphops'
  | 'actors-stakeholders'
  | 'negotiation-designer'
  | 'risk-monitor'
  | 'scenario-projector'
  | 'legal-compliance'
  | 'narrative-media'
  | 'commitment-tracker'
  | 'review-red-team'
  | 'drafting-studio';

export type ContextCoreId =
  | 'user-core'
  | 'situation-core'
  | 'source-core'
  | 'document-core'
  | 'graph-core'
  | 'memory-core'
  | 'output-core';

export type CapabilityExecutor = 'ai-sdk' | 'genkit-js' | 'genkit-python';

export type CapabilityId =
  | 'ask-praxis'
  | 'source-search'
  | 'document-analysis'
  | 'ontology-extraction'
  | 'evidence-critique'
  | 'brief-generation'
  | 'dossier-generation'
  | 'framework-analysis'
  | 'scenario-projection'
  | 'graph-proposal'
  | 'risk-analysis'
  | 'timeline-analysis'
  | 'option-comparison'
  | 'visualization'
  | 'tone-translation'
  | 'stakeholder-mapping'
  | 'commitment-tracking'
  | 'legal-compliance'
  | 'narrative-media'
  | 'negotiation-design'
  | 'drafting-studio'
  | 'context-builder'
  | 'research'
  | 'situation-intelligence';

export interface RouteFamilyDefinition {
  id: RouteFamilyId;
  canonicalPath: `/api/ai/${string}`;
  description: string;
}

export interface CapabilityDefinition {
  capabilityId: CapabilityId;
  mode: 'answer' | 'research' | 'extract' | 'draft' | 'review' | 'model' | 'operate';
  superToolId: SuperToolId;
  routeFamily: RouteFamilyId;
  canonicalPath: `/api/ai/${string}`;
  requiredCores: ContextCoreId[];
  outputCoreId: ContextCoreId | null;
  schema: string;
  promptTemplate: string;
  executor: CapabilityExecutor;
  persistenceTarget: 'tool_run' | 'memo' | 'graph_proposal' | 'source_receipt' | 'context_capsule';
  suggestionRules: string[];
}

export const ROUTE_FAMILIES: Record<RouteFamilyId, RouteFamilyDefinition> = {
  ask: { id: 'ask', canonicalPath: '/api/ai/ask', description: 'Ask PRAXIS command plane answers.' },
  brief: { id: 'brief', canonicalPath: '/api/ai/brief', description: 'Brief, memo, and short work-product generation.' },
  dossier: { id: 'dossier', canonicalPath: '/api/ai/dossier', description: 'Longer dossiers and structured reports.' },
  'framework-analysis': { id: 'framework-analysis', canonicalPath: '/api/ai/framework-analysis', description: 'Method or framework-guided analysis.' },
  scenario: { id: 'scenario', canonicalPath: '/api/ai/scenario', description: 'Scenario, forecast, and projection work.' },
  document: { id: 'document', canonicalPath: '/api/ai/document', description: 'Document intake, structure, and source conversion.' },
  extract: { id: 'extract', canonicalPath: '/api/ai/extract', description: 'Review-gated ontology extraction.' },
  search: { id: 'search', canonicalPath: '/api/ai/search', description: 'Grounded search and source discovery.' },
  'graph-propose': { id: 'graph-propose', canonicalPath: '/api/ai/graph-propose', description: 'Graph proposal creation without automatic promotion.' },
  risk: { id: 'risk', canonicalPath: '/api/ai/risk', description: 'Risk, warning, and monitoring analysis.' },
  timeline: { id: 'timeline', canonicalPath: '/api/ai/timeline', description: 'Temporal ordering and date-sensitive checks.' },
  comparison: { id: 'comparison', canonicalPath: '/api/ai/comparison', description: 'Option, actor, or source comparison.' },
  visualize: { id: 'visualize', canonicalPath: '/api/ai/visualize', description: 'Maps, graphs, and other visual analysis outputs.' },
  critique: { id: 'critique', canonicalPath: '/api/ai/critique', description: 'Evidence critique and red-team review.' },
  'translate-tone': { id: 'translate-tone', canonicalPath: '/api/ai/translate-tone', description: 'Audience, tone, and terminology transforms.' },
};

export const CAPABILITIES: Record<CapabilityId, CapabilityDefinition> = {
  'ask-praxis': capability('ask-praxis', 'answer', 'ask-praxis', 'ask', '/api/ai/ask', ['user-core', 'situation-core', 'memory-core'], 'output-core', 'tool_run', [
    'Use when the user asks an open question.',
    'Suggest context repair when sources or capsule health are thin.',
  ]),
  'source-search': capability('source-search', 'research', 'research', 'search', '/api/ai/search', ['situation-core'], 'source-core', 'source_receipt', [
    'Use when answer confidence depends on more or fresher sources.',
    'Prefer source requests over unsupported assertions.',
  ]),
  'document-analysis': capability('document-analysis', 'extract', 'research', 'document', '/api/ai/document', ['document-core'], 'source-core', 'source_receipt', [
    'Use when the user uploads or selects a source document.',
    'Return chunks, reliability posture, and extraction status.',
  ]),
  'ontology-extraction': capability('ontology-extraction', 'extract', 'ontology-extractor', 'extract', '/api/ai/extract', ['situation-core', 'source-core'], 'graph-core', 'graph_proposal', [
    'Create review-gated Actor, Claim, Event, Commitment, Risk, and EvidenceSpan proposals only.',
  ]),
  'evidence-critique': capability('evidence-critique', 'review', 'review-red-team', 'critique', '/api/ai/critique', ['situation-core', 'source-core'], 'output-core', 'tool_run', [
    'Use for weak claims, missing evidence, contradictions, and red-team review.',
  ]),
  'brief-generation': capability('brief-generation', 'draft', 'drafting-studio', 'brief', '/api/ai/brief', ['user-core', 'situation-core', 'source-core'], 'output-core', 'memo', ['Use for memo, brief, talking-points, and auto-briefing work.']),
  'dossier-generation': capability('dossier-generation', 'draft', 'drafting-studio', 'dossier', '/api/ai/dossier', ['situation-core', 'source-core'], 'output-core', 'memo', ['Use for larger dossiers, reports, and handover packages.']),
  'framework-analysis': capability('framework-analysis', 'model', 'context-builder', 'framework-analysis', '/api/ai/framework-analysis', ['situation-core'], 'output-core', 'tool_run', ['Use when a named analytic or legal/policy framework should structure the answer.']),
  'scenario-projection': capability('scenario-projection', 'model', 'scenario-projector', 'scenario', '/api/ai/scenario', ['situation-core', 'source-core'], 'output-core', 'tool_run', ['Use for forecasts, scenarios, escalation paths, and alternative futures.']),
  'graph-proposal': capability('graph-proposal', 'extract', 'graphops', 'graph-propose', '/api/ai/graph-propose', ['situation-core', 'source-core'], 'graph-core', 'graph_proposal', ['Use when the next action is to propose, not apply, graph changes.']),
  'risk-analysis': capability('risk-analysis', 'review', 'risk-monitor', 'risk', '/api/ai/risk', ['situation-core', 'source-core'], 'output-core', 'tool_run', ['Use for risk indicators, early warning, sanctions, humanitarian, or compliance risk.']),
  'timeline-analysis': capability('timeline-analysis', 'model', 'commitment-tracker', 'timeline', '/api/ai/timeline', ['situation-core', 'source-core'], 'output-core', 'tool_run', ['Use for date-sensitive facts, events, commitments, and sequence checks.']),
  'option-comparison': capability('option-comparison', 'model', 'scenario-projector', 'comparison', '/api/ai/comparison', ['situation-core', 'source-core'], 'output-core', 'tool_run', ['Use to compare policy options, actors, sources, and tradeoffs.']),
  visualization: capability('visualization', 'model', 'graphops', 'visualize', '/api/ai/visualize', ['situation-core', 'graph-core'], 'output-core', 'tool_run', ['Use when the answer should become a map, timeline, board, graph, or visual summary.']),
  'tone-translation': capability('tone-translation', 'draft', 'drafting-studio', 'translate-tone', '/api/ai/translate-tone', ['user-core', 'output-core'], 'output-core', 'memo', ['Use to rewrite for audience, tone, terminology, or language.']),
  'stakeholder-mapping': capability('stakeholder-mapping', 'model', 'actors-stakeholders', 'framework-analysis', '/api/ai/framework-analysis', ['situation-core', 'source-core'], 'graph-core', 'graph_proposal', ['Use when the user asks to map stakeholders, power, leverage, or actor positions.']),
  'commitment-tracking': capability('commitment-tracking', 'extract', 'commitment-tracker', 'timeline', '/api/ai/timeline', ['situation-core', 'source-core'], 'graph-core', 'graph_proposal', ['Use for commitments, ceasefire terms, obligations, and follow-through.']),
  'legal-compliance': capability('legal-compliance', 'review', 'legal-compliance', 'risk', '/api/ai/risk', ['situation-core', 'source-core'], 'output-core', 'tool_run', ['Use for sanctions, human rights, legal checks, and compliance analysis.']),
  'narrative-media': capability('narrative-media', 'research', 'narrative-media', 'search', '/api/ai/search', ['situation-core', 'source-core'], 'source-core', 'source_receipt', ['Use for media scan, information environment, source reliability, and narrative risk.']),
  'negotiation-design': capability('negotiation-design', 'model', 'negotiation-designer', 'framework-analysis', '/api/ai/framework-analysis', ['situation-core', 'source-core'], 'output-core', 'tool_run', ['Use for mediation design, ZOPA/BATNA, concessions, and process options.']),
  'drafting-studio': capability('drafting-studio', 'draft', 'drafting-studio', 'brief', '/api/ai/brief', ['user-core', 'situation-core', 'source-core'], 'output-core', 'memo', ['Use for memo canvas actions: ground paragraph, cite, shorten, rewrite, stress-test.']),
  'context-builder': capability('context-builder', 'operate', 'context-builder', 'document', '/api/ai/document', ['user-core', 'situation-core'], null, 'context_capsule', ['Use to create, fork, repair, or activate a Context Capsule.']),
  research: capability('research', 'research', 'research', 'search', '/api/ai/search', ['situation-core'], 'source-core', 'source_receipt', ['Use for deep research, source scout, grounded search, and corpus search.']),
  'situation-intelligence': capability('situation-intelligence', 'model', 'context-builder', 'framework-analysis', '/api/ai/framework-analysis', ['situation-core', 'source-core', 'graph-core'], 'output-core', 'tool_run', ['Use for broader situation intelligence synthesis.']),
};

export const LEGACY_AI_ROUTE_CAPABILITY_MAP: Record<string, CapabilityId> = {
  'actor-brief': 'stakeholder-mapping',
  'actor-enrichment': 'stakeholder-mapping',
  'actor-profiles': 'stakeholder-mapping',
  'advisor-chat': 'ask-praxis',
  advisory: 'ask-praxis',
  argus: 'research',
  ask: 'ask-praxis',
  'ask-praxis': 'ask-praxis',
  'auto-briefing': 'brief-generation',
  'auto-structure': 'document-analysis',
  brief: 'brief-generation',
  'brainstorming-table': 'option-comparison',
  'brief-builder': 'brief-generation',
  'briefing-generate': 'brief-generation',
  chat: 'ask-praxis',
  'commitment-scan': 'commitment-tracking',
  compare: 'option-comparison',
  comparison: 'option-comparison',
  concordia: 'negotiation-design',
  critique: 'evidence-critique',
  'dashboard-summary': 'situation-intelligence',
  document: 'document-analysis',
  'deep-research': 'research',
  'deep-search-agent': 'research',
  dialectica: 'graph-proposal',
  'discover-sources': 'source-search',
  'dossier-generate': 'dossier-generation',
  'drafting-action': 'drafting-studio',
  'economic-impact': 'risk-analysis',
  'electoral-risk': 'risk-analysis',
  'escalation-scan': 'risk-analysis',
  'external-actors': 'stakeholder-mapping',
  extract: 'ontology-extraction',
  'extract-episodes': 'ontology-extraction',
  forecast: 'scenario-projection',
  'game-theory': 'scenario-projection',
  geospatial: 'visualization',
  'graph-propose': 'graph-proposal',
  'grounded-search': 'source-search',
  'human-rights': 'legal-compliance',
  humanitarian: 'risk-analysis',
  'info-environment': 'narrative-media',
  'legal-check': 'legal-compliance',
  'legal-tracker': 'legal-compliance',
  'media-analyze': 'narrative-media',
  'media-compass': 'narrative-media',
  'media-roundup': 'narrative-media',
  'media-scan': 'narrative-media',
  'mediation-design': 'negotiation-design',
  negotiation: 'negotiation-design',
  'peacebuilding-index': 'risk-analysis',
  pir: 'framework-analysis',
  'policy-memo': 'brief-generation',
  'power-map': 'stakeholder-mapping',
  'red-team-review': 'evidence-critique',
  report: 'dossier-generation',
  'research-extract': 'ontology-extraction',
  resolution: 'negotiation-design',
  'risk-assessment': 'risk-analysis',
  'risk-indicators': 'risk-analysis',
  sanctions: 'legal-compliance',
  'sanctions-check': 'legal-compliance',
  'sanctions-scan': 'legal-compliance',
  sat: 'framework-analysis',
  scenario: 'scenario-projection',
  search: 'source-search',
  'situation-intelligence': 'situation-intelligence',
  'source-scout': 'source-search',
  sourceability: 'evidence-critique',
  'stakeholder-map': 'stakeholder-mapping',
  'talking-points': 'brief-generation',
  terminology: 'tone-translation',
  'timeline-events': 'timeline-analysis',
  'translate-tone': 'tone-translation',
  'treaty-analyze': 'legal-compliance',
  'un-toolkit': 'framework-analysis',
  writer: 'drafting-studio',
};

export function getCapability(capabilityId: CapabilityId): CapabilityDefinition {
  return CAPABILITIES[capabilityId];
}

export function getCapabilityForLegacyAiRoute(routeName: string): CapabilityDefinition | null {
  const capabilityId = LEGACY_AI_ROUTE_CAPABILITY_MAP[routeName];
  return capabilityId ? CAPABILITIES[capabilityId] : null;
}

function capability(
  capabilityId: CapabilityId,
  mode: CapabilityDefinition['mode'],
  superToolId: SuperToolId,
  routeFamily: RouteFamilyId,
  canonicalPath: `/api/ai/${string}`,
  requiredCores: ContextCoreId[],
  outputCoreId: ContextCoreId | null,
  persistenceTarget: CapabilityDefinition['persistenceTarget'],
  suggestionRules: string[],
): CapabilityDefinition {
  return {
    capabilityId,
    mode,
    superToolId,
    routeFamily,
    canonicalPath,
    requiredCores,
    outputCoreId,
    schema: `${capabilityId}.v1`,
    promptTemplate: `${routeFamily}.${capabilityId}.v1`,
    executor: 'ai-sdk',
    persistenceTarget,
    suggestionRules,
  };
}
