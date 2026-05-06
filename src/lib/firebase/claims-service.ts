import { createHash } from 'node:crypto';

export type ClaimGroundingStatus = 'source_grounded' | 'inferred' | 'unverified';

export interface ClaimTrustRecord {
  id: string;
  uid: string;
  situationId: string;
  text: string;
  trustScore: number;
  groundingStatus: ClaimGroundingStatus;
  emittedBy: string;
  toolRunId: string | null;
  route: string | null;
  reasons: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimTrustInput {
  uid: string;
  situationId: string;
  claim: {
    text: string;
    trustScore?: number;
    groundingStatus?: ClaimGroundingStatus;
    emittedBy: string;
    toolRunId?: string | null;
    route?: string | null;
    reasons?: string[];
  };
}

export interface ClaimTrustWriter {
  setClaim(uid: string, situationId: string, claimId: string, record: ClaimTrustRecord): Promise<void>;
}

export function computeClaimTrustScore(input: {
  groundingStatus: ClaimGroundingStatus;
  sourceCount?: number;
  confidence?: number;
  recencyDays?: number;
}): number {
  const base = input.groundingStatus === 'source_grounded' ? 74 : input.groundingStatus === 'inferred' ? 56 : 32;
  const sourceBoost = Math.min((input.sourceCount ?? 0) * 5, 15);
  const confidenceBoost = Math.round(Math.max(0, Math.min(1, input.confidence ?? 0.5)) * 10);
  const recencyPenalty = Math.min(Math.floor((input.recencyDays ?? 0) / 30), 10);
  return Math.max(0, Math.min(100, base + sourceBoost + confidenceBoost - recencyPenalty));
}

export function claimTrustId(uid: string, situationId: string, emittedBy: string, text: string): string {
  return createHash('sha256')
    .update(`${uid}:${situationId}:${emittedBy}:${text.replace(/\s+/g, ' ').trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 32);
}

export function buildClaimTrustRecord(input: ClaimTrustInput): ClaimTrustRecord {
  const groundingStatus = input.claim.groundingStatus ?? 'unverified';
  const trustScore = input.claim.trustScore ?? computeClaimTrustScore({ groundingStatus });
  const now = new Date().toISOString();
  const text = input.claim.text.replace(/\s+/g, ' ').trim();
  return {
    id: claimTrustId(input.uid, input.situationId, input.claim.emittedBy, text),
    uid: input.uid,
    situationId: input.situationId,
    text,
    trustScore,
    groundingStatus,
    emittedBy: input.claim.emittedBy,
    toolRunId: input.claim.toolRunId ?? null,
    route: input.claim.route ?? null,
    reasons: input.claim.reasons ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

const firestoreClaimTrustWriter: ClaimTrustWriter = {
  async setClaim(uid, situationId, claimId, record) {
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    const db = getAdminDbOrThrow();
    await db
      .collection('users')
      .doc(uid)
      .collection('situations')
      .doc(situationId)
      .collection('claims')
      .doc(claimId)
      .set(record, { merge: true });
  },
};

export async function persistClaimTrust(
  input: ClaimTrustInput,
  writer: ClaimTrustWriter = firestoreClaimTrustWriter,
): Promise<{ persisted: boolean; claimId: string; reason?: string }> {
  const record = buildClaimTrustRecord(input);
  if (!record.text) return { persisted: false, claimId: record.id, reason: 'empty_claim' };
  await writer.setClaim(input.uid, input.situationId, record.id, record);
  return { persisted: true, claimId: record.id };
}
