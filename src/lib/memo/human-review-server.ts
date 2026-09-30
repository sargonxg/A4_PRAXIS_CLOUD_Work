import { signCookie, verifyCookie } from '@/lib/auth/cookie-signer';
import { normalizeMemoHumanApproval, type MemoHumanApproval } from '@/lib/memo/human-review';

function approvalPayload(fields: Omit<MemoHumanApproval, 'attestation'>): string {
  return `praxis-memo-human-review:v1:${JSON.stringify({ version: fields.version, memoId: fields.memoId,
    versionId: fields.versionId, reviewerUid: fields.reviewerUid, bodyHash: fields.bodyHash,
    approvedAt: fields.approvedAt, intendedUse: fields.intendedUse, limitations: fields.limitations })}`;
}

export function signMemoHumanApproval(fields: Omit<MemoHumanApproval, 'attestation' | 'version'>): MemoHumanApproval {
  const approval = { version: 1 as const, ...fields };
  return { ...approval, attestation: signCookie(approvalPayload(approval)) };
}

export function verifyMemoHumanApproval(value: unknown): MemoHumanApproval | null {
  const approval = normalizeMemoHumanApproval(value);
  return approval && verifyCookie(approval.attestation) === approvalPayload(approval) ? approval : null;
}
