import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TOOL_PATH_IDS,
  getActiveToolPaths,
  getRecommendedToolIdsForWorkflowPath,
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
  });

  it('prioritizes generic and conflict/political tools for the active sprint', () => {
    const politicalTools = getToolIdsForPath('political-officer');
    expect(politicalTools).toContain('early-warning');
    expect(politicalTools).toContain('risk-monitor');
    expect(politicalTools).toContain('policy-memo');
    expect(politicalTools).toContain('deep-search-agent');
    expect(isToolInActiveGenericOrPoliticalPath('conflict-graph')).toBe(true);
    expect(isToolInActiveGenericOrPoliticalPath('peacebuilding-index')).toBe(true);
  });

  it('records path membership per tool', () => {
    const memberships = getToolPathMembership('policy-memo');
    expect(memberships.some((membership) => membership.pathId === 'political-officer')).toBe(true);
    expect(memberships.some((membership) => membership.pathId === 'generic-core')).toBe(false);
  });

  it('returns path-first recommendations for selected workflow paths', () => {
    expect(getRecommendedToolIdsForWorkflowPath('political-officer', 5)).toEqual([
      'early-warning',
      'risk-monitor',
      'actor-profiles',
      'stakeholder-map',
      'geospatial-monitor',
    ]);
  });
});
