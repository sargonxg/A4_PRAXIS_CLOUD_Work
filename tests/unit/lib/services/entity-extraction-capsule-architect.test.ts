import { describe, expect, it } from 'vitest';

import { buildDocumentFirstCapsuleArchitectSignals } from '@/lib/services/entity-extraction';
import { buildCapsuleArchitectProposal } from '@/lib/context/capsule-architect';

describe('document-first capsule architect signals', () => {
  it('preserves case-sensitive storage IDs through proposals and source receipts', () => {
    const documents = [
      { documentId: 'AbC123_xYz', sourceId: 'Source_XyZ', title: 'First note', text: 'The review deadline is 2026-11-12.' },
      { documentId: 'abc123_xyz', title: 'Second note', text: 'Funding remains undecided pending review.' },
    ];
    const proposal = buildCapsuleArchitectProposal({ capsuleId: 'Capsule_AbC', jobPrompt: 'Review the two documents', documents });
    expect(proposal.capsuleId).toBe('Capsule_AbC');
    expect(proposal.documentIds).toEqual(['AbC123_xYz', 'abc123_xyz']);
    expect(proposal.sourceRefs.map(source => source.sourceId)).toEqual(['Source_XyZ', 'abc123_xyz']);
    expect(proposal.claimLedger.map(claim => claim.receipts?.[0].sourceId)).toEqual(['Source_XyZ', 'abc123_xyz']);
  });
  it('never invents supported claims, dates or causality from a filename or a job prompt', () => {
    const signals = buildDocumentFirstCapsuleArchitectSignals([{ title: 'Unreadable.pdf', text: '' }], {
      jobPrompt: 'The ceasefire has collapsed', normalizedAt: '2026-09-20T00:00:00.000Z',
    });
    expect(signals.claimLedger).toEqual([]);
    expect(signals.temporality.timelineAnchors).toEqual([]);
    expect(signals.causality.causalLinks).toEqual([]);
  });

  it('keeps exact spans and explicit actors; sorts real dates without dating undated claims', () => {
    const text = 'Actor: United Nations.\n\nThe ceasefire meeting is on 2026-09-25.\nThe talks began on 2026-09-01. Negotiations remain disputed without corroboration.';
    const input = [{ documentId: 'conflict', title: 'Conflict note', text }];
    const options = { normalizedAt: '2026-09-20T00:00:00.000Z' };
    const signals = buildDocumentFirstCapsuleArchitectSignals(input, options);
    expect(signals).toEqual(buildDocumentFirstCapsuleArchitectSignals(input, options));
    for (const claim of signals.claimLedger) {
      const receipt = claim.receipts![0];
      expect(text.slice(receipt.charOffset!.start, receipt.charOffset!.end)).toBe(receipt.snippet);
    }
    expect(signals.claimLedger.find((claim) => claim.text.startsWith('Negotiations'))?.validFrom).toBeNull();
    expect(signals.temporality.timelineAnchors.map((anchor) => anchor.date)).toEqual(['2026-09-01', '2026-09-25']);
    expect(signals.embeddedGraph.nodes.some((node) => node.entityType === 'Actor' && node.label === 'United Nations')).toBe(true);
    expect(signals.causality.causalLinks).toEqual([]);
    expect(signals.claimLedger.every((claim) => Object.keys(claim.causalLinks ?? {}).length === 0)).toBe(true);
  });
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
    expect(signals.causality.causalLinks).toEqual([]); // Adjacency is not causality.
    expect(signals.reviewGate).toBe('human_review');
  });
});
