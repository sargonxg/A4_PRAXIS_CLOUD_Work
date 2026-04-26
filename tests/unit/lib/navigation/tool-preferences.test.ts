import { describe, expect, it } from 'vitest';
import {
  CUSTOMIZABLE_SIDEBAR_TOOLS,
  hiddenToolSet,
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
    expect(reports?.href).toBe('/reports');
    expect(actors?.href).toBe('/actors');
  });
});

