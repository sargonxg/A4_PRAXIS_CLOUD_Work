import { describe, expect, it } from 'vitest';
import type { AgentContextGroundingReport } from '@/lib/context/agent-context-verifier';
import {
  buildMemoOutputReview,
  memoOutputBodyHash,
  normalizeMemoOutputReview,
} from '@/lib/memo/output-review';

const supportedReport: AgentContextGroundingReport = {
  groundedClaims: [{ text: 'The policy was approved.', start: 0, end: 24,
    claimCardIds: [], sourceReceiptIds: ['receipt-1'], graphPathIds: [], matchReasons: ['source_text_overlap'] }],
  ungroundedSpans: [], contradictedSpans: [], coverageScore: 1, notes: [],
};

describe('generated memo output review', () => {
  it('binds the receipt to the primary body and preserves generated findings separately from input claims', async () => {
    const report: AgentContextGroundingReport = { ...supportedReport, ungroundedSpans: [{
      text: 'The budget doubled.', start: 25, end: 44, reason: 'no_packet_binding',
      claimCardIds: [], sourceReceiptIds: [], graphPathIds: [],
    }], coverageScore: 0.5 };
    const receipt = await buildMemoOutputReview({ body: 'The policy was approved.\nThe budget doubled.', report, verifierStatus: 'checked' });
    expect(receipt).toMatchObject({ version: 1, scope: 'generated_memo_body', groundedSpanCount: 1,
      ungroundedSpanCount: 1, contradictedSpanCount: 0, totalSpanCount: 2, findingCount: 1,
      reviewRequired: true, exportReady: false, critiqueApplied: false, findings: report.ungroundedSpans });
    expect(receipt.bodyHash).toBe(await memoOutputBodyHash('The policy was approved.\nThe budget doubled.'));
    expect(normalizeMemoOutputReview(JSON.parse(JSON.stringify(receipt)))).toEqual(receipt);
  });

  it.each(['unavailable', 'disabled'] as const)('does not treat a %s verifier as ready', async (verifierStatus) => {
    const receipt = await buildMemoOutputReview({ body: 'The policy was approved.', report: null, verifierStatus });
    expect(receipt).toMatchObject({ verifierStatus, reviewRequired: true, exportReady: false, totalSpanCount: 0 });
  });

  it('keeps a missing report and a zero-span result review-required', async () => {
    const missing = await buildMemoOutputReview({ body: 'A draft.', report: null, verifierStatus: 'checked' });
    expect(missing).toMatchObject({ verifierStatus: 'unavailable', reviewRequired: true, exportReady: false });
    const empty = await buildMemoOutputReview({ body: 'A draft.', report: { ...supportedReport, groundedClaims: [] }, verifierStatus: 'checked' });
    expect(empty).toMatchObject({ totalSpanCount: 0, reviewRequired: true, exportReady: false });
  });

  it('normalizes line endings and outer whitespace without losing meaningful body edits', async () => {
    const receipt = await buildMemoOutputReview({ body: '  The policy was approved.\r\n', report: supportedReport, verifierStatus: 'checked' });
    expect(receipt).toMatchObject({ reviewRequired: true, exportReady: false, findingCount: 0 });
    expect(receipt.bodyHash).toBe(await memoOutputBodyHash('The policy was approved.\n'));
    expect(receipt.bodyHash).not.toBe(await memoOutputBodyHash('The policy  was approved.'));
    expect(receipt.bodyHash).not.toBe(await memoOutputBodyHash('The policy was rejected.'));
  });

  it('rejects invalid or inconsistent receipts and recomputes readiness from findings', async () => {
    const receipt = await buildMemoOutputReview({ body: 'The policy was approved.', report: supportedReport, verifierStatus: 'checked' });
    expect(normalizeMemoOutputReview({ ...receipt, bodyHash: 'invalid' })).toBeNull();
    expect(normalizeMemoOutputReview({ ...receipt, findingCount: 3 })).toBeNull();
    expect(normalizeMemoOutputReview({ ...receipt, totalSpanCount: 0 })).toBeNull();
    expect(normalizeMemoOutputReview({ ...receipt, verifierStatus: 'disabled', exportReady: true, reviewRequired: false }))
      .toMatchObject({ exportReady: false, reviewRequired: true });
    expect(normalizeMemoOutputReview({ ...receipt, exportReady: true, reviewRequired: false }))
      .toMatchObject({ exportReady: false, reviewRequired: true });
  });
});
