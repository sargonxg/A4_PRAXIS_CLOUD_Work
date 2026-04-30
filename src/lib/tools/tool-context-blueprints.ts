import { TOOL_REGISTRY, getToolById } from '@/lib/constants/tool-registry';
import { getToolOperatingContract } from '@/lib/tools/tool-operating-contracts';
import { getToolPathMembership } from '@/lib/tools/tool-path-taxonomy';
import type { Situation, ToolCategory } from '@/types/situation';

export type ToolContextLayer =
  | 'analyst-profile'
  | 'user-preferences'
  | 'situation-record'
  | 'source-library'
  | 'document-corpus'
  | 'prior-tool-outputs'
  | 'live-web-research'
  | 'external-feeds'
  | 'graph-backbone'
  | 'drafting-constraints'
  | 'advisor-memory'
  | 'team-workspace';

export type GraphBackboneMode = 'none' | 'read' | 'read-write' | 'premium-dialectica';

export interface ToolDatabaseBlueprint {
  canonicalOutputPath: string;
  versionHistoryPath: string;
  legacyCompatibilityPath: string;
  graphProposalPath: string;
  sourceCorpusPath: string;
  documentChunkPath: string;
  auditTrailPath: string;
}

export interface ToolContextBlueprint {
  toolId: string;
  name: string;
  category: ToolCategory;
  purpose: string;
  activePathFocus: boolean;
  pathMembership: string[];
  requiredLayers: ToolContextLayer[];
  optionalLayers: ToolContextLayer[];
  requiredSituationFields: string[];
  requiredClarifications: string[];
  database: ToolDatabaseBlueprint;
  graphBackbone: {
    currentMode: GraphBackboneMode;
    futureDialecticaRole: string;
  };
  evidencePolicy: {
    primarySources: string[];
    mustShowProvenance: boolean;
    degradedWhenMissing: string[];
  };
  documentProduction: {
    supportsLibreOfficeExport: boolean;
    artifactTypes: string[];
    exportNotes: string[];
  };
  downstreamReuse: string[];
}

export interface ToolContextReadiness {
  toolId: string;
  ready: boolean;
  missingSituationFields: string[];
  missingRequiredLayers: ToolContextLayer[];
  nextQuestion: string | null;
}

const DRAFTING_TOOL_IDS = new Set([
  'briefing',
  'dossier',
  'policy-memo',
  'talking-points',
  'mediation-design',
  'un-toolkit',
  'report-studio',
  'daily-brief',
]);

const LEGAL_DOCUMENT_TOOL_IDS = new Set([
  'legal-tracker',
  'sanctions',
  'treaty-analyzer',
  'human-rights',
  'un-toolkit',
  'policy-memo',
]);

const GRAPH_WRITER_TOOL_IDS = new Set([
  'conflict-graph',
  'situation-intelligence',
  'documents',
  'argus',
  'deep-search-agent',
  'actor-profiles',
  'stakeholder-map',
  'timeline',
]);

const LIVE_RESEARCH_TOOL_IDS = new Set([
  'source-scout',
  'deep-search-agent',
  'argus',
  'sources-library',
  'media-roundup',
  'info-environment',
  'legal-tracker',
  'sanctions',
  'treaty-analyzer',
  'grounded-search',
]);

const ACTIVE_PATH_LABELS = new Set(['Generic core', 'Conflict analyst']);

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}

function isActivePathMembership(label: string): boolean {
  return ACTIVE_PATH_LABELS.has(label);
}

function databaseBlueprint(toolId: string): ToolDatabaseBlueprint {
  return {
    canonicalOutputPath: `users/{uid}/situations/{situationId}/tool-data/${toolId}`,
    versionHistoryPath: `users/{uid}/situations/{situationId}/tool-data/${toolId}/versions/{version}`,
    legacyCompatibilityPath: `users/{uid}/situations/{situationId}/tools/${toolId}`,
    graphProposalPath: 'users/{uid}/situations/{situationId}/graph_updates/{proposalId}',
    sourceCorpusPath: 'users/{uid}/situations/{situationId}/sources/{sourceId}',
    documentChunkPath: 'users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}',
    auditTrailPath: 'users/{uid}/situations/{situationId}/tool-runs/{toolRunId}',
  };
}

