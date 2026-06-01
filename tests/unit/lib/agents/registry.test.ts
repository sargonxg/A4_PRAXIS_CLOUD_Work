import { describe, expect, it } from 'vitest';
import { getPersona } from '@/lib/agents/registry';

describe('agent persona registry', () => {
  it('registers the source-checker lane as an active sourceability persona', () => {
    expect(getPersona('source-checker')).toMatchObject({
      id: 'source-checker',
      label: 'Source Checker',
      active: true,
      handoffTools: expect.arrayContaining(['sourceability-reviewer', 'grounded-search']),
    });
  });
});
