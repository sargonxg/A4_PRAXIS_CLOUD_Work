import type { AnalystProfile } from './analyst-profile';
import type { DomainId } from './domain';

export type CapsuleSchemaVersion = 'capsule/v2';
export type SemVer = string;
export type DomainKey = DomainId | (string & {});
export type FrameworkId = string;
export type ToolSurfaceId = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
export type JSONSchema7 = Record<string, unknown>;

export interface CapsuleRef {
  id: string;
  version?: SemVer;
  hash?: string;
}

export interface CapsuleImport {
  ref: CapsuleRef;
  as: string;
  pick?: Array<keyof ContextCapsule>;
}

export interface FewShotExample {
  id: string;
  input: string;
  output: string;
  notes?: string;
  version?: SemVer;
  sourceRefs?: string[];
}

export interface SourcingPolicy {
  mode: 'live-search' | 'corpus' | 'skc' | 'hybrid';
  minSourcesPerClaim: number;
  allowedDomains: string[];
  blockedDomains: string[];
  recencyWindowDays?: number;
  requiredSourceTypes: string[];
  citationStyle?: 'inline' | 'footnote' | 'source-card';
  sourceTrust?: Record<string, number>;
}

export interface RetrievalConfig {
  mode: 'live-search' | 'corpus' | 'skc' | 'hybrid';
  corpora: string[];
  graphExpansionDepth: number;
  topK: number;
  trustRank: 'balanced' | 'strict' | 'recency';
  vectorIndex?: string;
  filters?: Record<string, JsonValue>;
}

export interface VertexSafetySetting {
  category: string;
  threshold: string;
}

export interface CapsuleEvalThresholds {
  faithfulness: number;
  citationCoverage: number;
  contextRecall: number;
  schemaConformance: number;
  redTeamPassRate: number;
  safetyScore: number;
}

export type CapsuleEvalMetric =
  | 'faithfulness'
  | 'response_relevancy'
  | 'context_precision'
  | 'context_recall'
  | 'factual_correctness'
  | 'tool_call_accuracy'
  | 'agent_goal_accuracy';

export interface CapsuleEval {
  goldenSetRef: string;
  thresholds: CapsuleEvalThresholds;
  metrics: CapsuleEvalMetric[];
  judge: 'gemini-2.5-flash';
  lastRun?: {
    runId: string;
    scores: Record<string, number>;
    passedAt: string;
  };
}

export interface SigstoreBundle {
  bundle: string;
  [key: string]: unknown;
}

export interface InTotoAttestation {
  predicateType: string;
  builder?: string;
  [key: string]: unknown;
}

export interface CertificationBadge {
  tier: 'community' | 'reviewed' | 'verified';
  scores: Record<string, number>;
  evalRunId: string;
  signedBy: string;
  expiresAt: string;
}

export interface ContextCapsule {
  id: string;
  schemaVersion: CapsuleSchemaVersion;
  version: SemVer;
  contentHash: string;
  status: 'draft' | 'published' | 'deprecated' | 'verified';
  forkedFrom?: CapsuleRef;
  immutable: boolean;

  extends?: CapsuleRef;
  imports?: CapsuleImport[];
  mergeStrategy: 'prototype' | 'deep-merge' | 'override';

  persona: {
    analystProfile: Partial<AnalystProfile>;
    systemFrame: string;
    domain: DomainKey;
    frameworks: FrameworkId[];
    fewShot: FewShotExample[];
  };

  output: {
    format: 'json' | 'markdown' | 'report' | 'brief';
    responseJsonSchema: JSONSchema7;
    propertyOrdering: string[];
    zodRef?: string;
    renderTemplate?: string;
  };

  sourcing: SourcingPolicy;
  retrieval: RetrievalConfig;

  tools: {
    bound: ToolSurfaceId[];
    recommended: ToolSurfaceId[];
    policy: 'auto' | 'suggest' | 'manual';
  };

  guardrails: {
    refusalPolicy: string;
    blockedTopics: string[];
    piiHandling: 'redact' | 'block' | 'allow';
    citationRequired: boolean;
    maxUngroundedClaims: number;
    safetySettings: VertexSafetySetting[];
  };

  eval: CapsuleEval;
  provenance: {
    author: { uid: string; org?: string };
    createdAt: string;
    publishedAt?: string;
    signature?: SigstoreBundle;
    attestation?: InTotoAttestation;
    certification?: CertificationBadge;
  };

  market: {
    visibility: 'private' | 'org' | 'unlisted' | 'public';
    pricing: 'free' | 'credits' | 'subscription';
    credits?: number;
    category: DomainKey;
    tags: string[];
    installs: number;
    rating: number;
    revenueShare?: { authorUid: string; pct: number };
  };
}
