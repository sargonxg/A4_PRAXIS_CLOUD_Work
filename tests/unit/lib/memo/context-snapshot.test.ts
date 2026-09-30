import { describe, expect, it } from 'vitest';
import { Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { readMemoContextSnapshot, recordMemoContextSnapshot } from '@/lib/memo/context-snapshot';

describe('memo context snapshot source values', () => {
  it('isolates caller edits to nested receipts while preserving native Firestore values and missing array positions', () => {
    const firestore = new Firestore({ projectId: 'praxis-unit-tests' });
    const native = {
      sourceRef: firestore.doc('sources/receipt-1'),
      capturedAt: Timestamp.fromDate(new Date('2026-09-30T12:00:00Z')),
      observedAt: new Date('2026-09-29T12:00:00Z'),
      location: new GeoPoint(40.7, -74),
      bytes: Buffer.from('source passage'),
    };
    const source = { id: 'receipt-1', title: 'Original source', ...native,
      passage: { quote: 'Original passage', pageRef: undefined },
      grounding: [{ sourceIndices: [0, undefined, 2], enabled: false, confidence: 0 }] };
    const claim = { claim: 'Funding remains unconfirmed.', passage: { quote: 'Original passage', optional: undefined } };
    const snapshot = recordMemoContextSnapshot({ capsuleId: 'capsule-1', capsuleVersion: 3,
      sourceReceiptIds: ['receipt-1'], sourceReceipts: [source], claimChecks: [claim] }, undefined, false);
    const savedSource = snapshot.sourceReceipts[0] as typeof source;

    source.title = 'Caller edit';
    source.passage.quote = 'Caller passage edit';
    source.grounding[0].sourceIndices[0] = 99;
    claim.passage.quote = 'Caller claim edit';

    expect(savedSource).toMatchObject({ title: 'Original source', passage: { quote: 'Original passage' },
      grounding: [{ sourceIndices: [0, null, 2], enabled: false, confidence: 0 }] });
    expect(savedSource.passage).not.toHaveProperty('pageRef');
    expect(snapshot.claimChecks[0]).toEqual({ claim: 'Funding remains unconfirmed.', passage: { quote: 'Original passage' } });
    for (const key of Object.keys(native) as Array<keyof typeof native>) expect(savedSource[key]).toBe(native[key]);
  });

  it('isolates reads and inherited versions from edits to a returned source snapshot', () => {
    const capturedAt = Timestamp.fromDate(new Date('2026-09-30T12:00:00Z'));
    const original = recordMemoContextSnapshot({ capsuleId: 'capsule-1', capsuleVersion: 3,
      sourceReceiptIds: ['receipt-1'], sourceReceipts: [{ id: 'receipt-1', capturedAt, passage: { quote: 'Original passage' } }] }, undefined, false);
    const read = readMemoContextSnapshot(original)!;
    const inherited = recordMemoContextSnapshot({}, original, true);
    const readSource = read.sourceReceipts[0] as { capturedAt: Timestamp; passage: { quote: string } };
    const inheritedSource = inherited.sourceReceipts[0] as typeof readSource;

    read.sourceReceiptIds.push('caller-added');
    readSource.passage.quote = 'Caller read edit';
    inheritedSource.passage.quote = 'Caller inherited edit';

    expect(original.sourceReceiptIds).toEqual(['receipt-1']);
    expect(original.sourceReceipts[0]).toMatchObject({ passage: { quote: 'Original passage' } });
    expect(readSource.capturedAt).toBe(capturedAt);
    expect(inheritedSource.capturedAt).toBe(capturedAt);
    expect(readSource.passage).not.toBe(inheritedSource.passage);
  });
});
