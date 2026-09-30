import { describe, expect, it } from 'vitest';
import { buildMemoOutputReview, memoOutputBodyHash } from '@/lib/memo/output-review';
import { validateOutputCapsulePayload } from '@/lib/output-capsules/schemas';
import { createOutputCapsuleRecord } from '@/lib/output-capsules/service';

const body = 'Implementation remains unconfirmed.';
const payload = {
  title: 'Policy options',
  summary: 'A reviewable research memo.',
  sections: [{ heading: 'Generated memo body', body, citationIds: [] }],
};

describe('research memo OutputCapsule review persistence', () => {
  it.each(['checked', 'unavailable', 'disabled'] as const)(
    'retains the exact body-bound receipt through the real record serializer and JSON: %s',
    async (verifierStatus) => {
      const outputReview = await buildMemoOutputReview({ body, verifierStatus, report: verifierStatus === 'checked' ? {
        groundedClaims: [],
        ungroundedSpans: [{ text: body, start: 0, end: body.length, reason: 'no_packet_binding',
          claimCardIds: [], sourceReceiptIds: [], graphPathIds: [] }],
        contradictedSpans: [], coverageScore: 0, notes: [],
      } : null });
      const record = createOutputCapsuleRecord({
        id: 'run-review-options-memo', ownerUid: 'user-review', templateId: 'options-memo',
        payload: { ...payload, outputReview, sourceabilityScope: 'input_evidence', unexpectedPrivateField: 'discard me' },
        gaps: [{ id: 'generated-memo-review', claim: 'Whole-draft review is required.',
          reason: 'Feedback has not been applied.', severity: 'high' }],
        provenance: { createdBy: 'research-memo', toolIds: ['policy-memo'], agentIds: ['research-memo'] },
      });
      const stored = JSON.parse(JSON.stringify(record));
      const reopened = validateOutputCapsulePayload(stored.schemaId, stored.payload);
      expect(reopened).toMatchObject({ outputReview, sourceabilityScope: 'input_evidence', sections: payload.sections });
      expect(reopened).not.toHaveProperty('unexpectedPrivateField');
      expect(outputReview.bodyHash).toBe(await memoOutputBodyHash(reopened.sections[0].body));
      expect(stored.status).toBe('draft');
      expect(stored.gaps).toEqual(record.gaps);
    },
  );

  it('normalizes a forged approval flag without discarding valid receipt findings', async () => {
    const outputReview = await buildMemoOutputReview({ body, report: null, verifierStatus: 'disabled' });
    const parsed = validateOutputCapsulePayload('options-memo-v1', {
      ...payload, outputReview: { ...outputReview, reviewRequired: false, exportReady: true },
    });
    expect(parsed).toMatchObject({ outputReview });
  });

  it('retains malformed review as unknown rather than silently stripping its review boundary', () => {
    expect(validateOutputCapsulePayload('options-memo-v1', { ...payload, outputReview: { exportReady: true } }))
      .toMatchObject({ outputReview: null });
  });

  it('preserves the existing payload contract for memos without generated review metadata', () => {
    const parsed = validateOutputCapsulePayload('options-memo-v1', payload);
    expect(parsed).toEqual(payload);
    expect(parsed).not.toHaveProperty('outputReview');
    expect(parsed).not.toHaveProperty('sourceabilityScope');
  });
});
