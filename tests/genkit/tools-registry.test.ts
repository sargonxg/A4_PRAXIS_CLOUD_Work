import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/genkit', () => ({
  ai: {
    defineTool: vi.fn((config, handler) => ({ config, handler })),
  },
}));
import {
  getRegisteredToolForPathBundle,
  getToolsForPath,
  PRAXIS_GENKIT_PATH_TOOL_IDS,
  PRAXIS_GENKIT_TOOL_IDS,
  toolIdFromPathBundleId,
} from '@/lib/genkit/tools/registry';
import { PATH_SEEDS } from '@/lib/path/seeds';

describe('PRAXIS Genkit tool registry', () => {
  it('registers the CX-4 starter tool set', () => {
    expect(PRAXIS_GENKIT_TOOL_IDS).toEqual(
      expect.arrayContaining([
        'escalation_monitor',
        'leverage_map',
        'actor_map',
        'scenario_tree',
        'brief_builder',
        'redline_finder',
        'needs_assessment',
        'narrative_map',
        'attribution_graph',
        'source_search',
        'claim_extract',
        'fact_check',
      ]),
    );
  });

  it('keeps every seeded path bundle backed by a registered tool', () => {
    const seededToolIds = Object.values(PATH_SEEDS).flatMap((path) => path.toolBundle);
    for (const toolId of seededToolIds) {
      expect(PRAXIS_GENKIT_PATH_TOOL_IDS).toContain(toolId);
      expect(getRegisteredToolForPathBundle(toolId)).toBeTruthy();
    }
  });

  it('filters tools to the active path bundle', () => {
    const conflictTools = getToolsForPath('conflict-path');
    expect(conflictTools).toHaveLength(PATH_SEEDS['conflict-path'].toolBundle.length);
    expect(PATH_SEEDS['conflict-path'].toolBundle.map(toolIdFromPathBundleId)).toEqual([
      'actor_map',
      'escalation_monitor',
      'scenario_tree',
    ]);
  });
});
