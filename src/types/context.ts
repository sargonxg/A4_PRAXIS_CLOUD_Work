import { z } from 'zod';
import type { OntologyId } from '@/lib/ontology/types';
import type { TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import type { MemoTemplateId } from '@/types/memo';
import type { WorkbenchTabId } from '@/types/workbench';

export const ContextLayerSchema = z.enum(['user', 'workspace', 'case', 'conversation']);
export const UserRoleSchema = z.enum(['diplomat', 'mediator', 'analyst', 'researcher', 'policy_advisor', 'other']);
export const CommunicationStyleSchema = z.enum(['concise', 'thorough', 'narrative']);
export const ConfidenceToleranceSchema = z.enum(['low', 'medium', 'high']);

export type ContextLayer = z.infer<typeof ContextLayerSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CommunicationStyle = z.infer<typeof CommunicationStyleSchema>;
export type ConfidenceTolerance = z.infer<typeof ConfidenceToleranceSchema>;
export type WorkspaceId = string;
export type ToolId = string;

export interface UserContext {
  uid: string;
  workspaceId: WorkspaceId;
  identity: {
    displayName: string;
    role?: UserRole;
    organization?: string;
    title?: string;
    expertise?: string[];
  };
  mandate?: {
    primaryFocus?: string;
    typicalOutputs?: MemoTemplateId[];
  };
  preferences: {
    preferredOntologies?: OntologyId[];
    defaultMemoTemplate?: MemoTemplateId;
    suggestedTools?: ToolId[];
    communicationStyle?: CommunicationStyle;
    confidenceTolerance?: ConfidenceTolerance;
  };
  capturedAt: {
    signupRoleAt?: string;
    coachCompletedAt?: string;
    preferencesUpdatedAt?: string;
  };
}

export interface WorkspaceGuideline {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  kind: 'methodology' | 'style_guide' | 'glossary' | 'reference' | 'other';
  storageRef: string;
  embeddingNodeId?: string;
  uploadedAt: string;
  textHash: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  sourceGuidelineId?: string;
}

export interface WorkspaceContext {
  workspaceId: WorkspaceId;
  ownerUid: string;
  label: string;
  guidelines: WorkspaceGuideline[];
  glossary?: GlossaryEntry[];
  methodologyDocs?: WorkspaceGuideline[];
}

export interface CaseContext {
  caseId: string;
  ownerUid: string;
  ontologyId: OntologyId;
  frame: {
    name: string;
    region?: string;
    summary?: string;
    domain?: string;
  };
  sourceCount: number;
  documentCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  contextHealth: {
    score: number;
    threshold: number;
    ready: boolean;
    lowestDimension: { id: string; label: string; score: number; detail: string };
  };
}

export interface ConversationAction {
  id: string;
  type: 'tab_changed' | 'node_focused' | 'tool_opened' | 'memo_block_edited' | 'other';
  label: string;
  at: string;
}

export interface ConversationContext {
  sessionId: string;
  startedAt: string;
  workbenchTab?: WorkbenchTabId;
  focusedNodeId?: string;
  focusedToolId?: ToolId;
  focusedMemoBlockId?: string;
  recentActions: ConversationAction[];
}

export interface ContextAdvisory {
  layer: ContextLayer;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  action?: string;
}

export interface ContextSnapshot {
  user: UserContext;
  workspace: WorkspaceContext;
  case: CaseContext;
  conversation: ConversationContext;
  composite: {
    health: number;
    weakestLayer: ContextLayer;
    advisories: ContextAdvisory[];
  };
}

export interface ContextSpec {
  user?: { role?: boolean; mandate?: boolean; preferences?: boolean };
  workspace?: { guidelines?: boolean; glossary?: boolean; methodologyDocs?: boolean };
  caseGraph?: {
    minNodeCount?: number;
    requiredPrimitives?: TacitusCorePrimitive[];
    requiredOntology?: OntologyId;
  };
  conversation?: { focusedNodeRequired?: boolean; focusedToolRequired?: boolean };
  minHealthScore?: number;
  graceful?: boolean;
}

export interface ContextExtraction {
  layer: ContextLayer;
  label: string;
  text: string;
  provenance?: string;
  synthesized: boolean;
  confidence: number;
}

export interface PreparedContext {
  spec: ContextSpec;
  source: ContextSnapshot;
  prepared: {
    summaries: Array<{ layer: ContextLayer; summary: string }>;
    extractions: ContextExtraction[];
    gapNotes: ContextAdvisory[];
    confidence: Record<ContextLayer, number>;
  };
}

export const ContextSpecSchema = z.object({
  user: z.object({
    role: z.boolean().optional(),
    mandate: z.boolean().optional(),
    preferences: z.boolean().optional(),
  }).optional(),
  workspace: z.object({
    guidelines: z.boolean().optional(),
    glossary: z.boolean().optional(),
    methodologyDocs: z.boolean().optional(),
  }).optional(),
  caseGraph: z.object({
    minNodeCount: z.number().min(0).optional(),
    requiredPrimitives: z.array(z.string()).optional(),
    requiredOntology: z.string().optional(),
  }).optional(),
  conversation: z.object({
    focusedNodeRequired: z.boolean().optional(),
    focusedToolRequired: z.boolean().optional(),
  }).optional(),
  minHealthScore: z.number().min(0).max(100).optional(),
  graceful: z.boolean().default(true),
});
