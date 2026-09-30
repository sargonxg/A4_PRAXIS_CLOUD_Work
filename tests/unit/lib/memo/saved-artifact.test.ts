import { describe, expect, it } from 'vitest';
import { savedMemoReviewState } from '@/lib/memo/saved-artifact';

describe('authoritative saved memo review state', () => {
  it('selects the named current version instead of assuming the last array element is current', () => {
    expect(savedMemoReviewState({ memo: { id: 'memo-a', title: 'Saved title', currentVersionId: 'v1' }, versions: [
      { id: 'v1', blocks: [{ id: 'memo-body', content: 'Current body' }, { id: 'audit', content: 'Audit' }] },
      { id: 'v2', blocks: [{ id: 'memo-body', content: 'Other body' }] },
    ] })).toMatchObject({ currentVersionId: 'v1', savedBody: 'Current body', savedTitle: 'Saved title', humanApproval: null });
  });
  it('does not turn local fallback content into an authoritative saved version', () => {
    expect(savedMemoReviewState({ memo: { id: 'memo-a', currentVersionId: 'missing' }, versions: [{ id: 'v1', blocks: [{ id: 'memo-body', content: 'Fallback' }] }] }).savedBody).toBeNull();
    expect(savedMemoReviewState({})).toMatchObject({ currentVersionId: null, savedBody: null, humanApproval: null });
  });
  it('uses primary content and excludes critique/audit/receipt blocks from the body hash boundary', () => {
    expect(savedMemoReviewState({ memo: { currentVersionId: 'v1' }, versions: [{ id: 'v1', blocks: [
      { id: 'opening', content: 'Opening' }, { id: 'receipt-card', content: 'Receipt' },
      { id: 'analysis', content: 'Analysis' }, { id: 'unapplied-critique', content: 'Feedback' },
    ] }] }).savedBody).toBe('Opening\n\nAnalysis');
  });
});
