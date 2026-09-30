import type { AgentContextGroundingReport } from '@/lib/context/agent-context-verifier';

export interface MemoOutputReviewFinding {
  text: string;
  reason: string;
  start: number;
  end: number;
  claimCardIds: string[];
  sourceReceiptIds: string[];
  graphPathIds: string[];
}

export interface MemoOutputReviewReceipt {
  version: 1;
  scope: 'generated_memo_body';
  bodyHash: string;
  verifierStatus: 'checked' | 'unavailable' | 'disabled';
  groundedSpanCount: number;
  ungroundedSpanCount: number;
  contradictedSpanCount: number;
  totalSpanCount: number;
  findingCount: number;
  findings: MemoOutputReviewFinding[];
  reviewRequired: boolean;
  exportReady: boolean;
  critiqueApplied: false;
}

/** Binds server and browser review to the primary body, excluding audit blocks. */
export async function memoOutputBodyHash(body: string): Promise<string> {
  const bytes = new TextEncoder().encode(body.replace(/\r\n/g, '\n').trim());
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function buildMemoOutputReview(input: {
  body: string;
  report: AgentContextGroundingReport | null;
  verifierStatus: MemoOutputReviewReceipt['verifierStatus'];
}): Promise<MemoOutputReviewReceipt> {
  const report = input.verifierStatus === 'checked' ? input.report : null;
  const verifierStatus = input.verifierStatus === 'checked' && !report ? 'unavailable' : input.verifierStatus;
  const groundedSpanCount = report?.groundedClaims.length ?? 0;
  const ungroundedSpanCount = report?.ungroundedSpans.length ?? 0;
  const contradictedSpanCount = report?.contradictedSpans.length ?? 0;
  const totalSpanCount = groundedSpanCount + ungroundedSpanCount + contradictedSpanCount;
  const findings = [...(report?.ungroundedSpans ?? []), ...(report?.contradictedSpans ?? [])]
    .map((finding) => ({ ...finding, claimCardIds: [...finding.claimCardIds],
      sourceReceiptIds: [...finding.sourceReceiptIds], graphPathIds: [...finding.graphPathIds] }));
  // Grounding is diagnostic. It cannot approve categories, attributions, or
  // publishability, and this lane has no body-bound human approval operation.
  const exportReady = false;
  return { version: 1, scope: 'generated_memo_body', bodyHash: await memoOutputBodyHash(input.body),
    verifierStatus, groundedSpanCount, ungroundedSpanCount, contradictedSpanCount, totalSpanCount,
    findingCount: findings.length, findings, reviewRequired: !exportReady, exportReady, critiqueApplied: false };
}

/** Rejects malformed persisted receipts and never trusts a stored green override. */
export function normalizeMemoOutputReview(value: unknown): MemoOutputReviewReceipt | null {
  if (!isRecord(value) || value.version !== 1 || value.scope !== 'generated_memo_body'
    || typeof value.bodyHash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value.bodyHash)
    || !['checked', 'unavailable', 'disabled'].includes(String(value.verifierStatus))
    || value.critiqueApplied !== false || typeof value.reviewRequired !== 'boolean' || typeof value.exportReady !== 'boolean') return null;
  const countKeys = ['groundedSpanCount', 'ungroundedSpanCount', 'contradictedSpanCount', 'totalSpanCount', 'findingCount'] as const;
  if (countKeys.some((key) => !isCount(value[key])) || !Array.isArray(value.findings)) return null;
  const counts = Object.fromEntries(countKeys.map((key) => [key, value[key]])) as Pick<MemoOutputReviewReceipt, typeof countKeys[number]>;
  const findings: MemoOutputReviewFinding[] = [];
  for (const finding of value.findings) {
    if (!isRecord(finding) || typeof finding.text !== 'string' || typeof finding.reason !== 'string' || !finding.reason
      || !isCount(finding.start) || !isCount(finding.end) || finding.end < finding.start
      || !isStringArray(finding.claimCardIds) || !isStringArray(finding.sourceReceiptIds) || !isStringArray(finding.graphPathIds)) return null;
    findings.push({ text: finding.text, reason: finding.reason, start: finding.start, end: finding.end,
      claimCardIds: [...finding.claimCardIds], sourceReceiptIds: [...finding.sourceReceiptIds], graphPathIds: [...finding.graphPathIds] });
  }
  if (counts.totalSpanCount !== counts.groundedSpanCount + counts.ungroundedSpanCount + counts.contradictedSpanCount
    || counts.findingCount !== counts.ungroundedSpanCount + counts.contradictedSpanCount
    || counts.findingCount !== findings.length) return null;
  const verifierStatus = value.verifierStatus as MemoOutputReviewReceipt['verifierStatus'];
  const exportReady = false;
  return { version: 1, scope: 'generated_memo_body', bodyHash: value.bodyHash, verifierStatus, ...counts,
    findings, reviewRequired: !exportReady, exportReady, critiqueApplied: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
