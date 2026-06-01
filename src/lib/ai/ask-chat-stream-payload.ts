import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';

export interface AskGenerationStatusStreamPayload {
  type: 'generationStatus';
  phase: 'final';
  modelPolicyLabel: string;
  finishReason: string | null;
  usage: unknown;
  sourceCount: number;
  capsuleCount: number;
  warningCount: number;
}

export interface AskSourceabilityVerdictsStreamPayload {
  type: 'sourceabilityVerdicts';
  sourceabilityVerdicts: AskAnswerEnvelope['sourceabilityVerdicts'];
}

export interface AskAnswerEnvelopeStreamPayload {
  type: 'answerEnvelope';
  answerEnvelope: AskAnswerEnvelope;
}

export type AskChatFinishStreamPayload =
  | AskGenerationStatusStreamPayload
  | AskSourceabilityVerdictsStreamPayload
  | AskAnswerEnvelopeStreamPayload;

export function buildAskChatFinishPayloads(input: {
  answerEnvelope: AskAnswerEnvelope;
  capsuleCount: number;
  finishReason: string | null;
  modelPolicyLabel: string;
  sourceCount: number;
  usage: unknown;
  warningCount: number;
}): AskChatFinishStreamPayload[] {
  return [
    {
      type: 'generationStatus',
      phase: 'final',
      modelPolicyLabel: input.modelPolicyLabel,
      finishReason: input.finishReason,
      usage: input.usage,
      sourceCount: input.sourceCount,
      capsuleCount: input.capsuleCount,
      warningCount: input.warningCount,
    },
    {
      type: 'sourceabilityVerdicts',
      sourceabilityVerdicts: input.answerEnvelope.sourceabilityVerdicts,
    },
    {
      type: 'answerEnvelope',
      answerEnvelope: input.answerEnvelope,
    },
  ];
}
