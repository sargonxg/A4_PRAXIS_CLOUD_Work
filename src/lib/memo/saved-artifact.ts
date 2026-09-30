import { normalizeMemoHumanApproval, type MemoHumanApproval } from '@/lib/memo/human-review';

export interface SavedMemoReviewState {
  currentVersionId: string | null;
  savedBody: string | null;
  savedTitle: string | null;
  humanApproval: MemoHumanApproval | null;
}

/** Only the server-named current version establishes a saved review boundary. */
export function savedMemoReviewState(payload: unknown): SavedMemoReviewState {
  const root = record(payload);
  const memo = record(root?.memo);
  const currentVersionId = string(memo?.currentVersionId);
  const versions = Array.isArray(root?.versions) ? root.versions : [];
  const version = versions.map(record).find((item) => item?.id === currentVersionId);
  const blocks = Array.isArray(version?.blocks) ? version.blocks.map(record).filter((item) => item !== null) : null;
  const primary = blocks?.find((block) => ['live-memo-draft', 'memo-body', 'artifact-body'].includes(String(block.id)));
  // Keep this body boundary aligned with memo-service.primaryMemoBody; no server imports in the browser.
  const savedBody = blocks ? typeof primary?.content === 'string' ? primary.content : blocks
    .filter((block) => !/critique|audit|receipt|ledger-summary/.test(String(block.id)))
    .map((block) => typeof block.content === 'string' && block.content ? block.content
      : Array.isArray(block.items) ? block.items.filter((item) => typeof item === 'string').join('\n') : '')
    .join('\n\n') : null;
  return {
    currentVersionId,
    savedBody,
    savedTitle: string(memo?.title),
    humanApproval: savedBody === null ? null : normalizeMemoHumanApproval(memo?.humanApproval),
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function string(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
