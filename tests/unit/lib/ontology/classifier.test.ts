import { describe, expect, it } from 'vitest';
import { classifyOntologySignals } from '@/lib/ontology/classifier';

describe('Pack 20 ontology signal classifier', () => {
  it('classifies sanctions and ownership briefs as economic', () => {
    const result = classifyOntologySignals({
      name: 'OFAC beneficial ownership designation review',
      description: 'Trace sanctions evasion, export control exposure, and payment channels through shell companies.',
      role: 'sanctions_analyst',
    });
    expect(result.primaryOntologyId).toBe('economic');
    expect(result.ontologyIds).toContain('economic');
  });

  it('classifies humanitarian access briefs as humanitarian with conflict as a secondary lens', () => {
    const result = classifyOntologySignals({
      name: 'Northern corridor access crisis',
      description: 'OCHA needs assessment for IDP populations, cluster response gaps, and access constraints at checkpoints.',
      role: 'humanitarian_coordinator',
    });
    expect(result.primaryOntologyId).toBe('humanitarian');
    expect(result.ontologyIds).toContain('conflict');
  });
});
