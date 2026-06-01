import { describe, expect, it } from 'vitest';
import {
  buildSourceabilityClaimVerdicts,
  sourceabilityVerdictForSupportLabel,
} from '@/lib/agent-runtime/sourceability-ledger';

describe('sourceability ledger verdicts', () => {
  it('maps internal support labels to the four Ask-visible verdicts', () => {
    expect(sourceabilityVerdictForSupportLabel('supported')).toBe('supported');
    expect(sourceabilityVerdictForSupportLabel('weak')).toBe('weak');
    expect(sourceabilityVerdictForSupportLabel('contradicted')).toBe('contradicted');
    expect(sourceabilityVerdictForSupportLabel('unsupported')).toBe('unsupported');
    expect(sourceabilityVerdictForSupportLabel('model_prior')).toBe('unsupported');
    expect(sourceabilityVerdictForSupportLabel('assumption')).toBe('unsupported');
  });

  it('exposes stable per-claim verdict DTOs for the Ask stream payload', () => {
    const verdicts = buildSourceabilityClaimVerdicts([
      {
        id: 'claim-1',
        claim: 'The monitoring cell reported access restrictions near the crossing.',
        supportLabel: 'supported',
        sourceIds: ['doc-1:chunk-1'],
        confidence: 0.82,
        reviewNote: 'Matched uploaded document paragraph.',
      },
      {
        id: 'claim-2',
        claim: 'The source contradicts the asserted unrestricted access posture.',
        supportLabel: 'contradicted',
        sourceIds: ['doc-2:chunk-3'],
        confidence: 0.91,
        reviewNote: 'Matched source says the opposite.',
      },
    ]);

    expect(verdicts).toEqual([
      {
        claimId: 'claim-1',
        claim: 'The monitoring cell reported access restrictions near the crossing.',
        verdict: 'supported',
        supportLabel: 'supported',
        sourceIds: ['doc-1:chunk-1'],
        confidence: 0.82,
        reviewNote: 'Matched uploaded document paragraph.',
      },
      {
        claimId: 'claim-2',
        claim: 'The source contradicts the asserted unrestricted access posture.',
        verdict: 'contradicted',
        supportLabel: 'contradicted',
        sourceIds: ['doc-2:chunk-3'],
        confidence: 0.91,
        reviewNote: 'Matched source says the opposite.',
      },
    ]);
  });
});
