import { describe, expect, it } from 'vitest';
import { CANONICAL_PERSONAS, DEFAULT_BOARDROOM_PERSONAS, resolveBoardroomPersonas } from '@/lib/boardroom/personas';
import { PersonaSpecSchema } from '@/types/boardroom';

describe('canonical boardroom personas', () => {
  it('ships ten valid canonical persona specs', () => {
    expect(CANONICAL_PERSONAS).toHaveLength(10);
    for (const persona of CANONICAL_PERSONAS) {
      expect(() => PersonaSpecSchema.parse(persona)).not.toThrow();
      expect(persona.corpus.manifest.length).toBeGreaterThanOrEqual(3);
      expect(persona.tools.proficientToolIds.length).toBeGreaterThan(0);
      expect(persona.background.professionalProfile.length).toBeGreaterThan(120);
    }
  });

  it('resolves the default boardroom panel with synthesis and challenge voices', () => {
    const panel = resolveBoardroomPersonas(DEFAULT_BOARDROOM_PERSONAS);
    expect(panel.length).toBeGreaterThanOrEqual(5);
    expect(panel.some((persona) => persona.id === 'devils-advocate')).toBe(true);
    expect(panel.some((persona) => persona.id === 'synthesis-lead')).toBe(true);
  });
});
