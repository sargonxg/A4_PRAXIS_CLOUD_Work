import { createHash } from 'crypto';
import { z } from 'zod';
import {
  BOARDROOM_DEFAULT_PARTICIPANT_IDS,
  BOARDROOM_PARTICIPANT_IDS,
  BOARDROOM_PARTICIPANTS,
  boardroomParticipantLabel,
  isBoardroomParticipantId,
  type BoardroomParticipant,
  type BoardroomParticipantId,
  type BoardroomParticipantRole,
} from '@/lib/boardroom/participants';
import type { CreateAgentRunInput, SelectedCoreIds } from '@/lib/agent-runtime/types';
import {
  BoardroomCapsuleDockPayloadSchema,
  normalizeBoardroomCapsuleDockPayload,
  type BoardroomCapsuleDockPayload,
} from '@/lib/boardroom/capsule-dock';

export {
  BOARDROOM_DEFAULT_PARTICIPANT_IDS,
  BOARDROOM_PARTICIPANT_IDS,
  BOARDROOM_PARTICIPANTS,
  boardroomParticipantLabel,
  type BoardroomParticipant,
  type BoardroomParticipantId,
  type BoardroomParticipantRole,
};

export const BoardroomSourceRefSchema = z.object({
  documentId: z.string().trim().min(1).max(240).optional(),
  sourceCoreId: z.string().trim().min(1).max(240).optional(),
  sourceReceiptId: z.string().trim().min(1).max(240).optional(),
  receiptId: z.string().trim().min(1).max(240).optional(),
  label: z.string().trim().min(1).max(240),
  kind: z.enum(['uploaded-document', 'pasted-text', 'capsule-source']).default('uploaded-document'),
  fileType: z.string().trim().min(1).max(32).optional(),
  size: z.number().int().nonnegative().optional(),
});

export type BoardroomSourceRef = z.infer<typeof BoardroomSourceRefSchema>;

export const BoardroomParticipantIdSchema = z.enum(BOARDROOM_PARTICIPANT_IDS);
export const BoardroomParticipantRoleSchema = z.enum(['chair', 'analyst', 'reviewer', 'red-teamer', 'stakeholder']);

export const BoardroomRunRequestSchema = z.object({
  question: z.string().trim().min(5).max(2000),
  capsuleId: z.string().trim().min(1).max(240).optional(),
  contextStackId: z.string().trim().min(1).max(240).nullable().optional(),
  directContext: z.string().trim().max(24000).optional(),
  capsuleDockPayload: BoardroomCapsuleDockPayloadSchema.optional(),
  selectedDocumentIds: z.array(z.string().trim().min(1).max(240)).max(12).default([]),
  selectedSources: z.array(BoardroomSourceRefSchema).max(24).default([]),
  participantIds: z.array(z.string().trim().min(1).max(80)).optional()
    .transform((value, ctx) => {
      try {
        return normalizeBoardroomParticipants(value as BoardroomParticipantId[] | undefined);
      } catch (err) {
        ctx.addIssue({
          code: 'custom',
          message: err instanceof Error ? err.message : 'Invalid boardroom participant selection.',
        });
        return z.NEVER;
      }
    }),
  maxRounds: z.number().int().min(1).max(4).default(2),
  outputTarget: z.enum(['board_executive_pack']).default('board_executive_pack'),
});

export type BoardroomRunRequest = z.infer<typeof BoardroomRunRequestSchema>;

export const BoardroomTurnStateSchema = z.enum([
  'waiting',
  'thinking',
  'speaking',
  'challenged',
  'unsupported',
  'synthesized',
]);

