import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/app/(landing)/learn/page.tsx', 'utf8');

describe('/learn ContextCapsule v3 contract', () => {
  it('explains human-gated capsules as reusable agentic context rather than prompts', () => {
    expect(source).toContain('A Wikipedia for Agentic Context');
    expect(source).toContain('reusable context objects, not prompts');
    expect(source).toContain('sources, assumptions, tacit knowledge, reasoning devices, review gates, and allowed agent behavior');
    expect(source).toContain('claims, sources, memories, and limitations are labeled');
    expect(source).toContain('AI and Cognee can suggest improvements');
    expect(source).toContain('human review decides what becomes canonical');
    expect(source).toContain('forkable and inspectable');
    expect(source).toContain('provenance and review state');
  });
});
