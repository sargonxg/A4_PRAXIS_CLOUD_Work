import { describe, expect, it } from 'vitest';
import { sourceabilityVerdictBadgeTone } from '@/components/ask/SourceabilityVerdictBadges';

describe('Ask sourceability verdict badges', () => {
  it('maps each verdict to the required visual tone', () => {
    expect(sourceabilityVerdictBadgeTone('supported')).toMatchObject({
      label: 'supported',
      tone: 'gold',
    });
    expect(sourceabilityVerdictBadgeTone('contradicted')).toMatchObject({
      label: 'contradicted',
      tone: 'red',
    });
    expect(sourceabilityVerdictBadgeTone('weak')).toMatchObject({
      label: 'weak',
      tone: 'amber',
    });
    expect(sourceabilityVerdictBadgeTone('unsupported')).toMatchObject({
      label: 'unsupported',
      tone: 'grey',
    });
  });
});
