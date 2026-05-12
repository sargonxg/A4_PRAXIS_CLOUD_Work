import { describe, expect, it } from 'vitest';
import {
  buildReasoningSpineSummary,
  stableFingerprint,
} from '@/lib/reasoning/reasoning-spine';
import type { DraftMemoOption } from '@/lib/workbench/draft-assembly-state';

const memo: DraftMemoOption = {
  id: 'case-policy-memo',
  templateId: 'policy-memo',
  title: 'Policy Memo',
  description: 'A decision memo.',
  versionLabel: 'Prepared from active graph',
  citationCount: 1,
  blocks: [
    {
      id: 'bluf',
      type: 'paragraph',
      title: 'BLUF',
      content: 'This is a cited policy judgment with enough text to estimate tokens.',
      items: [],
      citations: [{ nodeIds: ['n2', 'n1'], sourceReceiptIds: ['s1'], surface: 'footnote' }],
      metadata: {},
    },
  ],
};

describe('reasoning spine', () => {
  it('builds a stable fingerprint for permuted object keys', () => {
    expect(stableFingerprint({ b: 2, a: 1 })).toBe(stableFingerprint({ a: 1, b: 2 }));
  });

  it('summarizes the selected draft context without live observability overclaiming', () => {
    const summary = buildReasoningSpineSummary({
      caseId: 'case-1',
      selectedMemos: [memo],
      selectedAppendices: [{ id: 'graph:case-1', kind: 'graph', label: 'Graph', description: 'Graph snapshot' }],
      primaryMemoId: memo.id,
      settings: {
        audience: 'internal',
        format: 'markdown',
        embedAuditManifest: true,
        embedC2pa: true,
      },
    });

    expect(summary.contextFingerprint).toMatch(/^[a-f0-9]{16}$/);
    expect(summary.posture).toBe('ready');
    expect(summary.citationCount).toBe(1);
    expect(summary.graphReferenceCount).toBe(2);
    expect(summary.sourceReceiptCount).toBe(1);
    expect(summary.checkpoints.find((checkpoint) => checkpoint.id === 'observability')?.status).toBe('queued');
  });
});
