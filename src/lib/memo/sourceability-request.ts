import type { GenkitSourceabilityInput, GenkitSourceabilityOutput } from '@/lib/genkit/schemas/sourceability';
import { outputTargetRequiresSourceability } from '@/lib/policy-work-file/output-targets';
import { normalizeMemoOutputReview, type MemoOutputReviewReceipt } from '@/lib/memo/output-review';
import { isCurrentMemoHumanApproval, normalizeMemoHumanApproval, type MemoHumanApproval } from '@/lib/memo/human-review';

export type MemoSourceabilityRequest = GenkitSourceabilityInput & {
  memoId?: string;
  paragraphId?: string;
  outputTarget?: string;
};

export type MemoSourceabilityResult = GenkitSourceabilityOutput & {
  checkedText?: string;
};

export type MemoExportReadiness = {
  ready: boolean;
  required: boolean;
  label: string;
  detail: string;
};

type MemoSourceSnippet = MemoSourceabilityRequest['sourceSnippets'][number];

export function sourceSnippetsFromMemoReceipts(
  sourceReceipts: Array<Record<string, unknown>>,
): MemoSourceabilityRequest['sourceSnippets'] {
  return sourceReceipts
    .map((receipt, index): MemoSourceSnippet | null => {
      const id = stringField(receipt.sourceReceiptId)
        ?? stringField(receipt.id)
        ?? stringField(receipt.url)
        ?? `source-${index + 1}`;
      const title = stringField(receipt.title)
        ?? stringField(receipt.label)
        ?? stringField(receipt.source)
        ?? `Source ${index + 1}`;
      const span = stringField(receipt.quotePreview)
        ?? stringField(receipt.excerpt)
        ?? stringField(receipt.span)
        ?? stringField(receipt.text)
        ?? stringField(receipt.body)
        ?? stringField(receipt.summary)
        ?? '';
      if (!span) return null;
      const url = stringField(receipt.url);
      const date = stringField(receipt.date) ?? stringField(receipt.publishedAt);
      return {
        id,
        title,
        span,
        ...(url ? { url } : {}),
        ...(date ? { date } : {}),
      };
    })
    .filter((item): item is MemoSourceSnippet => Boolean(item))
    .slice(0, 20);
}

export function selectedMemoParagraph(body: string, selectionStart: number, selectionEnd: number): string {
  const normalized = body.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  const start = clampIndex(selectionStart, normalized.length);
  const end = clampIndex(selectionEnd, normalized.length);
  if (end > start) return normalizeText(normalized.slice(start, end));

  let cursor = 0;
  for (const part of normalized.split(/\n\s*\n/g)) {
    const segmentStart = normalized.indexOf(part, cursor);
    const segmentEnd = segmentStart + part.length;
    cursor = segmentEnd;
    if (start >= segmentStart && start <= segmentEnd) return normalizeText(part);
  }
  return normalizeText(normalized.slice(0, 1200));
}

export function buildMemoSourceabilityRequest(input: {
  memoId?: string | null;
  paragraphId?: string | null;
  selectedText?: string | null;
  memoBody: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  sourceSnippets?: MemoSourceabilityRequest['sourceSnippets'];
  sourceReceipts: Array<Record<string, unknown>>;
  capsuleId?: string | null;
  situationId?: string | null;
  outputTarget?: string | null;
}): MemoSourceabilityRequest {
  const selectionStart = input.selectionStart ?? 0;
  const selectionEnd = input.selectionEnd ?? selectionStart;
  const memoParagraph = normalizeText(
    input.selectedText
      || selectedMemoParagraph(input.memoBody, selectionStart, selectionEnd)
      || input.memoBody.slice(0, 1200),
  );
  const claimText = normalizeText(input.selectedText || memoParagraph);

  return stripUndefined({
    memoId: cleanId(input.memoId),
    paragraphId: cleanId(input.paragraphId),
    claimText,
    memoParagraph,
    sourceSnippets: input.sourceSnippets ?? sourceSnippetsFromMemoReceipts(input.sourceReceipts),
    capsuleId: cleanId(input.capsuleId),
    situationId: cleanId(input.situationId),
    outputTarget: cleanId(input.outputTarget),
  });
}

