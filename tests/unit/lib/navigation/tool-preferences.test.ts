import { describe, expect, it } from 'vitest';
import {
  applyToolPreferences,
  CUSTOMIZABLE_SIDEBAR_TOOLS,
  hiddenToolSet,
  isToolHiddenByPreference,
  normalizeToolPreferenceId,
  orderedToolIds,
} from '@/lib/navigation/tool-preferences';

describe('tool preferences navigation helpers', () => {
  it('keeps known preferred ids first and appends the rest', () => {
    const ordered = orderedToolIds({ toolOrder: ['risk-monitor', 'dashboard', 'unknown-tool'] });
    expect(ordered.slice(0, 2)).toEqual(['risk-monitor', 'dashboard']);
    expect(ordered).toContain('conflict-graph');
    expect(ordered).not.toContain('unknown-tool');
  });

  it('deduplicates stored order ids', () => {
    const ordered = orderedToolIds({ toolOrder: ['dashboard', 'dashboard', 'risk-monitor'] });
    expect(ordered.slice(0, 2)).toEqual(['dashboard', 'risk-monitor']);
  });

  it('creates a hidden tool set from preferences', () => {
    const hidden = hiddenToolSet({ hiddenToolIds: ['game-theory', 'media-compass'] });
    expect(hidden.has('game-theory')).toBe(true);
    expect(hidden.has('dashboard')).toBe(false);
  });

  it('preserves explicit route aliases', () => {
    const reports = CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === 'report-studio');
    const actors = CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === 'actor-profiles');
    const sources = CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === 'sources-library');
    expect(reports?.href).toBe('/reports');
    expect(actors?.href).toBe('/actors');
    expect(sources?.href).toBe('/sources');
  });

  it('normalizes legacy recommendation ids before applying preferences', () => {
    expect(normalizeToolPreferenceId('sources')).toBe('sources-library');
    expect(isToolHiddenByPreference({ hiddenToolIds: ['sources-library'] }, 'sources')).toBe(true);
  });

  it('filters hidden recommendations and respects saved tool order', () => {
    const items = [
      { toolId: 'briefing', href: '/briefing' },
      { toolId: 'sources-library', href: '/sources' },
      { toolId: 'risk-monitor', href: '/risk-monitor' },
      { toolId: 'media-compass', href: '/media-compass' },
    ];

    const ordered = applyToolPreferences(items, {
      hiddenToolIds: ['briefing'],
      toolOrder: ['media-compass', 'sources-library'],
    });

    expect(ordered.map((item) => item.toolId)).toEqual([
      'media-compass',
      'sources-library',
      'risk-monitor',
    ]);
  });

  it('keeps recommendation ranking when the user has no explicit tool order', () => {
    const items = [
      { toolId: 'briefing', href: '/briefing' },
      { toolId: 'early-warning', href: '/early-warning' },
      { toolId: 'dashboard', href: '/dashboard' },
    ];

    const ordered = applyToolPreferences(items, {
      hiddenToolIds: [],
      toolOrder: [],
    });

    expect(ordered.map((item) => item.toolId)).toEqual([
      'briefing',
      'early-warning',
      'dashboard',
    ]);
  });
});
