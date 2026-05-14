import {
  CONSOLIDATED_TOOLS,
  type ConsolidatedToolDefinition,
} from '@/lib/constants/consolidated-tools';
import {
  PRODUCT_EXPERIENCE_AREAS,
  type ProductExperienceAreaId,
} from '@/lib/product/experience-map';

export type ContextCoreId =
  | 'praxis-core'
  | 'user-core'
  | 'team-core'
  | 'situation-core'
  | 'path-core'
  | 'source-core'
  | 'document-core'
  | 'graph-core'
  | 'time-core'
  | 'output-core'
  | 'tool-core'
  | 'objective-core'
  | 'product-core'
  | 'memory-core';

export type ContextCoreOwnerScope = 'platform' | 'user' | 'team' | 'situation' | 'artifact';

export interface ContextCoreDefinition {
  id: ContextCoreId;
  label: string;
  ownerScope: ContextCoreOwnerScope;
  memoryLayer: string;
  summary: string;
  backedBy: string[];
  multiUserBehavior: string;
  currentPosture: 'live' | 'live-with-optional-cognee' | 'staged';
}

export interface SimplifiedCapabilityLedgerEntry {
  toolId: string;
  label: string;
  experienceArea: ProductExperienceAreaId;
  contextCoreIds: ContextCoreId[];
  preservedToolIds: string[];
  primaryOutput: string;
  liveAiCapability: string;
  currentPosture: ContextCoreDefinition['currentPosture'];
}

export const CONTEXT_CORES: ContextCoreDefinition[] = [
  {
    id: 'praxis-core',
    label: 'PRAXIS Core',
    ownerScope: 'platform',
    memoryLayer: 'app-registry',
    summary: 'The general PRAXIS operating model, tool registry, workflows, policies, and answer contract.',
    backedBy: ['consolidated tool registry', 'agentic workflow registry', 'experience map', 'audit gate'],
    multiUserBehavior: 'Shared platform logic; no user data is stored in the platform registry itself.',
    currentPosture: 'live',
  },
  {
    id: 'user-core',
    label: 'User Core',
    ownerScope: 'user',
    memoryLayer: 'profile',
    summary: 'The authenticated user profile, preferences, model posture, saved situations, and personal working style.',
    backedBy: ['Firebase Auth uid', 'profile/settings routes', 'owner-scoped Firestore documents'],
    multiUserBehavior: 'Every personal object must remain scoped to the authenticated uid and pass owner-scoping audits.',
    currentPosture: 'live',
  },
  {
    id: 'team-core',
    label: 'Team Core',
    ownerScope: 'team',
    memoryLayer: 'workspace',
    summary: 'Shared workspace context for organizations, desks, and multi-user collaboration around situations.',
    backedBy: ['workspace contracts', 'admin user routes', 'future team membership policies'],
    multiUserBehavior: 'Multiple users can work from shared context only through explicit workspace/team authorization.',
    currentPosture: 'staged',
  },
  {
    id: 'situation-core',
    label: 'Situation Core',
    ownerScope: 'situation',
    memoryLayer: 'situation',
    summary: 'The active case frame: goals, actors, geography, timeline, assumptions, gaps, and recent work.',
    backedBy: ['workbench situation model', 'case module adapters', 'Ask PRAXIS context pack'],
    multiUserBehavior: 'Situation reads and writes inherit user/team access and must never leak across owners.',
    currentPosture: 'live',
  },
  {
    id: 'path-core',
    label: 'Path Core',
    ownerScope: 'situation',
    memoryLayer: 'path-config',
    summary: 'The selected domain operator overlay: tool bundle, framework path, time horizon, source mix, prompt voice, and output defaults.',
    backedBy: ['paths/{pathId}', 'situation pathId', 'calibration path-frame'],
    multiUserBehavior: 'Path selection is situation-scoped and can be changed through admin-governed versioned path config.',
    currentPosture: 'live',
  },
  {
    id: 'source-core',
    label: 'Source Core',
    ownerScope: 'situation',
    memoryLayer: 'source-corpus',
    summary: 'Source receipts, credibility posture, coverage gaps, and retrieval-ready source fragments.',
    backedBy: ['source receipts', 'library tab', 'retriever context pack', 'Cognee recall when enabled'],
    multiUserBehavior: 'Sources are bound to the owning situation and only reusable through authorized workspace scope.',
    currentPosture: 'live-with-optional-cognee',
  },
  {
    id: 'document-core',
    label: 'Document Core',
    ownerScope: 'artifact',
    memoryLayer: 'document-corpus',
    summary: 'Uploaded documents, extracted fragments, entities, and document-to-source provenance.',
    backedBy: ['document upload API', 'source receipt writes', 'Cognee ingest queue when enabled'],
    multiUserBehavior: 'Documents belong to the uploading user or authorized situation workspace.',
    currentPosture: 'live-with-optional-cognee',
  },
  {
    id: 'graph-core',
    label: 'Graph Core',
    ownerScope: 'situation',
    memoryLayer: 'graph',
    summary: 'Canonical and advisory graph context: actors, claims, events, edges, provenance, and graph health.',
    backedBy: ['Firestore graph', 'Postgres KG target', 'GraphOps', 'Cognee candidates through review gates'],
    multiUserBehavior: 'Graph mutations stay owner-scoped and review-gated before becoming canonical.',
    currentPosture: 'live-with-optional-cognee',
  },
  {
    id: 'time-core',
    label: 'Time Core',
    ownerScope: 'situation',
    memoryLayer: 'temporal-window',
    summary: 'The validity window, freshness horizon, and temporal posture for analysis and drafting.',
    backedBy: ['timeline', 'source freshness', 'active capsule retrieval policy'],
    multiUserBehavior: 'Time windows inherit situation access and prevent stale context from being treated as current.',
    currentPosture: 'live',
  },
  {
    id: 'output-core',
    label: 'Output Core',
    ownerScope: 'artifact',
    memoryLayer: 'outputs',
    summary: 'Briefs, memos, drafts, handovers, exports, and decision packages produced from shared context.',
    backedBy: ['memo studio', 'draft chapter', 'briefing/export tools', 'saved workspace outputs'],
    multiUserBehavior: 'Outputs inherit situation or team access and preserve provenance for review.',
    currentPosture: 'live',
  },
  {
    id: 'tool-core',
    label: 'Tool Core',
    ownerScope: 'platform',
    memoryLayer: 'tool-registry',
    summary: 'The selected specialist tool bundle Ask PRAXIS can route into from the active capsule.',
    backedBy: ['consolidated tool registry', 'tool contracts', 'path-tool coverage audit'],
    multiUserBehavior: 'Tool cores are shared platform definitions; execution still reads owner-scoped context only.',
    currentPosture: 'live',
  },
  {
    id: 'objective-core',
    label: 'Objective Core',
    ownerScope: 'situation',
    memoryLayer: 'task-objective',
    summary: 'The task intent: decision support, drafting, red-team, negotiation prep, source repair, or handoff.',
    backedBy: ['Ask PRAXIS intent', 'memo objective', 'next-moves planner'],
    multiUserBehavior: 'Objectives travel with the capsule and make team handoff explicit without leaking private notes.',
    currentPosture: 'live',
  },
  {
    id: 'product-core',
    label: 'Product Core',
    ownerScope: 'artifact',
    memoryLayer: 'product-template',
    summary: 'Reusable product templates such as options memos, board notes, talking points, and handover packets.',
    backedBy: ['memo studio', 'export routes', 'handover package route'],
    multiUserBehavior: 'Products inherit capsule provenance and preserve source receipts for review.',
    currentPosture: 'live',
  },
  {
    id: 'memory-core',
    label: 'Memory Core',
    ownerScope: 'user',
    memoryLayer: 'working-memory',
    summary: 'Pinned facts, adopted preferences, recurring caveats, and remembered context for the active capsule.',
    backedBy: ['working memory API', 'Ask turn ledger', 'future Vertex Memory Bank'],
    multiUserBehavior: 'Memory is private by default and can only be shared through explicit capsule clone/handoff.',
    currentPosture: 'live',
  },
] as const;

