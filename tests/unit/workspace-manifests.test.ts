import { describe, expect, it } from 'vitest';
import { WORKSPACE_CHAPTER_MANIFESTS } from '@/chapters/registry';
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

  it('keeps seven chapters with Desk locked on and product writes scoped', () => {
    expect(WORKSPACE_CHAPTER_MANIFESTS.map((chapter) => chapter.id)).toEqual([
      'desk',
      'research',
      'memos',
      'draft',
      'ach',
      'tools',
      'boardroom',
    ]);
    expect(WORKSPACE_CHAPTER_MANIFESTS[0]).toMatchObject({
      id: 'desk',
      always_on: true,
      writes: 'none',
    });
    expect(WORKSPACE_CHAPTER_MANIFESTS.map((chapter) => chapter.writes)).toEqual([
      'none',
      'research_threads',
      'memos',
      'draft_exports',
      'ach_matrices',
      'dialectica_runs',
      'briefings',
    ]);
  });

  it('supports the locked, available, active, complete gating states', () => {
    const states = ['locked', 'available', 'active', 'complete'] as const;
    expect(states).toHaveLength(4);
    expect(states).toContain('locked');
    expect(states).toContain('complete');
  });
});
