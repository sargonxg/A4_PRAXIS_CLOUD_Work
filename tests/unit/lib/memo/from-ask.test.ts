import { describe, expect, it } from 'vitest';
import { buildMemoSourceRecord } from '@/lib/memo/from-ask';

describe('buildMemoSourceRecord', () => {
  it('stores reconstructable Ask provenance without requiring copied memo text', () => {
    const record = buildMemoSourceRecord('u1', {
      memoId: 'memo-1',
      situationId: 'sit-1',
      capsuleId: 'cap-1',
      capsuleVersion: 3,
      sourceReceipts: [{ sourceId: 'src-1', citation: 'UN News' }],
      claimChecks: [{ claimId: 'claim-1', status: 'supported' }],
      graphSnapshotId: 'graph-1',
      toolInvocations: [{ toolId: 'groundedSearchFetch', status: 'ok' }],
      askThreadId: 'thread-1',
      askTurnId: 'turn-1',
      now: new Date('2026-05-14T00:00:00.000Z'),
    });

    expect(record).toMatchObject({
      memoId: 'memo-1',
      ownerUid: 'u1',
      situationId: 'sit-1',
      capsuleId: 'cap-1',
      capsuleVersion: 3,
      graphSnapshotId: 'graph-1',
      askThreadId: 'thread-1',
      askTurnId: 'turn-1',
      createdFrom: 'ask-praxis',
      status: 'source-ready',
      ts: '2026-05-14T00:00:00.000Z',
    });
    expect(record.sourceReceipts).toHaveLength(1);
    expect(record.claimChecks).toHaveLength(1);
    expect(record.toolInvocations).toHaveLength(1);
  });

  it('sanitizes Firestore document path fields', () => {
    const record = buildMemoSourceRecord('u1', {
      memoId: 'memo/bad',
      situationId: 'sit#bad',
      capsuleId: 'cap?bad',
      capsuleVersion: 1,
      graphSnapshotId: 'graph[bad]',
      now: new Date('2026-05-14T00:00:00.000Z'),
    });

    expect(record.memoId).toBe('memo_bad');
    expect(record.situationId).toBe('sit_bad');
    expect(record.capsuleId).toBe('cap_bad');
    expect(record.graphSnapshotId).toBe('graph_bad_');
  });
});
