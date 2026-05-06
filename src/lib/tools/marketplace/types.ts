import type { OntologyId } from '@/lib/ontology/types';

export type MarketplaceToolCategory = 'conflict' | 'mediation' | 'governance' | 'narrative' | 'cross';
export type MarketplaceCostClass = 'low' | 'medium' | 'high';

export interface LooseObjectSchema {
  type: 'object';
  description?: string;
  properties?: Record<string, { type: string; description?: string }>;
  required?: string[];
  additionalProperties: boolean;
}

export interface MarketplaceToolDefinition {
  id: string;
  name: string;
  category: MarketplaceToolCategory;
  description: string;
  ontologyRequirements: OntologyId[];
  minContextHealth: number;
  estimatedRuntimeMs: number;
  costClass: MarketplaceCostClass;
  streaming: boolean;
  canaryCaseIds: string[];
  inputSchema: LooseObjectSchema;
  outputSchema: LooseObjectSchema;
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
