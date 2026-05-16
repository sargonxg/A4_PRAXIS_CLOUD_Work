import { describe, expect, it } from 'vitest';
import { buildMemoBlocksForCase, listMemoTemplates } from '@/lib/memo/templates/registry';
import { userCaseModule } from '../../../fixtures/user-case-module';

describe('memo templates', () => {
  it('ships the six launch memo templates', () => {
    expect(listMemoTemplates().map((template) => template.id)).toEqual([
      'mandate-brief',
      'mediation-summary',
      'policy-memo',
      'sit-rep',
      'frame-analysis',
      'talking-points',
    ]);
  });

  it('auto-populates cited blocks from the active case', () => {
    for (const template of listMemoTemplates()) {
      const blocks = buildMemoBlocksForCase(userCaseModule, template.id);
      expect(blocks.length).toBeGreaterThan(2);
      expect(blocks.some((block) => block.citations.some((citation) => citation.sourceReceiptIds.length > 0))).toBe(true);
    }
  });
});
