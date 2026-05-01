import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TOOL_PATH_IDS,
  getActiveToolPaths,
  getRecommendedToolIdsForWorkflowPath,
  getDashboardToolPackageSummaries,
  getToolPathPackageSummary,
  getToolIdsForPath,
  getToolPath,
  getToolPathMembership,
  isToolInActiveGenericOrPoliticalPath,
  TOOL_PATHS,
} from '@/lib/tools/tool-path-taxonomy';

describe('tool path taxonomy', () => {
  it('codifies generic core plus the ten policy workflow paths', () => {
    expect(TOOL_PATHS).toHaveLength(11);
    expect(getToolPath('generic-core')?.stage).toBe('active');
    expect(getToolPath('political-officer')?.label).toBe('Conflict / Political Analyst');
    expect(ACTIVE_TOOL_PATH_IDS).toEqual(['generic-core', 'political-officer']);
    expect(getActiveToolPaths().map((path) => path.id)).toEqual(['generic-core', 'political-officer']);
    expect(getToolPath('generic-core')?.coreToolIds).toContain('graphops');
  });

  it('prioritizes generic and conflict/political tools for the active sprint', () => {
    const politicalTools = getToolIdsForPath('political-officer');
    expect(politicalTools).toContain('source-scout');
    expect(politicalTools).toContain('risk-monitor');
    expect(politicalTools).toContain('policy-memo');
    expect(politicalTools).toContain('deep-search-agent');
    expect(isToolInActiveGenericOrPoliticalPath('conflict-graph')).toBe(true);
    expect(isToolInActiveGenericOrPoliticalPath('peacebuilding-index')).toBe(false);
  });

  it('records path membership per tool', () => {
    const memberships = getToolPathMembership('policy-memo');
    expect(memberships.some((membership) => membership.pathId === 'political-officer')).toBe(true);
    expect(memberships.some((membership) => membership.pathId === 'generic-core')).toBe(true);
  });

  it('returns path-first recommendations for selected workflow paths', () => {
    expect(getRecommendedToolIdsForWorkflowPath('political-officer', 5)).toEqual([
      'dashboard',
      'assistant',
      'source-scout',
      'documents',
      'graphops',
    ]);
  });

  it('summarizes dashboard packages with core, active, next, and future paths', () => {
    const core = getToolPathPackageSummary('generic-core');
    expect(core?.statusLabel).toBe('Active now');
    expect(core?.deliverables).toContain('Document-derived graph');

    const packages = getDashboardToolPackageSummaries('political-officer');
    expect(packages[0]?.id).toBe('generic-core');
    expect(packages[1]?.id).toBe('political-officer');
    expect(packages.some((pkg) => pkg.stage === 'next')).toBe(true);
    expect(packages.some((pkg) => pkg.stage === 'future')).toBe(true);
  });
});
