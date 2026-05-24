import { createHash } from 'crypto';
import { z } from 'zod';
import {
  AGENT_REGISTRY,
  type AgentPersona,
  type AgentPersonaId,
} from '@/lib/agents/registry';
import type { CreateAgentRunInput, SelectedCoreIds } from '@/lib/agent-runtime/types';

export const BOARDROOM_DEFAULT_PARTICIPANT_IDS = [
  'synthesis-chair',
  'mediator',
  'legal',
  'security',
  'humanitarian',
  'media',
  'red-team',
] as const;

export const BOARDROOM_PARTICIPANT_IDS = [
  'synthesis-chair',
  'mediator',
  'humanitarian',
  'legal',
  'media',
  'security',
  'red-team',
  'source-scout',
] as const;

export type BoardroomParticipantId = (typeof BOARDROOM_PARTICIPANT_IDS)[number];

export type BoardroomParticipant = {
  id: BoardroomParticipantId;
  label: string;
  lens: string;
  rolePrompt: string;
  critic: boolean;
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

export const BOARDROOM_PARTICIPANTS: Record<BoardroomParticipantId, BoardroomParticipant> =
  Object.fromEntries(BOARDROOM_PARTICIPANT_IDS.map((id) => {
    const persona = AGENT_REGISTRY[id as AgentPersonaId];
    return [id, personaToBoardroomParticipant(persona)];
  })) as Record<BoardroomParticipantId, BoardroomParticipant>;

export const BoardroomParticipantIdSchema = z.enum(BOARDROOM_PARTICIPANT_IDS);

export const BoardroomRunRequestSchema = z.object({
  question: z.string().trim().min(5).max(2000),
  capsuleId: z.string().trim().min(1).max(240).optional(),
  contextStackId: z.string().trim().min(1).max(240).nullable().optional(),
  directContext: z.string().trim().max(24000).optional(),
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
  'synthesized',
]);

export const BoardroomTurnSchema = z.object({
  turnId: z.string(),
  round: z.number().int().positive(),
  participantId: BoardroomParticipantIdSchema,
  state: BoardroomTurnStateSchema,
  claim: z.string().min(1),
  evidenceRefs: z.array(z.string()),
  critique: z.string().optional(),
  recommendation: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const BoardroomOutputSchema = z.object({
  meetingBrief: z.string().min(1),
  agenda: z.array(z.string()).min(1),
  roster: z.array(z.object({
    participantId: BoardroomParticipantIdSchema,
    label: z.string(),
    lens: z.string(),
  })).min(3),
  transcript: z.array(BoardroomTurnSchema).min(1),
  topicClusters: z.array(z.object({
    topic: z.string(),
    mentions: z.number().int().nonnegative(),
    participantIds: z.array(BoardroomParticipantIdSchema),
  })),
  consensus: z.array(z.string()),
  divergences: z.array(z.string()),
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

export function buildBoardroomOutput(input: {
  runId: string;
  capsuleId: string;
  objective: string;
  metadata: Record<string, unknown>;
  selectedCoreIds: Partial<SelectedCoreIds>;
  createdAt?: string;
}): BoardroomOutput {
  const spec = resolveBoardroomSpecFromMetadata(input.metadata, input.objective);
  const participants = spec.participantIds.map((id) => BOARDROOM_PARTICIPANTS[id]);
  const sourceReceiptIds = stringArray(input.metadata.sourceReceiptIds);
  const selectedSources = normalizeSelectedSources(input.metadata.selectedSources);
  const documentIds = uniqueStrings([
    ...(input.selectedCoreIds.documentCoreIds ?? []),
    ...spec.selectedDocumentIds,
    ...selectedSources.flatMap((source) => source.documentId ? [source.documentId] : []),
  ]);
  const evidenceRefs = uniqueStrings([
    ...sourceReceiptIds,
    ...selectedSources.flatMap((source) => source.sourceReceiptId ? [source.sourceReceiptId] : []),
    ...documentIds.map((id) => `document:${id}`),
    ...(input.selectedCoreIds.sourceCoreIds ?? []).map((id) => `source:${id}`),
  ]).slice(0, 8);
  const workingEvidenceRefs = evidenceRefs.length ? evidenceRefs : [`capsule:${input.capsuleId}`];
  const speakingParticipants = participants.filter((participant) => participant.id !== 'synthesis-chair');
  const transcript = speakingParticipants.flatMap((participant, index) => {
    const firstRound = buildTurn({
      runId: input.runId,
      round: 1,
      participant,
      index,
      evidenceRefs: workingEvidenceRefs,
      objective: spec.question,
      state: participant.critic ? 'challenged' : 'speaking',
    });
    const challengeRound = spec.maxRounds > 1 && (participant.critic || participant.id === 'legal' || participant.id === 'security')
      ? [buildTurn({
          runId: input.runId,
          round: 2,
          participant,
          index,
          evidenceRefs: workingEvidenceRefs,
          objective: spec.question,
          state: participant.critic ? 'challenged' : 'speaking',
          challenge: true,
        })]
      : [];
    return [firstRound, ...challengeRound];
  });
  const distribution = transcript.reduce((acc, turn) => {
    acc[turn.confidence] += 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
  const unsupportedClaimCount = workingEvidenceRefs.some((ref) => ref.startsWith('capsule:')) ? 1 : 0;
  return BoardroomOutputSchema.parse({
    meetingBrief: `Boardroom brief for ${input.capsuleId}: ${spec.question}`,
    agenda: [
      'Context brief from active ContextCapsule',
      'Sequential participant turns',
      spec.maxRounds > 1 ? 'Challenge and rebuttal pass' : 'Synthesis pass',
      'Chair synthesis and board-executive pack',
    ],
    roster: participants.map((participant) => ({
      participantId: participant.id,
      label: participant.label,
      lens: participant.lens,
    })),
    transcript,
    topicClusters: [
      { topic: 'Decision posture', mentions: transcript.length, participantIds: speakingParticipants.map((participant) => participant.id) },
      { topic: 'Evidence coverage', mentions: workingEvidenceRefs.length, participantIds: ['synthesis-chair', ...speakingParticipants.slice(0, 2).map((participant) => participant.id)] },
    ],
    consensus: [
      'Use the active ContextCapsule as the shared record for the decision.',
      'Keep source gaps visible before hardening the board-executive output.',
    ],
    divergences: speakingParticipants.some((participant) => participant.critic)
      ? ['Red Team keeps confidence conditional until stronger source coverage is attached.']
      : ['Participants differ on sequencing, but no formal dissent was generated in this pass.'],
    risks: [
      unsupportedClaimCount ? 'The run has limited attached source receipts.' : 'Evidence coverage is present but still requires human review before external use.',
      'Durable knowledge updates remain review-gated.',
    ],
    openQuestions: [
      'Which human owner approves the final board pack?',
      'What source receipts should be added before sharing externally?',
    ],
    evidenceStats: {
      sourceCount: sourceReceiptIds.length + (input.selectedCoreIds.sourceCoreIds?.length ?? 0),
      documentCount: documentIds.length,
      sourcedParagraphCount: nonnegativeInt(input.metadata.evidenceParagraphCount) ?? 0,
      unsupportedClaimCount,
    },
    confidenceDistribution: distribution,
    nextActions: [
      { action: 'Review unsupported claims and source gaps.', owner: 'analyst', urgency: 'short-term' },
      { action: 'Approve or revise the board-executive pack.', owner: 'chair', urgency: 'short-term' },
    ],
    finalSynthesis: `Chair synthesis: proceed with a reviewable board-executive pack for "${spec.question}" and keep the AgentRun transcript attached as proof.`,
  });
}

export function boardroomParticipantLabel(id: BoardroomParticipantId): string {
  return BOARDROOM_PARTICIPANTS[id].label;
}

function buildTurn(input: {
  runId: string;
  round: number;
  participant: BoardroomParticipant;
  index: number;
  evidenceRefs: string[];
  objective: string;
  state: 'speaking' | 'challenged';
  challenge?: boolean;
}): z.infer<typeof BoardroomTurnSchema> {
  const confidence = input.evidenceRefs.some((ref) => ref.startsWith('capsule:'))
    ? 'low'
    : input.participant.critic || input.challenge
      ? 'medium'
      : 'medium';
  return {
    turnId: `${input.runId}:r${input.round}:${input.participant.id}`,
    round: input.round,
    participantId: input.participant.id,
    state: input.state,
    claim: input.challenge
      ? `${input.participant.label} revisits the evidence posture for: ${input.objective}`
      : `${input.participant.label} evaluates the decision through the ${input.participant.lens.toLowerCase()} lens.`,
    evidenceRefs: input.evidenceRefs.slice(input.index % input.evidenceRefs.length, input.index % input.evidenceRefs.length + 2),
    critique: input.participant.critic || input.challenge
      ? 'Confidence should stay conditional until source diversity and approval posture are reviewed.'
      : undefined,
    recommendation: input.participant.critic
      ? 'Keep dissent and missing evidence visible in the final pack.'
      : 'Carry this lens into the chair synthesis and final board pack.',
    confidence,
  };
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

function personaToBoardroomParticipant(persona: AgentPersona): BoardroomParticipant {
  return {
    id: persona.id as BoardroomParticipantId,
    label: persona.label,
    lens: lensForPersona(persona),
    rolePrompt: persona.rolePrompt,
    critic: Boolean(persona.critic),
  };
}

function lensForPersona(persona: AgentPersona): string {
  switch (persona.id) {
    case 'synthesis-chair':
      return 'Chair';
    case 'red-team':
      return 'Adversarial review';
    case 'source-scout':
      return 'Evidence discovery';
    default:
      return persona.label.replace(/\s+Analyst$/, '').replace(/\s+Lead$/, '');
  }
}

function isBoardroomParticipantId(value: string): value is BoardroomParticipantId {
  return (BOARDROOM_PARTICIPANT_IDS as readonly string[]).includes(value);
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeSelectedSources(value: unknown): BoardroomSourceRef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = BoardroomSourceRefSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 100);
}

function nonnegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}
