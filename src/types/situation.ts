import type { CaseOntology } from '@/lib/constants/case-registry';

// ============================================================================
// Tool Registry Types
// ============================================================================

export type ToolCategory =
  | 'context'
  | 'analysis'
  | 'drafting'
  | 'simulation'
  | 'intelligence'
  | 'workspace';

export type ToolOutputType = 'structured' | 'streaming' | 'hybrid';

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  shortDescription: string;
  credits: number;
  icon: string;
  aiRoute: string;
  dataSchema: string;
  requiredSituationFields: string[];
  outputType: ToolOutputType;
  frameworks: string[];
  dataSources: string[];
  relatedTools: string[];
  methodology: string;
  /** Hours after which tool output is considered stale. Undefined = never stale. */
  staleAfterHours?: number;
  /** Model tier preference for this tool. Defaults to provider routing logic. */
  modelTier?: 'flash' | 'pro' | 'analysis' | 'thinking';
}

// ============================================================================

export type SituationType =
  | 'international'
  | 'civil'
  | 'political'
  | 'trade'
  | 'workplace'
  | 'community'
  | 'legal'
  | 'custom';

export type UserRole =
  | 'observer'
  | 'analyst'
  | 'mediator'
  | 'party'
  | 'advisor'
  | 'researcher';

export type SituationStatus = 'active' | 'archived' | 'resolved';
export type EscalationTrend = 'stable' | 'escalating' | 'de-escalating' | 'volatile';

// v4.0 additions
export type ConflictClassification =
  | 'interstate'
  | 'intrastate'
  | 'internationalized_intrastate'
  | 'non_state'
  | 'extrastate'
  | 'other';

export type UcdpIntensity = 'minor' | 'war' | 'non_state' | null;

export type AnalysisPhase = 'intake' | 'mapping' | 'assessment' | 'monitoring' | 'reporting';

export interface Situation {
  id: string;
  name: string;
  type: SituationType;
  description: string;
  region: string;
  actors: string[];
  userRole: UserRole;
  status: SituationStatus;
  riskScore: number;
  glaslStage: number | null;
  escalationTrend: EscalationTrend;
  actorCount: number;
  graphEntities: number;
  documentCount: number;
  sourceUrls?: string[];
  contextNotes?: string;
  initialDocumentIds?: string[];
  createdAt: string;
  updatedAt: string;
  // v4.0 — all optional for backwards compatibility
  conflictClassification?: ConflictClassification;
  ucdpIntensity?: UcdpIntensity;
  informRiskIndex?: {
    hazard: number;
    vulnerability: number;
    lackOfCoping: number;
    composite: number;
  } | null;
  fragileStatesIndex?: number | null;
  gdpPerCapita?: number | null;
  populationAffected?: number | null;
  conflictOnsetDate?: string | null;
  latestEventDate?: string | null;
  geoBoundingBox?: { north: number; south: number; east: number; west: number } | null;
  keyDates?: { date: string; label: string; significance: 'critical' | 'high' | 'medium' | 'low' }[];
  linkedSituations?: string[];
  tags?: string[];
  analysisPhase?: AnalysisPhase;
  lastAiRefresh?: string | null;
  dataCompleteness?: number;
  ontology?: CaseOntology;
  canonicalPreCheck?: {
    currentLeadership?: string;
    currentStatus?: string;
    lastMajorEvent?: string;
    correctionCount?: number;
    checkedAt?: string;
  };
  // Domain classification — single domain per situation, set at creation by
  // the classifier and user-editable. Defaults to 'generic' if not yet set.
  // See: src/lib/domain/classifier.ts and spec §4.3.
  domain?: string;
  domainConfidence?: number;
  domainOverriddenByUser?: boolean;
  domainVersion?: number;
  domainClassifiedAt?: string | null;
  // Per-situation preferences — all optional, default gracefully when absent.
  // See: src/app/app/situations/[id]/settings/page.tsx (Preferences tab).
  languageOverride?: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  sourceCategoriesEnabled?: Record<string, boolean>;
  /**
   * Ordered list of source category ids reflecting the user's priority
   * ordering (first = highest priority). When absent, the canonical order
   * from `SOURCE_CATEGORIES` is used.
   */
  sourceCategoryOrder?: string[];
  /**
   * Custom per-situation source URLs the user attached via the SourcePicker
   * "Add custom source" dialog. These are scraped alongside the built-in
   * feeds for this situation.
   */
  customSources?: Array<{
    id: string;
    url: string;
    name?: string;
    categoryId: string;
  }>;
}

export interface CreateSituationInput {
  name: string;
  type: SituationType;
  description: string;
  region: string;
  actors: string[];
  userRole: UserRole;
  status?: SituationStatus;
  sourceUrls?: string[];
  contextNotes?: string;
  initialDocumentIds?: string[];
  ontology?: CaseOntology;
  /** Optional pre-classified domain from the wizard review step. */
  domain?: string;
  domainConfidence?: number;
  domainOverriddenByUser?: boolean;
}
