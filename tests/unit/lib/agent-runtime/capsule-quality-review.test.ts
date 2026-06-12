import { describe, expect, it } from 'vitest';
import {
  CapsuleQualityReviewProposalListSchema,
  CapsuleQualityReviewProposalSchema,
} from '@/lib/agent-runtime/capsule-quality-review';

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
});
