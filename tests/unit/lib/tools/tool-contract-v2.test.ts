import { describe, expect, it } from 'vitest';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { rankMarketplaceToolsForCase } from '@/lib/tools/marketplace/suggestions';
import { userCaseModule } from '../../../fixtures/user-case-module';

describe('tool contract v2', () => {
  it('migrates every marketplace tool to context-aware v2', () => {
    for (const tool of MARKETPLACE_TOOLS) {
      expect(tool.version).toMatch(/^2\./);
      expect(tool.contextSpec.graceful).toBe(true);
      expect(tool.subagentDeps).toContain('context-preparer');
      expect(tool.skill.file).toMatch(/^skills\/tools\/.+\/SKILL\.md$/);
    }
  });

  it('ranks tools for the active case context', () => {
    const suggestions = rankMarketplaceToolsForCase(MARKETPLACE_TOOLS, userCaseModule).slice(0, 3);
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].score).toBeGreaterThanOrEqual(suggestions[1].score);
    expect(suggestions[0].rationale).toContain('context');
  });
});
