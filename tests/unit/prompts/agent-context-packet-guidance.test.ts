import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Agent Context Packet prompt guidance', () => {
  it('keeps workflow prompt frames aligned with packet evidence rules', () => {
    const root = process.cwd();
    const situationIntelligence = readFileSync(join(root, 'prompts/situation-intelligence.prompt'), 'utf8');
    const capsuleFactory = readFileSync(join(root, 'prompts/capsule-factory.prompt'), 'utf8');
    const pathFrame = readFileSync(join(root, 'prompts/_path-frame.prompt'), 'utf8');

    expect(situationIntelligence).toContain('Agent Context Packet');
    expect(situationIntelligence).toContain('Reasoning Paths');
    expect(situationIntelligence).toContain('SR-');
    expect(capsuleFactory).toContain('source receipt IDs');
    expect(capsuleFactory).toContain('advisory/inferred');
    expect(pathFrame).toContain('Packet evidence');
  });
});
