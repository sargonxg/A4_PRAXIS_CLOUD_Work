import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSOLIDATED_ANCHOR_TOOL_IDS,
  CONSOLIDATED_TOOLS,
  consolidatedToolForLegacyId,
  getSpecializedToolDevelopmentGroups,
} from '@/lib/constants/consolidated-tools';
import { getToolById } from '@/lib/constants/tool-registry';
import { getToolContextBlueprint } from '@/lib/tools/tool-context-blueprints';
import { hrefForTool } from '@/lib/tools/tool-navigation';
import {
  getDashboardToolPackageSummaries,
  getToolIdsForPath,
} from '@/lib/tools/tool-path-taxonomy';

describe('consolidated PRAXIS tool model', () => {
  it('keeps the primary workspace at exactly ten consolidated tools', () => {
    expect(CONSOLIDATED_TOOLS.length).toBe(10);
    expect(new Set(CONSOLIDATED_TOOLS.map((tool) => tool.id)).size).toBe(CONSOLIDATED_TOOLS.length);
    expect(CONSOLIDATED_ANCHOR_TOOL_IDS).toHaveLength(10);
  });

  it('uses registered anchor tools for status, route, and readiness checks', () => {
    for (const surface of CONSOLIDATED_TOOLS) {
      expect(surface.anchorToolId, surface.id).toBeDefined();
      const anchorToolId = surface.anchorToolId!;
      const tool = getToolById(anchorToolId);
      expect(tool, anchorToolId).toBeDefined();
      expect(tool?.aiRoute, anchorToolId).toMatch(/^\/api\//);
      expect(hrefForTool(anchorToolId), anchorToolId).toBe(surface.href);

      const pagePath = join(process.cwd(), 'src', 'app', 'app', ...surface.href.replace(/^\//, '').split('/'), 'page.tsx');
      const routePath = join(process.cwd(), 'src', 'app', ...tool!.aiRoute.replace(/^\//, '').split('/'), 'route.ts');
      expect(existsSync(pagePath), `${surface.href} page`).toBe(true);
      expect(existsSync(routePath), `${tool!.aiRoute} route`).toBe(true);

      const blueprint = getToolContextBlueprint(anchorToolId);
      expect(blueprint.database.canonicalOutputPath).toContain(anchorToolId);
      expect(blueprint.evidencePolicy.primarySources.length).toBeGreaterThan(0);
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

  it('keeps specialist tools grouped behind consolidated surfaces', () => {
    const groups = getSpecializedToolDevelopmentGroups();
    expect(groups.length).toBeGreaterThan(0);

    for (const group of groups) {
      expect(CONSOLIDATED_TOOLS.some((tool) => tool.id === group.consolidatedToolId), group.id).toBe(true);
      expect(group.userCases.length, group.id).toBeGreaterThan(0);
      expect(group.nextLiveAiUpgrade.length, group.id).toBeGreaterThan(20);
      for (const toolId of group.toolIds) {
        expect(getToolById(toolId), `${group.id}:${toolId}`).toBeDefined();
      }
    }
  });
});
