export type MemoReviewUse = 'internal-analysis' | 'external-sharing' | 'publication';

export type MemoHumanApproval = {
  version: 1;
  memoId: string;
  versionId: string;
  reviewerUid: string;
  bodyHash: string;
  approvedAt: string;
  intendedUse: MemoReviewUse;
  limitations: string;
  attestation: string;
};

export function normalizeMemoHumanApproval(value: unknown): MemoHumanApproval | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !['internal-analysis', 'external-sharing', 'publication'].includes(String(record.intendedUse))) return null;
  const fields = ['memoId', 'versionId', 'reviewerUid', 'bodyHash', 'approvedAt', 'limitations', 'attestation'] as const;
  if (fields.some((field) => typeof record[field] !== 'string')) return null;
  if (!String(record.memoId).trim() || !String(record.versionId).trim() || !String(record.reviewerUid).trim()
    || !/^sha256:[a-f0-9]{64}$/.test(String(record.bodyHash)) || !Number.isFinite(Date.parse(String(record.approvedAt)))
    || !String(record.attestation).trim() || String(record.limitations).length > 4000) return null;
  return { version: 1, memoId: String(record.memoId), versionId: String(record.versionId), reviewerUid: String(record.reviewerUid),
    bodyHash: String(record.bodyHash), approvedAt: String(record.approvedAt), intendedUse: record.intendedUse as MemoReviewUse,
    limitations: String(record.limitations), attestation: String(record.attestation) };
}

/** Browser display predicate. Server export additionally validates the signature. */
export function isCurrentMemoHumanApproval(value: unknown, input: {
  memoId?: string | null; versionId?: string | null; bodyHash?: string | null;
}): boolean {
  const approval = normalizeMemoHumanApproval(value);
  return Boolean(approval && input.memoId === approval.memoId && input.versionId === approval.versionId && input.bodyHash === approval.bodyHash);
}
