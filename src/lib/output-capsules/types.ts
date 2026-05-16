import type { CoreKind } from '@/lib/tools/contract';

export type OutputCapsuleFamily =
  | 'daily'
  | 'country'
  | 'actor'
  | 'conflict'
  | 'humanitarian'
  | 'diplomatic'
  | 'mediation'
  | 'legal-sanctions'
  | 'media-info'
  | 'risk'
  | 'board-exec'
  | 'research'
  | 'tactical'
  | 'policy'
  | 'composite';

export type OutputCapsuleStatus = 'draft' | 'review' | 'approved' | 'shipped';

export type OutputCapsuleRenderer = 'memo-blocks' | 'card' | 'table' | 'map' | 'custom';

export type OutputCapsuleExportFormat = 'md' | 'docx' | 'pdf' | 'pptx' | 'html' | 'json';

export type OutputCapsuleProducerKind = 'tool' | 'agent' | 'compose';

export interface OutputCapsuleProducer {
  kind: OutputCapsuleProducerKind;
  id: string;
}

export interface OutputCapsuleTemplate {
  id: string;
  family: OutputCapsuleFamily;
  label: string;
  description: string;
  requiredCores: CoreKind[];
  optionalCores: CoreKind[];
  schemaId: string;
  schemaVersion: number;
  renderer: OutputCapsuleRenderer;
  exporters: OutputCapsuleExportFormat[];
  producibleBy: OutputCapsuleProducer[];
  composableWith: string[];
  qualityPolicy: OutputCapsuleQualityPolicy;
}

export interface OutputCapsuleRef {
  id: string;
  templateId: string;
  version?: number;
}

export interface OutputCapsuleCitation {
  id: string;
  title: string;
  uri?: string;
  sourceReceiptId?: string;
  confidence?: number;
}

export interface OutputCapsuleGap {
  id: string;
  claim: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface OutputCapsuleProvenance {
  createdBy: string;
  toolIds: string[];
  agentIds: string[];
  modelMatrixVersion?: string;
  profileVersion?: string;
  traceId?: string;
}

export interface OutputCapsuleQualityPolicy {
  minCitationCoverage: number;
  requireSourceabilityForApproval: boolean;
  requireHumanApprovalForShipping: boolean;
  blockApprovalOnUnsupportedClaims: boolean;
}

export interface OutputCapsuleQuality {
  citationCoverage: number;
  unsupportedClaimCount: number;
  gapCount: number;
  sourceabilityStatus: 'not-run' | 'clean' | 'weak' | 'blocked';
  humanApproved: boolean;
  blockers: string[];
}

export interface OutputCapsuleRecord<TPayload = unknown> {
  id: string;
  ownerUid: string;
  situationId?: string | null;
  contextCapsuleId?: string | null;
  templateId: string;
  family: OutputCapsuleFamily;
  status: OutputCapsuleStatus;
  schemaId: string;
  schemaVersion: number;
  renderer: OutputCapsuleRenderer;
  exporters: OutputCapsuleExportFormat[];
  payload: TPayload;
  citations: OutputCapsuleCitation[];
  gaps: OutputCapsuleGap[];
  inputCapsules: OutputCapsuleRef[];
  provenance: OutputCapsuleProvenance;
  quality: OutputCapsuleQuality;
  version: number;
  parentVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutputCapsulePlanStep {
  id: string;
  kind: 'tool' | 'agent' | 'compose';
  label: string;
  toolId?: string;
  agentId?: string;
  inputTemplateIds?: string[];
  outputTemplateId: string;
}

export interface OutputCapsulePlan {
  targetTemplate: OutputCapsuleTemplate;
  missingRequiredCores: CoreKind[];
  suggestedSteps: OutputCapsulePlanStep[];
  composeSteps: OutputCapsulePlanStep[];
  approvalGates: string[];
  destination: 'ask' | 'memo-studio' | 'library' | 'canvas' | 'handover';
  canRun: boolean;
  explanation: string;
}
