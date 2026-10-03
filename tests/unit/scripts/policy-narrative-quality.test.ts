import { describe, expect, it } from 'vitest';
import { buildAnalystRubric, buildQualityPair, parseQualityOptions, sanitizeQualityError, summarizeQualityComparison } from '../../../scripts/evaluate-policy-narrative-quality';
import fixture from '../../fixtures/policy-narrative-evidence.json';
import advisory from '../../fixtures/example-advisory-dossier.json';

describe('retained policy/narrative evaluation', () => {
  it('pins eight Advisory scenarios to the same exact source-language passages and offsets', () => {
    const cases = fixture.cases.filter((item) => item.id.startsWith('example-advisory-'));
    expect(cases).toHaveLength(8);
    for (const item of cases) for (const capture of item.sourceCaptures ?? []) {
      const source = advisory.sources.find((candidate) => candidate.id === capture.publisher)!;
      expect(source).toBeDefined();
      expect(capture.originalText).toBe(source.text);
      expect(capture).toHaveProperty('locator', `synthetic:${source.id}:v${source.version}:chars:0-${source.text.length}`);
    }
  });
  it('gives both conditions the same source contents without leaking grading answers', () => {
    for (const item of fixture.cases) {
      const pair = buildQualityPair(item as Parameters<typeof buildQualityPair>[0]);
      for (const prompt of [pair.baseline, pair.capsule]) {
        expect(prompt).toContain(item.prompt);
        if (item.suppliedContext) expect(prompt).toContain(item.suppliedContext);
        for (const source of item.sourceCaptures ?? []) {
          if ('originalText' in source) expect(prompt).toContain(source.originalText);
          if ('generatedGroundingSegment' in source) expect(prompt).toContain(source.generatedGroundingSegment);
        }
        expect(prompt).not.toContain('expectedChecks');
        expect(prompt).not.toContain('forbiddenInferences');
        for (const check of item.expectedChecks) expect(prompt).not.toContain(check);
        expect(prompt).toContain('fictional test double');
      }
      const baselineEvidence = pair.baseline.split('Supplied material:\n')[1].split('\n\nQuestion:')[0];
      const capsuleEvidence = pair.capsule.split('purpose: reusable supplied evidence for this question\n')[1].split('\n[/context_capsule]')[0];
      expect(capsuleEvidence).toBe(baselineEvidence);
    }
  });

  it('leaves both model judgments and benefit assessments unscored for a human', () => {
    const rubric = buildAnalystRubric(fixture.cases[0] as Parameters<typeof buildAnalystRubric>[0]);
    expect(rubric.reviewStatus).toBe('unscored');
    expect(rubric.reviewer).toBeNull();
    expect(rubric.preferredCondition).toBeNull();
    expect(rubric.dimensions.every((row) => row.baselineScore === null && row.capsuleScore === null)).toBe(true);
    expect(rubric.expectedChecks.every((row) => row.baseline === null && row.capsule === null)).toBe(true);
  });

  it('makes dry-run the default and rejects unbounded or unmatched execution settings', () => {
    expect(parseQualityOptions([])).toMatchObject({ execute: false, taskKind: 'balanced', repetitions: 1, maxOutputTokens: 2000 });
    expect(parseQualityOptions(['--execute', '--task-kind=cheap_classify'])).toMatchObject({ execute: true, maxOutputTokens: 1024 });
    for (const argv of [['--execute', '--dry-run'], ['--execute=no'], ['--repetitions=4'], ['--timeout-ms=0'],
      ['--task-kind=embeddings_text'], ['--task-kind=cheap_classify', '--max-output-tokens=2000'], ['--case=a', '--case=b'], ['--fallback=flash']]) {
      expect(() => parseQualityOptions(argv)).toThrow();
    }
  });

  it('redacts local credentials and bearer/query tokens from error receipts', () => {
    const error = new Error('failed my-secret-api-key Bearer bearer-secret https://example.test?key=url-secret&safe=1');
    const sanitized = sanitizeQualityError(error, { NODE_ENV: 'test', GOOGLE_AI_API_KEY: 'my-secret-api-key' });
    expect(sanitized.message).not.toContain('my-secret-api-key');
    expect(sanitized.message).not.toContain('bearer-secret');
    expect(sanitized.message).not.toContain('url-secret');
    expect(sanitized.message).toContain('&safe=1');
  });

  it('refuses to treat missing, unequal or failed model outputs as a matched comparison', () => {
    const baseline = { condition: 'baseline', status: 'generated-unscored', reportedModelId: 'snapshot-a' };
    const capsule = { condition: 'capsule', status: 'generated-unscored', reportedModelId: 'snapshot-a' };
    expect(summarizeQualityComparison([baseline, capsule]).status).toBe('matched-outputs-unscored');
    for (const other of [{ ...capsule, reportedModelId: 'snapshot-b' }, { ...capsule, reportedModelId: null },
      { ...capsule, status: 'provider-error' }, { ...capsule, status: 'empty-output' }]) {
      expect(summarizeQualityComparison([baseline, other]).status).toBe('incomplete');
    }
    expect(summarizeQualityComparison([baseline]).status).toBe('incomplete');
  });
});
