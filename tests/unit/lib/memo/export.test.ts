import { describe, expect, it } from 'vitest';
import { createMemoVersion, memoBlocksToMarkdown } from '@/lib/memo/export';
import type { MemoBlock } from '@/types/memo';

const blocks: MemoBlock[] = [
  {
    id: 'title',
    type: 'heading',
    content: 'Policy memo',
    citations: [],
    metadata: {},
  },
  {
    id: 'basis',
    type: 'paragraph',
    content: 'The evidence base is bounded.',
    citations: [{ nodeIds: ['claim-1'], sourceReceiptIds: ['receipt-1'], surface: 'footnote' }],
    metadata: {},
  },
  {
    id: 'actions',
    type: 'bullets',
    title: 'Actions',
    content: '',
    items: ['Name uncertainty', 'Preserve receipts'],
    citations: [],
    metadata: {},
  },
];

describe('memo export helpers', () => {
  it('renders deterministic Markdown with citations', () => {
    expect(memoBlocksToMarkdown('Draft', blocks)).toContain('[^1]: node:claim-1, source:receipt-1');
    expect(memoBlocksToMarkdown('Draft', blocks)).toContain('- Preserve receipts');
  });

  it('creates monotonic memo versions', () => {
    const first = createMemoVersion({
      memoId: 'memo-1',
      templateId: 'policy-memo',
      title: 'Draft',
      authorUid: 'user-1',
      graphSnapshotId: 'case-1:snapshot',
      blocks,
      createdAt: '2026-05-06T00:00:00.000Z',
    });
    const second = createMemoVersion({
      memoId: 'memo-1',
      templateId: 'policy-memo',
      title: 'Draft',
      authorUid: 'user-1',
      graphSnapshotId: 'case-1:snapshot',
      blocks,
      previousVersions: [first],
      createdAt: '2026-05-06T00:01:00.000Z',
    });
    expect(first.versionNumber).toBe(1);
    expect(second.versionNumber).toBe(2);
    expect(second.id).toBe('memo-1-v2');
  });
});
