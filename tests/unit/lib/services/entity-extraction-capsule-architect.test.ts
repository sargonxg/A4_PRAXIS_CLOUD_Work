import { describe, expect, it } from 'vitest';

import { buildDocumentFirstCapsuleArchitectSignals } from '@/lib/services/entity-extraction';

describe('document-first capsule architect signals', () => {
  it('turns two uploaded PDFs into sources, receipted claims, graph candidates, and elicitation anchors', () => {
    const signals = buildDocumentFirstCapsuleArchitectSignals([
      {
        documentId: 'doc-access-1',
        title: 'Access constraints update.pdf',
        mimeType: 'application/pdf',
        originalUri: 'gs://uploads/access-constraints.pdf',
        text: [
          'Humanitarian access requires a current deconfliction channel.',
          'The convoy approval window expires on 2026-06-15.',
          'Local authorities can block route clearance when notification is late.',
        ].join(' '),
      },
      {
        documentId: 'doc-access-2',
        title: 'Mediator note.pdf',
        mimeType: 'application/pdf',
        originalUri: 'gs://uploads/mediator-note.pdf',
        text: [
          'The mediator expects a decision memo before the donor meeting.',
          'Legal review must confirm the access guarantee language.',
        ].join(' '),
      },
    ], {
      jobPrompt: 'Build a capsule for a humanitarian access decision memo.',
      domainId: 'humanitarian',
      normalizedAt: '2026-06-01T12:00:00.000Z',
    });

    expect(signals.sourceRefs).toHaveLength(2);
    expect(signals.claimLedger.length).toBeGreaterThanOrEqual(3);
    expect(signals.claimLedger.every((claim) => claim.receipts?.length)).toBe(true);
    expect(signals.claimLedger[0].receipts?.[0]).toMatchObject({
      sourceId: 'doc-access-1',
      reliabilityTier: 2,
      stance: 'supports',
    });
    expect(signals.embeddedGraph.nodes.length).toBeGreaterThanOrEqual(4);
    expect(signals.embeddedGraph.edges.length).toBeGreaterThanOrEqual(2);
    expect(signals.temporality.timelineAnchors.length).toBeGreaterThanOrEqual(1);
    expect(signals.causality.causalLinks.length).toBeGreaterThanOrEqual(1);
    expect(signals.reviewGate).toBe('human_review');
  });
});
