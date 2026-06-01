import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getToolFeedback: vi.fn(),
  saveToolFeedback: vi.fn(),
  saveToolFeedbackAndProposeCapsuleReviewCard: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: false }),
}));

vi.mock('@/lib/services/feedback-service', () => ({
  getToolFeedback: mocks.getToolFeedback,
  saveToolFeedback: mocks.saveToolFeedback,
  saveToolFeedbackAndProposeCapsuleReviewCard: mocks.saveToolFeedbackAndProposeCapsuleReviewCard,
}));

describe('/api/tool-feedback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.saveToolFeedbackAndProposeCapsuleReviewCard.mockResolvedValue({
      feedbackSaved: true,
      reviewCard: { reviewCardId: 'review-card-1' },
    });
    mocks.saveToolFeedback.mockResolvedValue(undefined);
  });

  it('routes low-confidence capsule feedback into a review-card proposal', async () => {
    const { POST } = await import('@/app/api/tool-feedback/route');

    const response = await POST(new Request('https://praxis.tacitus.me/api/tool-feedback', {
      method: 'POST',
      body: JSON.stringify({
        toolId: 'ask-praxis',
        situationId: 'sit-1',
        confidence: 1,
        issues: ['inaccurate'],
        suggestion: 'The corridor claim is wrong; mark it disputed.',
        approved: false,
        capsuleId: 'cap-1',
        answerId: 'answer-1',
        sourceabilityVerdicts: [{
          claimId: 'claim-1',
          claim: 'The corridor is open.',
          verdict: 'contradicted',
          supportLabel: 'contradicted',
          sourceIds: ['src-1'],
          confidence: 0.8,
        }],
      }),
    }));

    expect(mocks.saveToolFeedbackAndProposeCapsuleReviewCard).toHaveBeenCalledWith(
      'user-1',
      'sit-1',
      'ask-praxis',
      expect.objectContaining({
        confidence: 1,
        issues: ['inaccurate'],
        suggestion: 'The corridor claim is wrong; mark it disputed.',
      }),
      expect.objectContaining({
        capsuleId: 'cap-1',
        answerId: 'answer-1',
        sourceabilityVerdicts: expect.arrayContaining([
          expect.objectContaining({ verdict: 'contradicted' }),
        ]),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      capsuleReviewCardId: 'review-card-1',
    });
  });

  it('keeps plain tool feedback on the existing save path when no capsule is attached', async () => {
    const { POST } = await import('@/app/api/tool-feedback/route');

    const response = await POST(new Request('https://praxis.tacitus.me/api/tool-feedback', {
      method: 'POST',
      body: JSON.stringify({
        toolId: 'ask-praxis',
        situationId: 'sit-1',
        confidence: 4,
        approved: true,
      }),
    }));

    expect(mocks.saveToolFeedback).toHaveBeenCalledWith(
      'user-1',
      'sit-1',
      'ask-praxis',
      expect.objectContaining({ confidence: 4, approved: true }),
    );
    expect(mocks.saveToolFeedbackAndProposeCapsuleReviewCard).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