function graphMode(toolId: string, category: ToolCategory): GraphBackboneMode {
  if (GRAPH_WRITER_TOOL_IDS.has(toolId)) return 'read-write';
  if (category === 'analysis' || category === 'intelligence' || category === 'drafting') return 'read';
  if (category === 'context') return 'read';
  return 'none';
}

function requiredLayersFor(toolId: string, category: ToolCategory): ToolContextLayer[] {
  const layers: ToolContextLayer[] = ['analyst-profile', 'user-preferences', 'situation-record'];

  if (category === 'analysis' || category === 'drafting' || category === 'simulation') {
    layers.push('prior-tool-outputs');
  }
  if (category === 'drafting' || DRAFTING_TOOL_IDS.has(toolId) || LEGAL_DOCUMENT_TOOL_IDS.has(toolId)) {
    layers.push('document-corpus', 'drafting-constraints');
  }
  if (category === 'intelligence' || LIVE_RESEARCH_TOOL_IDS.has(toolId)) {
    layers.push('source-library', 'live-web-research');
  }
  if (GRAPH_WRITER_TOOL_IDS.has(toolId) || category === 'analysis' || category === 'simulation') {
    layers.push('graph-backbone');
  }
  if (category === 'workspace') {
    layers.push('team-workspace');
  }

  return unique(layers);
}

function optionalLayersFor(toolId: string, category: ToolCategory): ToolContextLayer[] {
  const layers: ToolContextLayer[] = ['advisor-memory'];
  if (!LIVE_RESEARCH_TOOL_IDS.has(toolId)) layers.push('live-web-research');
  if (!GRAPH_WRITER_TOOL_IDS.has(toolId) && category !== 'workspace') layers.push('graph-backbone');
  if (category !== 'drafting' && !DRAFTING_TOOL_IDS.has(toolId)) layers.push('document-corpus');
  if (category !== 'intelligence') layers.push('source-library');
  const tool = getToolById(toolId);
  if (tool?.dataSources.length) layers.push('external-feeds');
  return unique(layers.filter((layer) => !requiredLayersFor(toolId, category).includes(layer)));
}

function documentArtifactTypes(toolId: string): string[] {
  if (toolId === 'policy-memo') return ['policy memo', 'options paper', 'decision memo'];
  if (toolId === 'talking-points') return ['talking points', 'Q&A prep', 'press lines'];
  if (toolId === 'briefing') return ['intelligence briefing', 'daily read', 'situation brief'];
  if (toolId === 'dossier') return ['diplomatic dossier', 'actor dossier', 'case file'];
  if (toolId === 'un-toolkit') return ['draft clauses', 'mandate language', 'UN note'];
  if (toolId === 'report-studio') return ['full report', 'export packet'];
  if (LEGAL_DOCUMENT_TOOL_IDS.has(toolId)) return ['legal analysis note', 'compliance note'];
  if (DRAFTING_TOOL_IDS.has(toolId)) return ['draft artifact'];
  return [];
}

function primarySourcesFor(toolId: string): string[] {
  const tool = getToolById(toolId);
  const base = ['active situation record', 'analyst profile and preferences'];
  const sources = [
    ...base,
    ...(tool?.dataSources ?? []),
    ...(LIVE_RESEARCH_TOOL_IDS.has(toolId) ? ['grounded web search receipts'] : []),
    ...(DRAFTING_TOOL_IDS.has(toolId) || LEGAL_DOCUMENT_TOOL_IDS.has(toolId) ? ['uploaded documents and extracted fragments'] : []),
    ...(GRAPH_WRITER_TOOL_IDS.has(toolId) ? ['ACO graph primitives and graph proposals'] : []),
  ];
  return unique(sources);
}

function degradedReasons(toolId: string): string[] {
  const reasons = ['missing active situation', 'missing required situation fields'];
  if (LIVE_RESEARCH_TOOL_IDS.has(toolId)) reasons.push('no checkable web/source receipts');
  if (DRAFTING_TOOL_IDS.has(toolId) || LEGAL_DOCUMENT_TOOL_IDS.has(toolId)) reasons.push('no document/source evidence for key claims');
  if (GRAPH_WRITER_TOOL_IDS.has(toolId)) reasons.push('no graph primitives or approved graph context yet');
  return unique(reasons);
}

