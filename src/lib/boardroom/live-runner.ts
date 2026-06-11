import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import { formatEvidencePackPromptBlock, type CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { getProModel, hasServerAiProvider } from '@/lib/ai/providers';
import {
  BOARDROOM_PARTICIPANTS,
  BoardroomOutputSchema,
  BoardroomParticipantIdSchema,
  resolveBoardroomSpecFromMetadata,
  type BoardroomOutput,
  type BoardroomParticipant,
  type BoardroomParticipantId,
} from '@/lib/boardroom/schema';

export const BOARDROOM_MODEL_POLICY_ID = 'praxis_frontier_deep_model_policy';

export type LiveBoardroomTurnEvent = {
  turn: BoardroomOutput['transcript'][number];
  participantId: BoardroomParticipantId;
  participant: BoardroomParticipant;
  round: number;
  rejectedEvidenceRefs: string[];
};

export type LiveBoardroomSynthesisEvent = {
  output: BoardroomOutput;
};

export type LiveBoardroomRunnerInput = {
  run: AgentRun;
  payload: ExecuteAgentRunPayload;
  evidencePack: CapsuleEvidencePack;
  onTurn?: (event: LiveBoardroomTurnEvent) => Promise<void> | void;
  onSynthesis?: (event: LiveBoardroomSynthesisEvent) => Promise<void> | void;
};

const BoardroomTurnModelSchema = z.object({
  claim: z.string().trim().min(1).max(1400),
  evidenceRefs: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
  critique: z.string().trim().min(1).max(1000).optional(),
  recommendation: z.string().trim().min(1).max(1000).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const BoardroomSynthesisModelSchema = z.object({
  consensus: z.array(z.string().trim().min(1).max(500)).max(8),
  divergences: z.array(z.string().trim().min(1).max(500)).max(8),
  decisionOptions: z.array(z.object({
    label: z.string().trim().min(1).max(240),
    tradeoffs: z.string().trim().min(1).max(1000),
    preferredBy: z.array(BoardroomParticipantIdSchema).max(8).default([]),
  })).max(6).default([]),
  risks: z.array(z.string().trim().min(1).max(500)).max(8),
  openQuestions: z.array(z.string().trim().min(1).max(500)).max(8),
  nextActions: z.array(z.object({
    action: z.string().trim().min(1).max(500),
    owner: z.enum(['analyst', 'chair', 'researcher', 'legal', 'security', 'communications']),
    urgency: z.enum(['immediate', 'short-term', 'medium-term']),
  })).max(8),
  finalSynthesis: z.string().trim().min(1).max(1800),
  topicClusters: z.array(z.object({
    topic: z.string().trim().min(1).max(160),
    mentions: z.number().int().nonnegative(),
    participantIds: z.array(BoardroomParticipantIdSchema).max(8),
  })).max(8),
});

type EvidenceRef = {
  id: string;
  label: string;
  excerpt?: string;
};

export async function runLiveBoardroomDiscussion(input: LiveBoardroomRunnerInput): Promise<BoardroomOutput> {
  if (!hasServerAiProvider()) {
    throw new Error('Boardroom live model provider is not configured. Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT.');
  }

  const spec = resolveBoardroomSpecFromMetadata(input.run.metadata, input.run.objective);
  const participants = spec.participantIds.map((id) => BOARDROOM_PARTICIPANTS[id]);
  const speakingParticipants = participants.filter((participant) => participant.id !== 'synthesis-chair');
  const evidenceRefs = buildEvidenceRefs(input);
  const contextInjectionPromptBlock = typeof input.run.metadata.contextInjectionPromptBlock === 'string'
    ? input.run.metadata.contextInjectionPromptBlock
    : null;
  const evidenceBlock = buildBoardroomEvidenceBlock(input.evidencePack, evidenceRefs, contextInjectionPromptBlock);
  const transcript: BoardroomOutput['transcript'] = [];

  for (let round = 1; round <= spec.maxRounds; round += 1) {
    for (const participant of speakingParticipants) {
      const { output } = await generateText({
        model: getProModel(),
        output: Output.object({ schema: BoardroomTurnModelSchema }),
        prompt: buildTurnPrompt({
          run: input.run,
          participantId: participant.id,
          participantLabel: participant.label,
          participantLens: participant.lens,
          rolePrompt: participant.rolePrompt,
          round,
          maxRounds: spec.maxRounds,
          question: spec.question,
          directContext: spec.directContext ?? '',
          evidenceBlock,
          priorTranscript: transcript,
        }),
      });
      const parsed = BoardroomTurnModelSchema.parse(output);
      const evidenceCheck = normalizeTurnEvidenceRefs(parsed.evidenceRefs, evidenceRefs);
      const state = evidenceCheck.evidenceRefs.length
        ? participant.critic ? 'challenged' : 'speaking'
        : 'unsupported';
      const turn: BoardroomOutput['transcript'][number] = {
        turnId: `${input.run.id}:r${round}:${participant.id}`,
        round,
        participantId: participant.id,
        state,
        claim: parsed.claim,
        evidenceRefs: evidenceCheck.evidenceRefs,
        ...(evidenceCheck.rejectedEvidenceRefs.length ? { unsupportedEvidenceRefs: evidenceCheck.rejectedEvidenceRefs } : {}),
        critique: parsed.critique,
        recommendation: parsed.recommendation,
        confidence: evidenceCheck.evidenceRefs.length ? parsed.confidence : 'low',
      };
      transcript.push(turn);
      await input.onTurn?.({
        turn,
        participantId: participant.id,
        participant,
        round,
        rejectedEvidenceRefs: evidenceCheck.rejectedEvidenceRefs,
      });
    }
  }

  const { output: synthesisOutput } = await generateText({
    model: getProModel(),
    output: Output.object({ schema: BoardroomSynthesisModelSchema }),
    prompt: buildSynthesisPrompt({
      run: input.run,
      question: spec.question,
      evidenceBlock,
      transcript,
    }),
  });
  const synthesis = BoardroomSynthesisModelSchema.parse(synthesisOutput);
  const confidenceDistribution = transcript.reduce((acc, turn) => {
    acc[turn.confidence] += 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
  const selectedDocumentIds = new Set([
    ...input.run.selectedCoreIds.documentCoreIds,
    ...spec.selectedDocumentIds,
    ...spec.selectedSources.flatMap((source) => source.documentId ? [source.documentId] : []),
  ]);
  const selectedSourceIds = new Set([
    ...input.evidencePack.sourceReceiptIds,
    ...spec.selectedSources.flatMap((source) => {
      const id = source.sourceReceiptId ?? source.receiptId;
      return id ? [id] : [];
    }),
  ]);
  const unsupportedClaimCount = transcript.filter((turn) => turn.evidenceRefs.length === 0).length
    + (input.evidencePack.openGaps.length ? 1 : 0);

  const boardroomOutput = BoardroomOutputSchema.parse({
    meetingBrief: `Boardroom brief for ${input.evidencePack.activeCapsule.label}: ${spec.question}`,
    agenda: [
      'Resolve active ContextCapsule and evidence pack',
      'Run live participant turns against shared evidence',
      spec.maxRounds > 1 ? 'Challenge and second-round refinement' : 'Single-round deliberation',
      'Synthesis Chair creates a board-executive pack',
    ],
    roster: participants.map((participant) => ({
      participantId: participant.id,
      label: participant.label,
      lens: participant.lens,
      role: participant.role,
    })),
    transcript,
    topicClusters: synthesis.topicClusters.length
      ? synthesis.topicClusters
      : [{ topic: 'Decision posture', mentions: transcript.length, participantIds: speakingParticipants.map((participant) => participant.id) }],
    consensus: synthesis.consensus,
    divergences: synthesis.divergences,
    decisionOptions: synthesis.decisionOptions.length ? synthesis.decisionOptions : fallbackDecisionOptions(transcript),
    risks: synthesis.risks,
    openQuestions: synthesis.openQuestions,
    evidenceStats: {
      sourceCount: selectedSourceIds.size,
      documentCount: selectedDocumentIds.size,
      sourcedParagraphCount: input.evidencePack.sourcedParagraphs.length,
      unsupportedClaimCount,
    },
    confidenceDistribution,
    nextActions: synthesis.nextActions,
    finalSynthesis: synthesis.finalSynthesis,
  });
  await input.onSynthesis?.({ output: boardroomOutput });
  return boardroomOutput;
}

function buildTurnPrompt(input: {
  run: AgentRun;
  participantId: BoardroomParticipantId;
  participantLabel: string;
  participantLens: string;
  rolePrompt: string;
  round: number;
  maxRounds: number;
  question: string;
  directContext: string;
  evidenceBlock: string;
  priorTranscript: BoardroomOutput['transcript'];
}): string {
  return `You are ${input.participantLabel} in a PRAXIS live Boardroom discussion.

Role prompt:
${input.rolePrompt}

Lens: ${input.participantLens}
Boardroom role: ${BOARDROOM_PARTICIPANTS[input.participantId].role}
Round: ${input.round} of ${input.maxRounds}
Model policy: ${BOARDROOM_MODEL_POLICY_ID}
Decision question: ${input.question}
Direct chair context: ${input.directContext || 'none'}

Use only the active ContextCapsule, uploaded/pasted document excerpts, source receipts, and prior transcript below.
Every evidenceRefs entry must be chosen from the available evidence ids. If a source id is unavailable, leave evidenceRefs empty and explain the gap instead of inventing a ref.
If evidence is thin, say so and use low confidence.
Do not invent sources, receipts, people, dates, or model/provider internals.

${input.evidenceBlock}

Prior transcript:
${input.priorTranscript.length ? input.priorTranscript.map((turn) => `- R${turn.round} ${turn.participantId}: ${turn.claim}`).join('\n') : '- none'}

Return the structured turn for ${input.participantId}.`;
}

function buildSynthesisPrompt(input: {
  run: AgentRun;
  question: string;
  evidenceBlock: string;
  transcript: BoardroomOutput['transcript'];
}): string {
  return `You are the Synthesis Chair for a PRAXIS Boardroom run.

Model policy: ${BOARDROOM_MODEL_POLICY_ID}
Run id: ${input.run.id}
Decision question: ${input.question}

Create the final board synthesis from the live participant transcript. Preserve dissent, source gaps, risks, open questions, concrete next actions, and 2-4 decision options. Do not hide weak evidence.

${input.evidenceBlock}

Transcript:
${input.transcript.map((turn) => `- R${turn.round} ${turn.participantId} (${turn.confidence}): ${turn.claim}${turn.critique ? ` Critique: ${turn.critique}` : ''}${turn.recommendation ? ` Recommendation: ${turn.recommendation}` : ''}`).join('\n')}`;
}

function buildBoardroomEvidenceBlock(
  pack: CapsuleEvidencePack,
  refs: EvidenceRef[],
  contextInjectionPromptBlock?: string | null,
): string {
  const refLines = refs.length
    ? refs.map((ref) => `- ${ref.id}: ${ref.label}${ref.excerpt ? ` - ${ref.excerpt}` : ''}`).join('\n')
    : '- none';
  return [
    formatEvidencePackPromptBlock(pack),
    // The compiled capsule-dock layer (same contract Ask PRAXIS injects) so
    // every board voice deliberates inside the governed docked context.
    ...(contextInjectionPromptBlock ? ['', contextInjectionPromptBlock] : []),
    '',
    '## Available evidence ids for boardroom turns',
    refLines,
  ].join('\n');
}

function buildEvidenceRefs(input: LiveBoardroomRunnerInput): EvidenceRef[] {
  const metadataSources = Array.isArray(input.run.metadata.selectedSources) ? input.run.metadata.selectedSources : [];
  const selectedSources = metadataSources.flatMap((source) => {
    if (!isRecord(source)) return [];
    const label = typeof source.label === 'string' ? source.label : null;
    const sourceReceiptId = typeof source.sourceReceiptId === 'string' ? source.sourceReceiptId : null;
    const receiptId = typeof source.receiptId === 'string' ? source.receiptId : null;
    const documentId = typeof source.documentId === 'string' ? source.documentId : null;
    const id = sourceReceiptId ?? receiptId ?? (documentId ? `document:${documentId}` : null);
    return id && label ? [{ id, label }] : [];
  });
  return uniqueRefs([
    ...selectedSources,
    ...input.evidencePack.sourceReceiptIds.map((id) => ({ id, label: `Source receipt ${id}` })),
    ...input.evidencePack.sourcedParagraphs.map((paragraph) => ({
      id: paragraph.sourceReceiptId ?? `${paragraph.documentId}:${paragraph.chunkId}`,
      label: paragraph.citationLabel,
      excerpt: paragraph.excerpt,
    })),
    ...input.evidencePack.knowledgeDocuments.map((document) => ({
      id: `document:${document.documentId}`,
      label: document.title,
      excerpt: document.digest?.shortSummary ?? document.sourceNote ?? undefined,
    })),
    ...input.run.selectedCoreIds.documentCoreIds.map((id) => ({ id: `document:${id}`, label: `Document ${id}` })),
  ]).slice(0, 30);
}

function normalizeTurnEvidenceRefs(refs: string[], available: EvidenceRef[]): {
  evidenceRefs: string[];
  rejectedEvidenceRefs: string[];
} {
  const availableIds = new Set(available.map((ref) => ref.id));
  const uniqueRefs = Array.from(new Set(refs.map((ref) => ref.trim()).filter(Boolean))).slice(0, 6);
  const evidenceRefs = uniqueRefs.filter((ref) => availableIds.has(ref));
  const rejectedEvidenceRefs = uniqueRefs.filter((ref) => !availableIds.has(ref));
  return {
    evidenceRefs,
    rejectedEvidenceRefs,
  };
}

function fallbackDecisionOptions(transcript: BoardroomOutput['transcript']): BoardroomOutput['decisionOptions'] {
  const supportedParticipantIds = Array.from(new Set(transcript
    .filter((turn) => turn.evidenceRefs.length > 0)
    .map((turn) => turn.participantId)));
  const challengedParticipantIds = Array.from(new Set(transcript
    .filter((turn) => turn.state === 'unsupported' || turn.confidence === 'low')
    .map((turn) => turn.participantId)));
  return [
    {
      label: 'Proceed with review gates',
      tradeoffs: 'Keeps the decision moving while preserving explicit caveats, evidence refs, and human review before external use.',
      preferredBy: supportedParticipantIds.slice(0, 4),
    },
    {
      label: 'Pause for source reinforcement',
      tradeoffs: 'Reduces unsupported-claim risk, but delays the decision until the weakest evidence refs are replaced or corroborated.',
      preferredBy: challengedParticipantIds.slice(0, 4),
    },
  ];
}

function uniqueRefs(refs: EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>();
  const out: EvidenceRef[] = [];
  for (const ref of refs) {
    if (!ref.id || seen.has(ref.id)) continue;
    seen.add(ref.id);
    out.push(ref);
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
