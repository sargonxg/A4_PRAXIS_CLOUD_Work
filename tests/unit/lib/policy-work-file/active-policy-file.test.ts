import { describe, expect, it } from 'vitest';

import { buildActivePolicyFileModel } from '@/lib/policy-work-file/active-policy-file';

describe('active policy file model', () => {
  it('surfaces output target review gates without creating a new file object', () => {
    expect(buildActivePolicyFileModel({
      capsuleId: 'cap-1',
      capsuleVersion: 3,
      title: 'Regional access memo',
      domain: 'Humanitarian access',
      outputTarget: 'compliance-note',
      sourceCount: 5,
      openQuestions: 2,
      unsupportedClaims: 1,
    })).toMatchObject({
      hasActiveFile: true,
      outputGoal: 'Legal/policy compliance note',
      reviewGate: 'Sourceability required',
      sourceabilityRequired: true,
      capsuleLabel: 'cap-1 v3',
    });
  });
});
