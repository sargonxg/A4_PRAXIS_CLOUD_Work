import { describe, expect, it } from 'vitest';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { buildCaptureSuggestion, applyCaptureSuggestionDraft } from '@/lib/user-models/capture-loop';
import { forkPublicUserModel, userModelFirestorePath } from '@/lib/user-models/store';

describe('v5 user models', () => {
  it('seeds the three MVP personas with work ontologies', () => {
    expect(PUBLIC_USER_MODELS.map((model) => model.modelId)).toEqual([
      'foreign-policy-analyst',
      'domestic-policy-analyst',
      'corporate-strategic-analyst',
    ]);
    expect(PUBLIC_USER_MODELS.every((model) => model.workOntologyId)).toBe(true);
  });

  it('forks public models into owner-scoped private records', () => {
    const fork = forkPublicUserModel('foreign-policy-analyst', 'user_123456789');
    expect(fork.ownerUid).toBe('user_123456789');
    expect(fork.visibility).toBe('private');
    expect(fork.parentModelId).toBe('foreign-policy-analyst');
    expect(userModelFirestorePath(fork.ownerUid, fork.modelId)).toContain('users/user_123456789/user-models/');
  });

  it('applies capture suggestions to drafts', () => {
    const seed = PUBLIC_USER_MODELS[0];
    const suggestion = buildCaptureSuggestion('This answer suggests a recurring standing assumption about coalition dynamics and institutional incentives.', seed.modelId);
    expect(suggestion).not.toBeNull();
    const updated = applyCaptureSuggestionDraft(seed, suggestion!);
    expect(updated.standingAssumptions.length).toBeGreaterThan(seed.standingAssumptions.length);
  });
});