export const BoardroomTurnSchema = z.object({
  turnId: z.string(),
  round: z.number().int().positive(),
  participantId: BoardroomParticipantIdSchema,
  state: BoardroomTurnStateSchema,
  claim: z.string().min(1),
  evidenceRefs: z.array(z.string()),
  unsupportedEvidenceRefs: z.array(z.string()).optional(),
  critique: z.string().optional(),
  recommendation: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const BoardroomDecisionOptionSchema = z.object({
  label: z.string().trim().min(1).max(240),
  tradeoffs: z.string().trim().min(1).max(1000),
  preferredBy: z.array(BoardroomParticipantIdSchema).default([]),
});

export const BoardroomOutputSchema = z.object({
  meetingBrief: z.string().min(1),
  agenda: z.array(z.string()).min(1),
  roster: z.array(z.object({
    participantId: BoardroomParticipantIdSchema,
    label: z.string(),
    lens: z.string(),
    role: BoardroomParticipantRoleSchema.optional(),
  })).min(3),
  transcript: z.array(BoardroomTurnSchema).min(1),
  topicClusters: z.array(z.object({
    topic: z.string(),
    mentions: z.number().int().nonnegative(),
    participantIds: z.array(BoardroomParticipantIdSchema),
  })),
  consensus: z.array(z.string()),
  divergences: z.array(z.string()),
  decisionOptions: z.array(BoardroomDecisionOptionSchema).default([]),
  risks: z.array(z.string()),
  openQuestions: z.array(z.string()),
  evidenceStats: z.object({
    sourceCount: z.number().int().nonnegative(),
    documentCount: z.number().int().nonnegative(),
    sourcedParagraphCount: z.number().int().nonnegative(),
    unsupportedClaimCount: z.number().int().nonnegative(),
  }),
  confidenceDistribution: z.object({
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
  }),
  nextActions: z.array(z.object({
    action: z.string(),
    owner: z.enum(['analyst', 'chair', 'researcher', 'legal', 'security', 'communications']),
    urgency: z.enum(['immediate', 'short-term', 'medium-term']),
  })),
  finalSynthesis: z.string().min(1),
});

export type BoardroomOutput = z.infer<typeof BoardroomOutputSchema>;

export function normalizeBoardroomParticipants(value?: BoardroomParticipantId[]): BoardroomParticipantId[] {
  const requested = value?.length ? value : [...BOARDROOM_DEFAULT_PARTICIPANT_IDS];
  const normalized: BoardroomParticipantId[] = ['synthesis-chair'];
  for (const raw of requested) {
    if (!isBoardroomParticipantId(raw)) {
      throw new Error(`Unknown boardroom participant: ${String(raw)}`);
    }
    if (!normalized.includes(raw)) normalized.push(raw);
  }
  if (normalized.length < 3) {
    throw new Error('Boardroom requires at least 3 active participants including the Synthesis Chair.');
  }
  if (normalized.length > 8) {
    throw new Error('Boardroom supports at most 8 active participants.');
  }
  return normalized;
}

export function buildBoardroomAgentRunInput(input: {
  ownerUid: string;
  capsuleId: string;
  contextStackId?: string | null;
  contextPackageId?: string | null;
  selectedCoreIds?: Partial<SelectedCoreIds>;
  request: BoardroomRunRequest;
  traceId?: string;
  idempotencyKey?: string;
  /** Compiled capsule-dock prompt layer (same contract as Ask PRAXIS injection). */
  contextInjectionPromptBlock?: string | null;
  capsuleDockPayload?: BoardroomCapsuleDockPayload | null;
}): CreateAgentRunInput {
  const documentCoreIds = uniqueStrings([
    ...(input.selectedCoreIds?.documentCoreIds ?? []),
    ...input.request.selectedDocumentIds,
    ...input.request.selectedSources.flatMap((source) => source.documentId ? [source.documentId] : []),
  ]);
  const sourceCoreIds = uniqueStrings([
    ...(input.selectedCoreIds?.sourceCoreIds ?? []),
    ...input.request.selectedSources.flatMap((source) => source.sourceCoreId ? [source.sourceCoreId] : []),
  ]);
  const selectedSources = sanitizeSelectedSources(input.request.selectedSources);
  const capsuleDockPayload = input.capsuleDockPayload
    ? normalizeBoardroomCapsuleDockPayload(input.capsuleDockPayload)
    : input.request.capsuleDockPayload
      ? normalizeBoardroomCapsuleDockPayload(input.request.capsuleDockPayload)
      : null;
  const sourceReceiptIds = uniqueStrings(selectedSources.flatMap((source) => [
    source.sourceReceiptId,
    source.receiptId,
  ].filter((value): value is string => Boolean(value))));
  const selectedToolIds = selectedToolsForBoardroom(input.request);
  const maxStep = Math.min(40, input.request.participantIds.length * input.request.maxRounds + 9);
  return {
    ownerUid: input.ownerUid,
    capsuleId: input.capsuleId,
    contextStackId: input.contextStackId ?? input.request.contextStackId ?? input.capsuleId,
    contextPackageId: input.contextPackageId ?? null,
    selectedCoreIds: {
      ...(input.selectedCoreIds ?? {}),
      documentCoreIds,
      sourceCoreIds,
    },
    triggerType: 'manual',
    objective: input.request.question,
    traceId: input.traceId,
    idempotencyKey: input.idempotencyKey ?? stableBoardroomIdempotencyKey(input.ownerUid, input.capsuleId, input.request),
    maxStep,
    maxSessionMinutes: 45,
    metadata: {
      policyAgentId: 'boardroom-discussion',
      policyAgentLabel: 'Boardroom Discussion',
      outputDestination: 'library',
      selectedToolIds,
      selectedTools: selectedToolIds,
      source: 'boardroom-workspace',
      modelPolicy: 'praxis_frontier_deep_model_policy',
      boardroomSpec: sanitizeBoardroomSpec(input.request),
      selectedSources,
      sourceReceiptIds,
      contextInjectionPromptBlock: input.contextInjectionPromptBlock ?? null,
      capsuleDockPayload,
      dockCapsuleIds: uniqueStrings(capsuleDockPayload?.slots.flatMap((slot) => slot.capsuleId ? [slot.capsuleId] : []) ?? []),
      sourcePosture: sourceReceiptIds.length
        ? `${sourceReceiptIds.length} source receipt(s) attached`
        : documentCoreIds.length
          ? 'Attached documents requested'
          : 'Capsule sources requested',
    },
  };
}

export function resolveBoardroomSpecFromMetadata(metadata: Record<string, unknown>, objective: string): BoardroomRunRequest {
  const parsed = BoardroomRunRequestSchema.safeParse(
    typeof metadata.boardroomSpec === 'object' && metadata.boardroomSpec !== null
      ? metadata.boardroomSpec
      : { question: objective },
  );
  if (parsed.success) return parsed.data;
  return BoardroomRunRequestSchema.parse({ question: objective });
}

function selectedToolsForBoardroom(request: BoardroomRunRequest): string[] {
  const hasDocuments = request.selectedDocumentIds.length || request.selectedSources.some((source) => source.documentId);
  return uniqueStrings([
    'context-resolve',
    'capsule-evidence-pack',
    ...(hasDocuments ? ['document-retrieve'] : []),
    'boardroom-deliberation',
    ...(request.participantIds.includes('red-team') ? ['red-team-review'] : []),
    'sourceability-reviewer',
    'board-executive-pack',
    'output-capsule-save',
  ]);
}

function sanitizeBoardroomSpec(request: BoardroomRunRequest) {
  return {
    question: request.question,
    capsuleId: request.capsuleId ?? null,
    contextStackId: request.contextStackId ?? null,
    directContext: request.directContext ?? null,
    capsuleDockPayload: request.capsuleDockPayload ? normalizeBoardroomCapsuleDockPayload(request.capsuleDockPayload) : null,
    selectedDocumentIds: request.selectedDocumentIds,
    selectedSources: sanitizeSelectedSources(request.selectedSources),
    participantIds: request.participantIds,
    maxRounds: request.maxRounds,
    outputTarget: request.outputTarget,
  };
}

function sanitizeSelectedSources(value: BoardroomSourceRef[]): BoardroomSourceRef[] {
  return value.map((source) => ({
    ...(source.documentId ? { documentId: source.documentId } : {}),
    ...(source.sourceCoreId ? { sourceCoreId: source.sourceCoreId } : {}),
    ...(source.sourceReceiptId ? { sourceReceiptId: source.sourceReceiptId } : {}),
    ...(source.receiptId ? { receiptId: source.receiptId } : {}),
    label: source.label,
    kind: source.kind,
    ...(source.fileType ? { fileType: source.fileType } : {}),
    ...(typeof source.size === 'number' ? { size: source.size } : {}),
  }));
}

function stableBoardroomIdempotencyKey(ownerUid: string, capsuleId: string, request: BoardroomRunRequest): string {
  const hash = createHash('sha256')
    .update(JSON.stringify({
      ownerUid,
      capsuleId,
      question: request.question,
      participantIds: request.participantIds,
      selectedDocumentIds: request.selectedDocumentIds,
      selectedSources: request.selectedSources.map((source) => ({
        documentId: source.documentId ?? null,
        sourceReceiptId: source.sourceReceiptId ?? source.receiptId ?? null,
        label: source.label,
      })),
      maxRounds: request.maxRounds,
      nowBucket: Math.floor(Date.now() / 60_000),
    }))
    .digest('hex')
    .slice(0, 32);
  return `boardroom:${hash}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 100);
}
