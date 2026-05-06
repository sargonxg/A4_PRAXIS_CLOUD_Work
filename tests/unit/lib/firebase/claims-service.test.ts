import { describe, expect, it } from 'vitest';
import {
  buildClaimTrustRecord,
  claimTrustId,
  computeClaimTrustScore,
  persistClaimTrust,
  type ClaimTrustRecord,
  type ClaimTrustWriter,
} from '@/lib/firebase/claims-service';

describe('claims-service', () => {
  it('computes stronger scores for sourced claims than unverified claims', () => {
    const sourced = computeClaimTrustScore({ groundingStatus: 'source_grounded', sourceCount: 2, confidence: 0.9 });
    const unverified = computeClaimTrustScore({ groundingStatus: 'unverified', confidence: 0.2 });

    expect(sourced).toBeGreaterThan(unverified);
    expect(sourced).toBeLessThanOrEqual(100);
  });

  it('creates stable claim ids independent of whitespace and casing', () => {
    expect(claimTrustId('u1', 's1', 'brief', '  Claim Text  ')).toBe(claimTrustId('u1', 's1', 'brief', 'claim   text'));
  });

  it('builds claim-level persistence records', () => {
    const record = buildClaimTrustRecord({
      uid: 'u1',
      situationId: 's1',
      claim: {
        text: 'According to [source], the access route is constrained.',
        groundingStatus: 'source_grounded',
        emittedBy: 'briefing-generate',
        toolRunId: 'run1',
      },
    });

    expect(record).toMatchObject({
      uid: 'u1',
      situationId: 's1',
      groundingStatus: 'source_grounded',
      emittedBy: 'briefing-generate',
      toolRunId: 'run1',
    });
    expect(record.trustScore).toBeGreaterThan(0);
  });

  it('persists through an injectable writer', async () => {
    const writes: ClaimTrustRecord[] = [];
    const writer: ClaimTrustWriter = {
      async setClaim(_uid, _situationId, _claimId, record) {
        writes.push(record);
      },
    };

    const result = await persistClaimTrust({
      uid: 'u1',
      situationId: 's1',
      claim: {
        text: 'This likely follows from prior graph evidence.',
        groundingStatus: 'inferred',
        emittedBy: 'risk-monitor',
      },
    }, writer);

    expect(result.persisted).toBe(true);
    expect(writes).toHaveLength(1);
    expect(writes[0].groundingStatus).toBe('inferred');
  });
});
