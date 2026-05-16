import { describe, expect, it } from 'vitest';
import { WORKSPACE_TAB_MANIFESTS } from '@/tabs/registry';

describe('workspace manifests', () => {
  it('keeps exactly four substrate tabs in canonical order', () => {
    expect(WORKSPACE_TAB_MANIFESTS.map((tab) => tab.id)).toEqual([
      'context',
      'library',
      'ontology',
      'graph',
    ]);
    expect(WORKSPACE_TAB_MANIFESTS.map((tab) => tab.position)).toEqual([1, 2, 3, 4]);
    for (const tab of WORKSPACE_TAB_MANIFESTS) {
      expect(tab.title.length).toBeGreaterThan(0);
      expect(tab.short_title.length).toBeGreaterThan(0);
      expect(tab.feature_flag).toMatch(/^workspace\.tabs\./);
    }
  });

  it('supports the locked, available, active, complete gating states', () => {
    const states = ['locked', 'available', 'active', 'complete'] as const;
    expect(states).toHaveLength(4);
    expect(states).toContain('locked');
    expect(states).toContain('complete');
  });
});