export const CONSOLIDATED_TOOL_CONTEXT_CORES: Record<string, ContextCoreId[]> = {
  'situation-dashboard': ['praxis-core', 'user-core', 'situation-core', 'path-core', 'source-core', 'graph-core', 'output-core'],
  'context-builder': ['praxis-core', 'user-core', 'team-core', 'situation-core', 'path-core'],
  'ask-praxis': ['praxis-core', 'user-core', 'team-core', 'situation-core', 'path-core', 'source-core', 'document-core', 'graph-core', 'output-core'],
  'research-sources': ['praxis-core', 'situation-core', 'source-core', 'document-core'],
  documents: ['user-core', 'situation-core', 'source-core', 'document-core'],
  graphops: ['praxis-core', 'situation-core', 'source-core', 'document-core', 'graph-core'],
  timeline: ['situation-core', 'source-core', 'graph-core'],
  'actors-stakeholders': ['situation-core', 'source-core', 'graph-core', 'output-core'],
  'briefing-studio': ['praxis-core', 'user-core', 'team-core', 'situation-core', 'path-core', 'source-core', 'document-core', 'graph-core', 'output-core'],
};

const TOOL_TO_AREA: Record<string, ProductExperienceAreaId> = {
  'situation-dashboard': 'home',
  'context-builder': 'situation',
  'ask-praxis': 'ask',
  'research-sources': 'sources',
  documents: 'sources',
  graphops: 'situation',
  timeline: 'situation',
  'actors-stakeholders': 'situation',
  'briefing-studio': 'outputs',
};

const CORE_BY_ID = new Map(CONTEXT_CORES.map((core) => [core.id, core]));
const AREA_IDS = new Set(PRODUCT_EXPERIENCE_AREAS.map((area) => area.id));

export function getContextCore(id: ContextCoreId): ContextCoreDefinition {
  const core = CORE_BY_ID.get(id);
  if (!core) throw new Error(`Unknown PRAXIS context core: ${id}`);
  return core;
}

export function getContextCoresForTool(toolId: string): ContextCoreDefinition[] {
  return (CONSOLIDATED_TOOL_CONTEXT_CORES[toolId] ?? []).map(getContextCore);
}

export function getExperienceAreaForConsolidatedTool(
  tool: Pick<ConsolidatedToolDefinition, 'id'>,
): ProductExperienceAreaId {
  const area = TOOL_TO_AREA[tool.id];
  if (!area || !AREA_IDS.has(area)) throw new Error(`Consolidated tool ${tool.id} is missing a valid experience area`);
  return area;
}

export function getSimplifiedCapabilityLedger(): SimplifiedCapabilityLedgerEntry[] {
  return CONSOLIDATED_TOOLS.map((tool) => {
    const cores = getContextCoresForTool(tool.id);
    const currentPosture = cores.some((core) => core.currentPosture === 'staged')
      ? 'staged'
      : cores.some((core) => core.currentPosture === 'live-with-optional-cognee')
        ? 'live-with-optional-cognee'
        : 'live';

    return {
      toolId: tool.id,
      label: tool.label,
      experienceArea: getExperienceAreaForConsolidatedTool(tool),
      contextCoreIds: cores.map((core) => core.id),
      preservedToolIds: tool.absorbs,
      primaryOutput: tool.primaryOutput,
      liveAiCapability: tool.liveAiCapability,
      currentPosture,
    };
  });
}