export function memoExportReadiness(input: {
  outputTarget?: string | null;
  sourceabilityResult?: MemoSourceabilityResult | null;
  outputReview?: MemoOutputReviewReceipt | null;
  bodyHash?: string | null;
  humanApproval?: MemoHumanApproval | null;
  memoId?: string | null;
  versionId?: string | null;
}): MemoExportReadiness {
  const required = outputTargetRequiresSourceability(input.outputTarget);
  if (isCurrentMemoHumanApproval(input.humanApproval, input)) {
    const approval = normalizeMemoHumanApproval(input.humanApproval)!;
    return { ready: true, required: true, label: `Reviewed for ${approval.intendedUse.replace(/-/g, ' ')}`,
      detail: `Human review recorded for this saved version. ${approval.limitations || 'The reviewer recorded no additional limitations.'} This is not an independent accuracy certification.` };
  }
  // A selected-claim sourceability result never approves the generated body.
  if (Object.prototype.hasOwnProperty.call(input, 'outputReview')) {
    const review = normalizeMemoOutputReview(input.outputReview);
    if (!review || !input.bodyHash) {
      return { ready: false, required: true, label: 'Draft review needed',
        detail: 'Whole-draft review is required before export-ready use.' };
    }
    if (input.bodyHash !== review.bodyHash) {
      return { ready: false, required: true, label: 'Draft review outdated',
        detail: 'The primary draft changed after this receipt. Review the edited draft before export-ready use.' };
    }
    if (review.reviewRequired || !review.exportReady) {
      return { ready: false, required: true, label: 'Draft review needed',
        detail: review.verifierStatus !== 'checked'
          ? 'Generated-body verification is unavailable or disabled. Whole-draft review is required.'
          : `${review.findingCount} generated-body review finding(s). Review the whole draft and apply feedback before export-ready use.` };
    }
  }
  const status = input.sourceabilityResult?.status ?? null;
  if (!status) {
    return required
      ? { ready: false, required, label: 'Sourceability needed', detail: 'Run sourceability before export-ready use.' }
      : { ready: true, required, label: 'Review optional', detail: 'This target does not require sourceability before export.' };
  }
  if (status === 'supported') {
    return { ready: true, required, label: 'Sourceability passed', detail: 'Checked claim is supported by the attached snippets.' };
  }
  if (status === 'needs_date_check') {
    return { ready: false, required, label: 'Date check needed', detail: 'Resolve date freshness before export-ready use.' };
  }
  if (status === 'weak') {
    return { ready: false, required, label: 'Weak support', detail: 'Strengthen support or use the cautious rewrite before export.' };
  }
  return { ready: false, required, label: 'Unsupported claims', detail: 'Resolve unsupported claims before export-ready use.' };
}

export function sourceabilityEvidenceGapsFromResult(result: MemoSourceabilityResult | null | undefined): string[] {
  if (!result) return [];
  return uniqueStrings([
    result.checkedText ? `Checked claim: ${result.checkedText}` : null,
    ...result.missingEvidence.map((item) => `Missing evidence: ${item}`),
    ...result.citationWarnings.map((item) => `Citation warning: ${item}`),
    result.status === 'needs_date_check' ? 'Date check required before export-ready use.' : null,
    result.status === 'unsupported' ? 'Unsupported claim requires replacement, removal, or new evidence.' : null,
    result.status === 'weak' ? 'Weakly supported claim should be rewritten or backed by stronger evidence.' : null,
  ]);
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? normalizeText(value) : null;
}

function cleanId(value: string | null | undefined): string | undefined {
  const clean = value?.trim();
  return clean || undefined;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function clampIndex(value: number, length: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(length, Math.floor(value)));
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}
