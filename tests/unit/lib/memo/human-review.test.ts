import { describe, expect, it } from 'vitest';
import { memoOutputBodyHash } from '@/lib/memo/output-review';
import { isCurrentMemoHumanApproval } from '@/lib/memo/human-review';
import { signMemoHumanApproval, verifyMemoHumanApproval } from '@/lib/memo/human-review-server';

describe('body and version bound human memo approval', () => {
  it('signs the reviewer, saved version, use and limitations and rejects altered approval', async () => {
    const fields = { memoId: 'memo-1', versionId: 'memo-1-v2', reviewerUid: 'owner-1',
      bodyHash: await memoOutputBodyHash('Funding is approved; expenditure is not established.'),
      approvedAt: '2026-09-30T14:00:00.000Z', intendedUse: 'internal-analysis' as const,
      limitations: 'No expenditure ledger has been supplied.' };
    const approval = signMemoHumanApproval(fields);
    expect(verifyMemoHumanApproval(approval)).toEqual(approval);
    expect(isCurrentMemoHumanApproval(approval, fields)).toBe(true);
    expect(verifyMemoHumanApproval({ ...approval, intendedUse: 'publication' })).toBeNull();
    expect(verifyMemoHumanApproval({ ...approval, reviewerUid: 'other-owner' })).toBeNull();
    expect(verifyMemoHumanApproval({ ...approval, bodyHash: await memoOutputBodyHash('No money was spent.') })).toBeNull();
  });

  it('makes approval outdated after a new saved version or edited body', async () => {
    const fields = { memoId: 'memo-1', versionId: 'memo-1-v1', reviewerUid: 'owner-1',
      bodyHash: await memoOutputBodyHash('Claim.'), approvedAt: '2026-09-30T14:00:00.000Z',
      intendedUse: 'publication' as const, limitations: 'Reviewed against the attached original documents.' };
    const approval = signMemoHumanApproval(fields);
    expect(isCurrentMemoHumanApproval(approval, { ...fields, versionId: 'memo-1-v2' })).toBe(false);
    expect(isCurrentMemoHumanApproval(approval, { ...fields, bodyHash: await memoOutputBodyHash('Edited claim.') })).toBe(false);
    expect(isCurrentMemoHumanApproval(null, fields)).toBe(false);
  });
});
