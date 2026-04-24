import { describe, it, expect } from 'vitest';
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import { renderSystemPromptBlock } from '@/lib/context/system-prompt-block';

describe('renderSystemPromptBlock', () => {
  it('emits a <preferences> block when preferences are provided', () => {
    const out = renderSystemPromptBlock({
      profile: null,
      situation: null,
      retrievedChunks: [],
      preferences: DEFAULT_USER_PREFERENCES,
    });
    expect(out).toContain('<preferences>');
    expect(out).toContain('un-footnote');
  });
});
