import { describe, expect, it } from 'vitest';
import {
  buildMemoClaimCheckQuestion,
  buildMemoClaimCheckResult,
  checkMemoLanguageConstraints,
  deriveMemoExportGate,
} from '@/lib/memo/memo-checks';
import type { OutputConstraints } from '@/lib/context/system-prompt-block';

const constraints: OutputConstraints = {
  language: 'en',
  audienceTone: 'senior_leadership',
  redLineClauses: ['guarantee', 'without risk'],
  styleHint: 'rapid_brief',
};

describe('memo checks', () => {
  it('builds a capsule-scoped claim-check question for Ask PRAXIS delegation', () => {
    const question = buildMemoClaimCheckQuestion({
      claim: 'The monitoring cell reported unrestricted access near the northern crossing.',
      capsuleId: 'capsule-access-1',
    });

    expect(question).toContain('capsule-access-1');
    expect(question).toContain('supported');
    expect(question).toContain('contradicted');
    expect(question).toContain('Selected claim:');
    expect(question).toContain('unrestricted access');
  });

  it('maps a delegated claim check to a contradicted sourceability verdict with receipt provenance', () => {
    const result = buildMemoClaimCheckResult({
      claim: 'The monitoring cell reported unrestricted access near the northern crossing.',
      delegateResult: {
        text: 'The attached source contradicts the claim.',
        output: {
          verdict: 'contradicted',
          rationale: 'The receipt says access restrictions remained in place.',
          quote: 'The monitoring cell reported access restrictions near the northern crossing.',
          sourceId: 'doc-access:chunk-contradiction',
        },
        citations: [{
          index: 1,
          layer: 'uploaded-document',
          title: 'Access restrictions log',
          citation: 'doc-access:chunk-contradiction',
        }],
      },
      profileVersion: 7,
      toolRunId: 'tool-run-1',
    });

    expect(result.verdict).toBe('contradicted');
    expect(result.receipt).toMatchObject({
      sourceId: 'doc-access:chunk-contradiction',
      title: 'Access restrictions log',
      quote: 'The monitoring cell reported access restrictions near the northern crossing.',
    });
    expect(result.sourceabilityVerdicts).toContainEqual(expect.objectContaining({
      verdict: 'contradicted',
      sourceIds: ['doc-access:chunk-contradiction'],
    }));
    expect(result.provenance).toMatchObject({
      profileVersion: 7,
      toolRunId: 'tool-run-1',
    });
  });

  it('flags red-line phrases from output constraints case-insensitively', () => {
    const result = checkMemoLanguageConstraints(
      'We can guarantee delivery without risk if principals accept this text.',
      constraints,
    );

    expect(result.violations).toContainEqual(expect.objectContaining({
      kind: 'red_line',
      phrase: 'guarantee',
      severity: 'high',
    }));
    expect(result.violations).toContainEqual(expect.objectContaining({
      kind: 'red_line',
      phrase: 'without risk',
      severity: 'high',
    }));
    expect(result.summary).toContain('2 issue');
  });

  it('blocks memo export until sourceability passes, red-lines are clear, and classification is set', () => {
    const supportedClaim = buildMemoClaimCheckResult({
      claim: 'The monitoring cell reported restricted access near the northern crossing.',
      delegateResult: {
        text: 'The attached source supports the claim.',
        output: {
          verdict: 'supported',
          rationale: 'The receipt directly supports the access restriction claim.',
          quote: 'The monitoring cell reported access restrictions near the northern crossing.',
          sourceId: 'doc-access:chunk-supported',
        },
        citations: [],
      },
      profileVersion: 7,
      toolRunId: 'tool-run-sourceability',
      generatedAt: '2026-06-02T12:00:00.000Z',
    });
    const cleanLanguage = checkMemoLanguageConstraints(
      'The attached source indicates access restrictions remain in place.',
      constraints,
      { profileVersion: 7, toolRunId: 'tool-run-language', generatedAt: '2026-06-02T12:01:00.000Z' },
    );

    expect(deriveMemoExportGate({
      classification: '',
      checkResults: [cleanLanguage, supportedClaim],
    })).toMatchObject({
      ready: false,
      blockers: expect.arrayContaining(['classification-required']),
    });

    expect(deriveMemoExportGate({
      classification: 'UNCLASSIFIED // POLICY PLANNING',
      checkResults: [cleanLanguage, supportedClaim],
    })).toMatchObject({
      ready: true,
      sourceabilityStatus: 'passed',
      redlineStatus: 'passed',
      classificationStatus: 'set',
    });

    const redlineCheck = checkMemoLanguageConstraints(
      'We can guarantee delivery without risk if principals accept this text.',
      constraints,
      { profileVersion: 7, toolRunId: 'tool-run-redline', generatedAt: '2026-06-02T12:02:00.000Z' },
    );
    expect(deriveMemoExportGate({
      classification: 'UNCLASSIFIED // POLICY PLANNING',
      checkResults: [redlineCheck, supportedClaim],
    })).toMatchObject({
      ready: false,
      redlineStatus: 'blocked',
      blockers: expect.arrayContaining(['redline-blocked']),
    });
  });
});
