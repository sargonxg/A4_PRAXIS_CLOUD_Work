import { describe, expect, it } from 'vitest';
import {
  CapsuleQualityReviewProposalListSchema,
  CapsuleQualityReviewProposalSchema,
  capsuleQualityReviewCardInput,
} from '@/lib/agent-runtime/capsule-quality-review';
import { getModelIdForTask } from '@/lib/ai/model-matrix';

describe('capsule quality review proposal schema', () => {
  it('accepts bounded review-card proposals', () => {
    const proposal = CapsuleQualityReviewProposalSchema.parse({
      kind: 'sourcing',
      title: 'Attach official source receipts',
      rationale: 'The capsule has unsupported claims and no official source spine.',
      suggestedChange: 'Add current official receipts for each unsupported claim before drafting.',
      confidence: 'high',
    });

    expect(proposal).toMatchObject({
      kind: 'sourcing',
      confidence: 'high',
    });
  });

  it('rejects unknown kinds and arrays over eight proposals', () => {
    expect(() => CapsuleQualityReviewProposalSchema.parse({
      kind: 'publishing',
      title: 'Publish now',
      rationale: 'Invalid kind.',
      suggestedChange: 'Invalid change.',
      confidence: 'medium',
    })).toThrow();

    const nine = Array.from({ length: 9 }, (_, index) => ({
      kind: 'output',
      title: `Output proposal ${index + 1}`,
      rationale: 'Keep the output reviewable.',
      suggestedChange: 'Add a review-gated output contract.',
      confidence: 'medium',
    }));

    expect(() => CapsuleQualityReviewProposalListSchema.parse(nine)).toThrow();
  });

  it('stamps quality-review proposals with model generatedBy metadata', () => {
    const input = capsuleQualityReviewCardInput({
      id: 'run-quality-1',
      createdAt: '2026-06-12T12:00:00.000Z',
      metadata: {},
    }, {
      kind: 'sourcing',
      title: 'Attach official source receipts',
      rationale: 'The capsule has unsupported claims and no official source spine.',
      suggestedChange: 'Add current official receipts for each unsupported claim before drafting.',
      confidence: 'high',
    }, 0);

    const qualityReview = (input.proposedEnvelopePatch?.sourcePosture as Record<string, unknown>).qualityReview as Record<string, unknown>;

    expect(qualityReview.generatedBy).toEqual({
      actorType: 'model',
      actorId: getModelIdForTask('complex_reasoning'),
      at: '2026-06-12T12:00:00.000Z',
      activity: 'quality_review',
    });
  });
});
