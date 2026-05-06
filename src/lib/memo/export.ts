import type { MemoBlock, MemoTemplateId, MemoVersion } from '@/types/memo';

export interface MemoExportInput {
  memoId: string;
  templateId: MemoTemplateId;
  title: string;
  authorUid: string;
  graphSnapshotId: string;
  blocks: MemoBlock[];
  previousVersions?: MemoVersion[];
  changeNote?: string;
  createdAt?: string;
}

export function createMemoVersion(input: MemoExportInput): MemoVersion {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const versionNumber = (input.previousVersions?.at(-1)?.versionNumber ?? 0) + 1;
  return {
    id: `${input.memoId}-v${versionNumber}`,
    memoId: input.memoId,
    versionNumber,
    authorUid: input.authorUid,
    createdAt,
    graphSnapshotId: input.graphSnapshotId,
    blocks: input.blocks,
    changeNote: input.changeNote,
  };
}

export function memoBlocksToMarkdown(title: string, blocks: MemoBlock[]): string {
  const footnotes = collectFootnotes(blocks);
  const lines = [`# ${title}`, ''];

  for (const block of blocks) {
    const citation = citationMarker(block, footnotes);
    if (block.type === 'heading') {
      lines.push(`## ${block.content}${citation}`, '');
    } else if (block.type === 'bullets') {
      if (block.title) lines.push(`### ${block.title}${citation}`);
      for (const item of block.items ?? []) lines.push(`- ${item}`);
      lines.push('');
    } else if (block.type === 'quote') {
      lines.push(`> ${block.content}${citation}`, '');
    } else if (block.type === 'divider') {
      lines.push('---', '');
    } else {
      if (block.title) lines.push(`### ${block.title}`);
      lines.push(`${block.content}${citation}`, '');
    }
  }

  if (footnotes.length > 0) {
    lines.push('## Citations', '');
    for (const footnote of footnotes) lines.push(`[^${footnote.index}]: ${footnote.label}`);
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export function memoBlocksToPlainText(title: string, blocks: MemoBlock[]): string {
  return memoBlocksToMarkdown(title, blocks)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\[\^\d+\]:\s+/gm, 'Citation: ')
    .replace(/\[\^\d+\]/g, '');
}

export function collectFootnotes(blocks: MemoBlock[]): Array<{ index: number; label: string }> {
  const labels: string[] = [];
  for (const block of blocks) {
    for (const citation of block.citations) {
      const parts = [
        ...citation.nodeIds.map((id) => `node:${id}`),
        ...citation.sourceReceiptIds.map((id) => `source:${id}`),
      ];
      if (parts.length === 0) continue;
      const label = parts.join(', ');
      if (!labels.includes(label)) labels.push(label);
    }
  }
  return labels.map((label, index) => ({ index: index + 1, label }));
}

function citationMarker(block: MemoBlock, footnotes: Array<{ index: number; label: string }>): string {
  const blockLabels = collectFootnotes([block]).map((item) => item.label);
  if (blockLabels.length === 0) return '';
  return blockLabels
    .map((label) => footnotes.find((item) => item.label === label)?.index)
    .filter((index): index is number => typeof index === 'number')
    .map((index) => `[^${index}]`)
    .join('');
}
