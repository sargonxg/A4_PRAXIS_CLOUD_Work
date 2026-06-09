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

  it('keeps starter deep links and current-versus-roadmap boundaries concrete', () => {
    for (const anchor of [
      'id: "sourceability"',
      'id: "claim-source-alignment"',
      'id: "role-capsules"',
      'id: "output-quality"',
      'id: "thinking-devices"',
    ]) {
      expect(source).toContain(anchor);
    }
    expect(source).toContain('id={item.id}');

    expect(source).toContain('Use it today');
    expect(source).toContain('Current PRAXIS stays simple');
    expect(source).toContain('roadmap lanes when they are not the visible production surface');
    expect(source).toContain('Home, saved context, Ask PRAXIS, sources, memos, and receipts');
  });
});