export function getToolContextBlueprint(toolId: string): ToolContextBlueprint {
  const tool = getToolById(toolId);
  const contract = getToolOperatingContract(toolId);
  const category = tool?.category ?? 'context';
  const memberships = getToolPathMembership(toolId);
  const pathMembership = memberships.map((membership) => `${membership.label}:${membership.tier}:${membership.stage}`);
  const requiredLayers = requiredLayersFor(toolId, category);
  const artifacts = documentArtifactTypes(toolId);

  return {
    toolId,
    name: tool?.name ?? toolId,
    category,
    purpose: contract.objective,
    activePathFocus: memberships.some((membership) => isActivePathMembership(membership.label) && membership.stage === 'active'),
    pathMembership,
    requiredLayers,
    optionalLayers: optionalLayersFor(toolId, category),
    requiredSituationFields: contract.situationInputs,
    requiredClarifications: contract.requiredQuestions.map((question) => question.label),
    database: databaseBlueprint(toolId),
    graphBackbone: {
      currentMode: graphMode(toolId, category),
      futureDialecticaRole: graphMode(toolId, category) === 'none'
        ? 'No direct graph role yet; may read finalized Dialectica summaries later.'
        : 'Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.',
    },
    evidencePolicy: {
      primarySources: primarySourcesFor(toolId),
      mustShowProvenance: tool?.credits !== 0 || category !== 'workspace',
      degradedWhenMissing: degradedReasons(toolId),
    },
    documentProduction: {
      supportsLibreOfficeExport: artifacts.length > 0,
      artifactTypes: artifacts,
      exportNotes: artifacts.length
        ? ['Produce structured sections first; export adapters can render to DOCX/PDF/LibreOffice later without re-calling the model.']
        : ['Not a document-production tool; expose structured output to Report Studio when useful.'],
    },
    downstreamReuse: unique([...(tool?.relatedTools ?? []), ...contract.askPraxisActions.slice(0, 2)]),
  };
}

export function getAllToolContextBlueprints(): ToolContextBlueprint[] {
  return TOOL_REGISTRY.map((tool) => getToolContextBlueprint(tool.id));
}

export function getToolContextReadiness(toolId: string, situation?: Partial<Situation> | null): ToolContextReadiness {
  const blueprint = getToolContextBlueprint(toolId);
  const missingSituationFields = blueprint.requiredSituationFields.filter((field) => {
    if (!situation) return true;
    const value = situation[field as keyof Situation];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === '';
  });
  const missingRequiredLayers: ToolContextLayer[] = situation ? [] : ['situation-record'];
  return {
    toolId,
    ready: missingSituationFields.length === 0 && missingRequiredLayers.length === 0,
    missingSituationFields,
    missingRequiredLayers,
    nextQuestion: missingSituationFields.length
      ? `Please add ${missingSituationFields[0]} to the active situation before relying on ${blueprint.name}.`
      : null,
  };
}

export function buildToolContextBlueprintPrompt(toolId: string): string {
  const blueprint = getToolContextBlueprint(toolId);
  return [
    `## PRAXIS Tool Context Blueprint: ${blueprint.name}`,
    `Tool id: ${blueprint.toolId}`,
    `Purpose: ${blueprint.purpose}`,
    `Required context layers: ${blueprint.requiredLayers.join(', ')}`,
    `Optional context layers: ${blueprint.optionalLayers.join(', ') || 'none'}`,
    `Canonical output path: ${blueprint.database.canonicalOutputPath}`,
    `Graph backbone: ${blueprint.graphBackbone.currentMode} - ${blueprint.graphBackbone.futureDialecticaRole}`,
    `Primary evidence: ${blueprint.evidencePolicy.primarySources.join(', ')}`,
    `Degraded state if: ${blueprint.evidencePolicy.degradedWhenMissing.join('; ')}`,
    `Document export: ${blueprint.documentProduction.supportsLibreOfficeExport ? blueprint.documentProduction.artifactTypes.join(', ') : 'not primary'}`,
  ].join('\n');
}
