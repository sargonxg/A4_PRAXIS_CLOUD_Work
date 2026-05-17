import type { CaseOntology } from '@/lib/constants/case-registry';
import type { CaseTypeId } from '@/lib/ontology/case-types';
import type { OntologyId } from '@/lib/ontology/types';
import type { SemanticaContextGraph } from '@/lib/semantica/context-core-adapter';

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
export type ToolSurface = 'hero' | 'archive' | 'admin';
export type ToolTier = 'calibrated-ai' | 'deterministic-structural';

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  /** Public navigation surface. Hero tools are the opinionated default app. */
  surface: ToolSurface;
  /** False keeps a tool routable but hidden from default user navigation. */
  visible: boolean;
  /**
   * Whether this tool's route calls calibrated AI or deterministic structural logic.
   * Hero+visible tools are additionally enforced by audit:hero-tool-calibration-coverage.
   */
  tier: ToolTier;
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
  | 'researcher'
  | 'human_rights_officer'
  | 'sanctions_analyst'
  | 'humanitarian_coordinator'
  | 'treaty_lawyer'
  | 'defense_analyst';

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

export type ConflictIntensity = 'minor' | 'war' | 'non_state' | null;

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
  conflictIntensity?: ConflictIntensity;
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
  ontologyId?: OntologyId;
  ontologyIds?: OntologyId[];
  primaryOntologyId?: OntologyId;
  ontologyConfidence?: number;
  ontologyRationale?: string;
  ontologyOverriddenByUser?: boolean;
  caseType?: CaseTypeId;
  caseTypeSecondary?: CaseTypeId;
  caseTypeConfidence?: number;
  caseTypeLocked?: boolean;
  case_type?: CaseTypeId;
  case_type_secondary?: CaseTypeId;
  case_type_confidence?: number;
  case_type_locked?: boolean;
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
  /**
   * Path Core overlay selected for this situation. The path is a domain-specific
   * operator profile: ordered tool bundle, framework path, source mix, time
   * horizon, prompt voice, and output defaults.
   */
  pathId?: string;
  pathConfidence?: number;
  pathOverriddenByUser?: boolean;
  pathVersion?: number;
  pathClassifiedAt?: string | null;
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
   * Product-facing workflow path selected at situation creation. Used to tune
   * dashboard quick actions and onboarding recommendations.
   */
  workflowPath?: string;
  workflowPathLabel?: string;
  /**
   * Compact context-graph seed emitted during situation creation. This is
   * intentionally a portable JSON graph, not a runtime Semantica dependency.
   */
  semanticaContextGraph?: SemanticaContextGraph;
  semanticaLayer?: {
    enabled: boolean;
    adapterVersion: string;
    serviceBoundary: string;
  };
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
  ontologyId?: OntologyId;
  ontologyIds?: OntologyId[];
  primaryOntologyId?: OntologyId;
  ontologyConfidence?: number;
  ontologyRationale?: string;
  ontologyOverriddenByUser?: boolean;
  caseType?: CaseTypeId;
  caseTypeSecondary?: CaseTypeId;
  caseTypeConfidence?: number;
  caseTypeLocked?: boolean;
  case_type?: CaseTypeId;
  case_type_secondary?: CaseTypeId;
  case_type_confidence?: number;
  case_type_locked?: boolean;
  /** Optional pre-classified domain from the wizard review step. */
  domain?: string;
  domainConfidence?: number;
  domainOverriddenByUser?: boolean;
  pathId?: string;
  pathConfidence?: number;
  pathOverriddenByUser?: boolean;
  riskScore?: number;
  glaslStage?: number | null;
  escalationTrend?: EscalationTrend;
  sourceCategoriesEnabled?: Record<string, boolean>;
  sourceCategoryOrder?: string[];
  workflowPath?: string;
  workflowPathLabel?: string;
  semanticaContextGraph?: SemanticaContextGraph;
  semanticaLayer?: {
    enabled: boolean;
    adapterVersion: string;
    serviceBoundary: string;
  };
  customSources?: Array<{
    id: string;
    url: string;
    name?: string;
    categoryId: string;
  }>;
}
