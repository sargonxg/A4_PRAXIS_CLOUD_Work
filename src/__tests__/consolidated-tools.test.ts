import { describe, expect, it } from 'vitest';
import {
  CONSOLIDATED_ANCHOR_TOOL_IDS,
  CONSOLIDATED_TOOLS,
  consolidatedToolForLegacyId,
} from '@/lib/constants/consolidated-tools';
import { getToolById } from '@/lib/constants/tool-registry';
import {
  getDashboardToolPackageSummaries,
  getToolIdsForPath,
} from '@/lib/tools/tool-path-taxonomy';

describe('consolidated PRAXIS tool model', () => {
  it('keeps the primary workspace at ten tools or fewer', () => {
    expect(CONSOLIDATED_TOOLS.length).toBeLessThanOrEqual(10);
    expect(new Set(CONSOLIDATED_TOOLS.map((tool) => tool.id)).size).toBe(CONSOLIDATED_TOOLS.length);
  });

  it('uses registered anchor tools for status, route, and readiness checks', () => {
    for (const toolId of CONSOLIDATED_ANCHOR_TOOL_IDS) {
      expect(getToolById(toolId), toolId).toBeDefined();
    }
  });

  it('maps legacy specialist pages into consolidated user-facing surfaces', () => {
    expect(consolidatedToolForLegacyId('deep-search-agent')?.id).toBe('research-sources');
    expect(consolidatedToolForLegacyId('argus')?.id).toBe('research-sources');
    expect(consolidatedToolForLegacyId('policy-memo')?.id).toBe('briefing-studio');
    expect(consolidatedToolForLegacyId('talking-points')?.id).toBe('briefing-studio');
    expect(consolidatedToolForLegacyId('legal-tracker')?.id).toBe('briefing-studio');
    expect(consolidatedToolForLegacyId('dialectica')?.id).toBe('graphops');
  });

  it('keeps active package defaults focused on the consolidated anchors', () => {
    const activeIds = getToolIdsForPath('generic-core', ['primary']);
    expect(activeIds).toEqual(CONSOLIDATED_ANCHOR_TOOL_IDS);

    const packages = getDashboardToolPackageSummaries('political-officer');
    const activePackages = packages.filter((pkg) => pkg.stage === 'active');
    expect(activePackages.length).toBeGreaterThan(0);
    expect(activePackages.every((pkg) => pkg.primaryToolIds.length <= 10)).toBe(true);
  });
});
