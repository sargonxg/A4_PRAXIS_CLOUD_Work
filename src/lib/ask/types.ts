import { z } from 'zod';

export const ASK_MODES = ['quick', 'deep', 'plan', 'memo', 'brief', 'talking_points'] as const;
export const ASK_THREAD_STATUSES = ['active', 'archived'] as const;
export const ASK_MESSAGE_ROLES = ['user', 'assistant', 'system', 'tool'] as const;
export const ASK_ROUTE_ACTIONS = ['direct_answer', 'run_skill', 'run_subagent_plan', 'clarify'] as const;
export const ASK_CITATION_SOURCE_KINDS = ['source_receipt', 'document', 'graph_node', 'graph_edge', 'core', 'web', 'other'] as const;

export type AskMode = (typeof ASK_MODES)[number];
export type AskThreadStatus = (typeof ASK_THREAD_STATUSES)[number];
export type AskMessageRole = (typeof ASK_MESSAGE_ROLES)[number];
export type AskRouteAction = (typeof ASK_ROUTE_ACTIONS)[number];
export type AskCitationSourceKind = (typeof ASK_CITATION_SOURCE_KINDS)[number];

const uuidSchema = z.string().uuid();

export const askThreadSchema = z.object({
  id: uuidSchema,
  ownerUid: z.string().min(1),
  situationId: z.string().min(1).nullable().optional(),
  situationCoreId: uuidSchema.nullable().optional(),
  title: z.string().min(1),
  mode: z.enum(ASK_MODES),
  status: z.enum(ASK_THREAD_STATUSES),
  attachedCoreIds: z.array(uuidSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  archivedAt: z.string().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const askMessageSchema = z.object({
  id: uuidSchema,
  ownerUid: z.string().min(1),
  threadId: uuidSchema,
  role: z.enum(ASK_MESSAGE_ROLES),
  content: z.string(),
  sequence: z.number().int().nonnegative(),
  routeAction: z.enum(ASK_ROUTE_ACTIONS).nullable().optional(),
  skillId: z.string().min(1).nullable().optional(),
  subagentId: z.string().min(1).nullable().optional(),
  tokenCount: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  createdAt: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const askMessageCitationSchema = z.object({
  id: uuidSchema,
  ownerUid: z.string().min(1),
  messageId: uuidSchema,
  citationIndex: z.number().int().positive(),
  sourceKind: z.enum(ASK_CITATION_SOURCE_KINDS),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().min(1),
});

export const askResolvedCoreSchema = z.object({
  id: uuidSchema,
  kind: z.string().min(1),
  name: z.string().min(1),
  status: z.string().min(1),
  ontology_id: z.string().min(1).nullable().optional(),
  ontology_version: z.string().min(1).nullable().optional(),
  tags: z.array(z.string()),
  summary: z.string(),
  metadata_keys: z.array(z.string()),
  implicit: z.boolean().default(false),
});

export const askCoreContextSnapshotSchema = z.object({
  attachedCoreIds: z.array(uuidSchema),
  implicitCoreIds: z.array(uuidSchema),
  resolvedCores: z.array(askResolvedCoreSchema),
  missingCoreIds: z.array(uuidSchema),
  ontologyBinding: z.object({
    coreId: uuidSchema,
    ontologyId: z.string().min(1),
    ontologyVersion: z.string().min(1).nullable().optional(),
  }).nullable(),
  contextHealth: z.number().int().min(0).max(100),
  advisories: z.array(z.string()),
});

export const askRunRequestSchema = z.object({
  query: z.string().min(1),
  mode: z.enum(ASK_MODES).default('quick'),
  situationId: z.string().min(1).optional(),
  attachedCoreIds: z.array(uuidSchema).default([]),
  threadId: uuidSchema.optional(),
  skillId: z.string().min(1).optional(),
});

export type AskThread = z.infer<typeof askThreadSchema>;
export type AskMessage = z.infer<typeof askMessageSchema>;
export type AskMessageCitation = z.infer<typeof askMessageCitationSchema>;
export type AskResolvedCore = z.infer<typeof askResolvedCoreSchema>;
export type AskCoreContextSnapshot = z.infer<typeof askCoreContextSnapshotSchema>;
export type AskRunRequest = z.infer<typeof askRunRequestSchema>;
