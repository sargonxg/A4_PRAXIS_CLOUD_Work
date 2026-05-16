import { describe, expect, it } from 'vitest';
import { getSuggestedPromptCategories } from '@/components/assistant/suggested-prompts';

function flattenPrompts(categories: ReturnType<typeof getSuggestedPromptCategories>) {
  return categories.flatMap((category) => category.prompts).join('\n');
}

describe('getSuggestedPromptCategories', () => {
  it('shows workspace-start prompts when no active situation exists', () => {
    const prompts = flattenPrompts(getSuggestedPromptCategories({
      demoMode: false,
      activeSituation: null,
    }));

    expect(prompts).toContain('create my first situation');
    expect(prompts).not.toMatch(/User Case|DRM|ceasefire collapse/i);
  });

  it('uses the active real situation when available', () => {
    const prompts = flattenPrompts(getSuggestedPromptCategories({
      demoMode: false,
      activeSituation: {
        name: 'Blue River Negotiation',
        actors: ['City Council', 'Water Union'],
      },
    }));

    expect(prompts).toContain('Blue River Negotiation');
    expect(prompts).toContain("City Council's core interests");
    expect(prompts).not.toMatch(/User Case|DRM/i);
  });

  it('keeps sample mode on the empty workspace prompts', () => {
    const prompts = flattenPrompts(getSuggestedPromptCategories({
      demoMode: true,
      activeSituation: null,
    }));

    expect(prompts).toContain('create my first situation');
    expect(prompts).not.toMatch(/User Case|DRM/);
  });
});
