import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  buildCapsuleImportReviewHref,
  buildCapsulePlusImportPreview,
  buildDialecticaImportPreview,
} from '@/lib/context/capsule-import-preview';
import { DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION } from '@/lib/context/dialectica-context-contract';

describe('capsule import preview mapping', () => {
  it('summarizes a DIALECTICA export before import without applying claims', () => {
    const preview = buildDialecticaImportPreview({
      contractVersion: DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION,
      packageId: 'border-monitoring-001',
      exportedAt: '2026-06-01T08:00:00.000Z',
      title: 'Border monitoring verification package',
      claims: [
        { id: 'fact-1', kind: 'fact', text: 'The monitoring mission reported 17 staffed checkpoints.', sourceIds: ['src-1'] },
        { id: 'fact-2', kind: 'fact', text: 'The corridor reopened on 2026-05-28.', sourceIds: ['src-2'] },
        { id: 'conflict-1', kind: 'conflicting_claim', text: 'The parties dispute whether heavy vehicles crossed after the deadline.', sourceIds: ['src-2'] },
        { id: 'gap-1', kind: 'evidence_gap', text: 'No verified satellite pass after 2026-05-30.', sourceIds: [] },
      ],
      evidenceGaps: ['Need UNMHA movement log for the northern crossing.'],
      sourceReceipts: [
        { id: 'src-1', title: 'Monitoring flash update', url: 'https://example.org/flash', citation: 'Mission update, 1 June 2026' },
        { id: 'src-2', title: 'Ceasefire annex note', excerpt: 'Vehicle restrictions remain contested.' },
      ],
    });

    expect(preview.kind).toBe('dialectica');
    expect(preview.title).toBe('Border monitoring verification package');
    expect(preview.factCount).toBe(2);
    expect(preview.conflictingCount).toBe(1);
    expect(preview.evidenceGapCount).toBe(2);
    expect(preview.sourceReceiptCount).toBe(2);
    expect(preview.reviewGatedSummary).toContain('review-gated');
    expect(preview.sourceReceipts.map((receipt) => receipt.id)).toEqual(['src-1', 'src-2']);
  });

  it('summarizes a Capsule+ bundle from zip metadata and graph rows', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      capsuleId: 'capsule-plus-001',
      ownerUid: 'user-1',
      schemaVersion: 'capsule-plus.v1',
      graphVersion: 4,
      exportedAt: '2026-06-01T08:00:00.000Z',
      runtimeLabel: 'Postgres embedded graph',
    }));
    zip.file('capsule.json', JSON.stringify({
      capsuleId: 'capsule-plus-001',
      ownerUid: 'user-1',
      label: 'Ceasefire graph capsule',
    }));
    zip.file('graph/nodes.jsonl', [
      JSON.stringify({ id: 'n1', type: 'Actor', label: 'Joint Monitoring Mission' }),
      JSON.stringify({ id: 'n2', type: 'Claim', label: 'Checkpoint staffing changed' }),
      '',
    ].join('\n'));
    zip.file('graph/edges.jsonl', `${JSON.stringify({ id: 'e1', type: 'SUPPORTED_BY', fromNodeId: 'n2', toNodeId: 'n1' })}\n`);
    zip.file('graph/proposals.jsonl', `${JSON.stringify({ proposalId: 'p1', nodes: [], edges: [] })}\n`);
    zip.file('receipts/source-receipts.jsonl', `${JSON.stringify({ id: 'src-1', title: 'Graph receipt', url: 'https://example.org/receipt' })}\n`);

    const preview = await buildCapsulePlusImportPreview(await zip.generateAsync({ type: 'uint8array' }));

    expect(preview.kind).toBe('capsule-plus');
    expect(preview.title).toBe('Ceasefire graph capsule');
    expect(preview.factCount).toBe(2);
    expect(preview.conflictingCount).toBe(0);
    expect(preview.evidenceGapCount).toBe(1);
    expect(preview.sourceReceiptCount).toBe(1);
    expect(preview.sourceReceipts[0].title).toBe('Graph receipt');
  });

  it('deep-links imported capsules to the review surface in Inspect', () => {
    expect(buildCapsuleImportReviewHref('dialectica-border-001')).toBe('/app/capsules?capsuleId=dialectica-border-001&panel=review');
  });
});
