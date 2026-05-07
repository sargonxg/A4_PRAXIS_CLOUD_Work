import { describe, expect, it } from 'vitest';
import { buildCustomPersonaSpec } from '@/lib/boardroom/custom-personas-store';
import { PersonaSpecSchema } from '@/types/boardroom';

describe('custom boardroom personas', () => {
  it('builds a sandboxed custom persona spec from a workspace draft', () => {
    const persona = buildCustomPersonaSpec({
      displayName: 'Custom Sudan Adviser',
      shortRole: 'Sudan Adviser',
      professionalProfile: 'A workspace-authored specialist focused on Sudan mediation dynamics and field-network interpretation.',
      domains: ['Sudan mediation', 'field networks'],
      frameworks: ['elite bargain mapping'],
      signatureQuestions: ['Who benefits from delay?', 'Which actor can veto implementation?'],
      blindSpots: ['May overweight elite bargaining signals.'],
      toolIds: ['cross.red-team'],
      corpusEntries: [{ title: 'Field note', citation: 'Workspace field note, 2026', license: 'workspace-restricted' }],
      voiceRegister: 'professional',
    });

    expect(() => PersonaSpecSchema.parse(persona)).not.toThrow();
    expect(persona.id).toBe('custom:custom-sudan-adviser');
    expect(persona.corpus.namespace).toContain('custom:custom-sudan-adviser');
    expect(persona.tools.proficientToolIds).toEqual(['cross.red-team']);
  });
});
