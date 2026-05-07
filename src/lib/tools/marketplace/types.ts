import type { OntologyId } from '@/lib/ontology/types';
import type { ContextSpec } from '@/types/context';
import type { SATCategory } from '@/types/sats';

export type MarketplaceToolCategory = OntologyId | 'cross';
export type MarketplaceCostClass = 'low' | 'medium' | 'high';
export type ToolContractCategory = 'analysis' | 'synthesis' | 'export' | 'utility' | 'meta';
export type SubagentId = 'context-preparer' | 'source-augmenter' | 'output-refiner' | 'memo-drafter' | 'red-team-analyst';

export interface LooseObjectSchema {
  type: 'object';
  description?: string;
  properties?: Record<string, { type: string; description?: string }>;
  required?: string[];
  additionalProperties: boolean;
}

export interface MarketplaceToolDefinition {
  id: string;
  version: string;
  name: string;
  title: string;
  category: MarketplaceToolCategory;
  contractCategory: ToolContractCategory;
  satCategory?: SATCategory;
  description: string;
  rationale?: string;
  ontologyRequirements: OntologyId[];
  minContextHealth: number;
  estimatedRuntimeMs: number;
  costClass: MarketplaceCostClass;
  streaming: boolean;
  canaryCaseIds: string[];
  inputSchema: LooseObjectSchema;
  outputSchema: LooseObjectSchema;
  contextSpec: ContextSpec;
  contextHints?: ContextSpec;
  composition: {
    canChainInto: string[];
    canChainFrom: string[];
    contextProjection?: string;
  };
  sideEffects: {
    proposesGraphChanges: boolean;
    writesMemoBlocks: boolean;
    writesAuditLogs: boolean;
  };
  subagentDeps: SubagentId[];
  skill: {
    file: string;
  };
  persistence: {
    storesRawText: boolean;
    storesContextDump: boolean;
    storesStructuredOutput: boolean;
  };
}

export interface MarketplaceFilter {
  ontologyId?: OntologyId | 'all';
  category?: MarketplaceToolCategory | 'all';
  maxCostClass?: MarketplaceCostClass;
  contextHealth?: number;
}
