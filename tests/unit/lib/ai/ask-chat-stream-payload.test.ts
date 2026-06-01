import { describe, expect, it } from 'vitest';
import { buildAskChatFinishPayloads } from '@/lib/ai/ask-chat-stream-payload';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';
import type { SourceabilityClaimVerdict } from '@/lib/agent-runtime/sourceability-ledger';

describe('Ask chat stream payloads', () => {
  it('emits per-claim sourceability verdicts before the final answer envelope', () => {
    const verdicts: SourceabilityClaimVerdict[] = [
      {
        claimId: 'claim-1',
        claim: 'Crossing access is unrestricted.',
        verdict: 'contradicted',
        supportLabel: 'contradicted',
        sourceIds: ['receipt-1'],
        confidence: 0.15,
        reviewNote: 'Attached receipt says access was restricted.',
      },
    ];
    const envelope = {
      sourceabilityVerdicts: verdicts,
    } as AskAnswerEnvelope;

    const payloads = buildAskChatFinishPayloads({
      answerEnvelope: envelope,
      capsuleCount: 1,
      finishReason: 'stop',
      modelPolicyLabel: 'Vertex stable',
      sourceCount: 2,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      warningCount: 0,
    });

    expect(payloads.map((payload) => payload.type)).toEqual([
      'generationStatus',
      'sourceabilityVerdicts',
      'answerEnvelope',
    ]);
    expect(payloads[1]).toEqual({
      type: 'sourceabilityVerdicts',
      sourceabilityVerdicts: verdicts,
    });
    expect(payloads[2]).toEqual({
      type: 'answerEnvelope',
      answerEnvelope: envelope,
    });
  });
});
