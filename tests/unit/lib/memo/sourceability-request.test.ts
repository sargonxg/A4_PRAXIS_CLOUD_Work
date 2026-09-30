import { describe, expect, it } from 'vitest';
import { buildMemoOutputReview, memoOutputBodyHash } from '@/lib/memo/output-review';

import {
  buildMemoSourceabilityRequest,
  memoExportReadiness,
  selectedMemoParagraph,
  sourceabilityEvidenceGapsFromResult,
  sourceSnippetsFromMemoReceipts,
} from '@/lib/memo/sourceability-request';

describe('memo sourceability request helpers', () => {
  const receipts = [
    {
      id: 'receipt-1',
      title: 'Committee minutes',
      url: 'https://example.test/minutes',
      quotePreview: 'The committee approved the policy on 4 May 2026.',
      sourceReceiptId: 'receipt-1',
    },
    {
      id: 'receipt-2',
      label: 'Uploaded Document',
      excerpt: 'The remote-work pilot applied only to the policy division.',
    },
  ];

  it('turns preserved source receipts into explicit snippets only', () => {
    expect(sourceSnippetsFromMemoReceipts(receipts)).toEqual([
      {
        id: 'receipt-1',
        title: 'Committee minutes',
        url: 'https://example.test/minutes',
        span: 'The committee approved the policy on 4 May 2026.',
      },
      {
        id: 'receipt-2',
        title: 'Uploaded Document',
        span: 'The remote-work pilot applied only to the policy division.',
      },
    ]);
  });

  it('uses selected text as claimText and carries no retrieval or web-search field', () => {
    const request = buildMemoSourceabilityRequest({
      memoId: 'memo-1',
      paragraphId: 'p-4',
      selectedText: 'The policy was approved on 4 May 2026.',
      memoBody: 'Intro.\n\nThe policy was approved on 4 May 2026.\n\nConclusion.',
      sourceReceipts: receipts,
      capsuleId: 'cap-1',
      situationId: 'sit-1',
      outputTarget: 'policy-memo',
    });

    expect(request).toMatchObject({
      memoId: 'memo-1',
      paragraphId: 'p-4',
      claimText: 'The policy was approved on 4 May 2026.',
      memoParagraph: 'The policy was approved on 4 May 2026.',
      capsuleId: 'cap-1',
      situationId: 'sit-1',
      outputTarget: 'policy-memo',
    });
    expect(request.sourceSnippets).toHaveLength(2);
    expect(request).not.toHaveProperty('retrievalQuery');
    expect(request).not.toHaveProperty('webSearch');
  });

  it('falls back to the paragraph around the cursor when no text is selected', () => {
    expect(selectedMemoParagraph('First paragraph.\n\nSecond paragraph with claim.\n\nThird.', 25, 25)).toBe('Second paragraph with claim.');
  });

  it('does not let one supported selected claim clear unresolved whole-body review', async () => {
    const body = 'The budget doubled.';
    const outputReview = await buildMemoOutputReview({ body, verifierStatus: 'checked', report: {
      groundedClaims: [], ungroundedSpans: [{ text: body, start: 0, end: body.length,
        reason: 'no_packet_binding', claimCardIds: [], sourceReceiptIds: [], graphPathIds: [] }],
      contradictedSpans: [], coverageScore: 0, notes: [],
    } });
    const sourceabilityResult = { status: 'supported' as const, explanation: 'One claim is supported.',
      supportingSourceIds: ['receipt-1'], missingEvidence: [], citationWarnings: [], suggestedRewrite: '' };
    expect(memoExportReadiness({ outputTarget: 'policy-memo', outputReview,
      bodyHash: await memoOutputBodyHash(body), sourceabilityResult })).toMatchObject({ ready: false, label: 'Draft review needed' });
    expect(memoExportReadiness({ outputTarget: 'briefing-note', outputReview: null })).toMatchObject({ ready: false });
  });

  it('requires a current matching primary-body hash even after a clean review', async () => {
    const body = 'The policy was approved.';
    const outputReview = await buildMemoOutputReview({ body, verifierStatus: 'checked', report: {
      groundedClaims: [{ text: body, start: 0, end: body.length, claimCardIds: [], sourceReceiptIds: ['receipt-1'],
        graphPathIds: [], matchReasons: ['source_text_overlap'] }], ungroundedSpans: [], contradictedSpans: [], coverageScore: 1, notes: [],
    } });
    expect(memoExportReadiness({ outputTarget: 'briefing-note', outputReview })).toMatchObject({ ready: false });
    expect(memoExportReadiness({ outputTarget: 'briefing-note', outputReview,
      bodyHash: await memoOutputBodyHash('The policy was rejected.') })).toMatchObject({ ready: false, label: 'Draft review outdated' });
    expect(memoExportReadiness({ outputTarget: 'briefing-note', outputReview,
      bodyHash: await memoOutputBodyHash(body) })).toMatchObject({ ready: false, label: 'Draft review needed' });
  });

  it('turns sourceability results into export readiness and structured evidence gaps', () => {
    const result = {
      status: 'needs_date_check' as const,
      explanation: 'The claim is directionally supported but needs a current date check.',
      supportingSourceIds: ['receipt-1'],
      missingEvidence: ['Current agency update'],
      citationWarnings: ['Source is older than the memo date'],
      suggestedRewrite: 'Available evidence suggests the policy remained active as of the cited source date.',
      checkedText: 'The policy is currently active.',
    };

    expect(memoExportReadiness({ outputTarget: 'policy-memo', sourceabilityResult: result })).toMatchObject({
      ready: false,
      label: 'Date check needed',
      required: true,
    });
    expect(memoExportReadiness({ outputTarget: 'briefing-note', sourceabilityResult: null })).toMatchObject({
      ready: true,
      required: false,
    });
    expect(sourceabilityEvidenceGapsFromResult(result)).toEqual([
      'Checked claim: The policy is currently active.',
      'Missing evidence: Current agency update',
      'Citation warning: Source is older than the memo date',
      'Date check required before export-ready use.',
    ]);
  });
});
