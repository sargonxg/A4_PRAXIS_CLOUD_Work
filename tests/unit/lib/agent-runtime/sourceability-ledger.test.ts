import { describe, expect, it } from 'vitest';
import {
  buildSourceGapScoutObjective,
  buildSourceabilityClaimVerdicts,
  computeEvidenceCoverage,
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

  it('computes answer evidence coverage from Ask-visible verdicts', () => {
    const verdicts = buildSourceabilityClaimVerdicts([
      {
        id: 'claim-1',
        claim: 'The access cell reported two restrictions.',
        supportLabel: 'supported',
        sourceIds: ['source-1'],
      },
      {
        id: 'claim-2',
        claim: 'The telecom outage is confirmed.',
        supportLabel: 'unsupported',
      },
      {
        id: 'claim-3',
        claim: 'The crossing posture is mixed.',
        supportLabel: 'weak',
        sourceIds: ['source-2'],
      },
      {
        id: 'claim-4',
        claim: 'The source says the opposite.',
        supportLabel: 'contradicted',
        sourceIds: ['source-3'],
      },
    ]);

    expect(computeEvidenceCoverage(verdicts)).toEqual({
      totalClaims: 4,
      supportedClaims: 1,
      unsupportedClaims: 1,
      weakClaims: 1,
      contradictedClaims: 1,
      coveragePercent: 25,
      unsupportedClaimTexts: ['The telecom outage is confirmed.'],
    });
  });

  it('builds a scoped Source-Gap Scout objective from unsupported claims', () => {
    expect(buildSourceGapScoutObjective([
      'The telecom outage is confirmed.',
      'The telecom outage is confirmed.',
      'A current source is missing for the border opening.',
    ])).toContain('- The telecom outage is confirmed.');
    expect(buildSourceGapScoutObjective([])).toBe('Find sources for unsupported claims.');
  });
});
