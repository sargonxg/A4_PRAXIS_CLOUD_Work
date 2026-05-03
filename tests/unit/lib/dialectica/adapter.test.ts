import { describe, expect, it } from 'vitest';
import { FirestoreDialecticaAdapter } from '@/lib/dialectica/firestore-adapter';
import { HttpDialecticaAdapter } from '@/lib/dialectica/http-adapter';

describe('Dialectica adapters', () => {
  it('advertises the default Firestore capabilities', () => {
    const capabilities = new FirestoreDialecticaAdapter().capabilities();
    expect(capabilities.mode).toBe('firestore');
    expect(capabilities.recipes).toEqual([
      'leverage-trace',
      'commitment-check',
      'interest-vs-position',
      'counter-narrative',
      'path-search',
    ]);
    expect(capabilities.provenance).toBe(true);
  });

  it('keeps the HTTP adapter behind an explicit enable flag', async () => {
    const adapter = new HttpDialecticaAdapter('https://dialectica.invalid');
    await expect(adapter.reason('path-search', { goal_state: 'test' })).rejects.toThrow('not enabled');
  });
});
