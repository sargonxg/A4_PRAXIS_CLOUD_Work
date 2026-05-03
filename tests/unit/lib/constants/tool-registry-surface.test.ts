import { describe, expect, it } from 'vitest';
import { HERO_TOOLS, TOOL_REGISTRY } from '@/lib/constants/tool-registry';

const EXPECTED_HERO_IDS = [
  'dashboard',
  'context-builder',
  'situation-intelligence',
  'source-scout',
  'conflict-graph',
  'graphops',
  'brainstorming-table',
  'briefing',
  'policy-memo',
  'scenarios',
  'negotiation-prep',
  'treaty-analyzer',
];

describe('tool registry surface policy', () => {
  it('keeps exactly 12 hero tools', () => {
    expect(HERO_TOOLS).toHaveLength(EXPECTED_HERO_IDS.length);
    expect(new Set(HERO_TOOLS.map((tool) => tool.id))).toEqual(new Set(EXPECTED_HERO_IDS));
  });

  it('marks every non-hero tool as archived and hidden by default', () => {
    const heroIds = new Set(EXPECTED_HERO_IDS);

    for (const tool of TOOL_REGISTRY) {
      expect(tool.surface).toMatch(/^(hero|archive|admin)$/);
      expect(typeof tool.visible).toBe('boolean');

      if (heroIds.has(tool.id)) {
        expect(tool.surface).toBe('hero');
        expect(tool.visible).toBe(true);
      } else {
        expect(tool.surface).toBe('archive');
        expect(tool.visible).toBe(false);
      }
    }
  });
});
