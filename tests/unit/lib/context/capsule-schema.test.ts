import { describe, expect, it } from 'vitest';

import { createCapsule, createCapsuleReviewCard, getCapsule, migrateCapsuleClaimLedgerReceipts } from '@/lib/context/capsule-service';
import {
  CapsuleAnyVersionSchema,
  CapsuleEnvelopePatchSchema,
  EvidenceReceiptSchema,
  normalizeToLatest,
  upgradeV1toV2,
  upgradeV2toV3,
} from '@/lib/context/capsule-schema';

describe('unified capsule schema', () => {
  it('lazily normalizes v1 and v2 capsule fixtures into the latest v3 contract', () => {
    const v1 = {
      schemaVersion: 1,
      capsuleId: 'legacy-v1',
      ownerUid: 'u1',
      label: 'Legacy v1',
      version: 2,
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1'],
      },
    };

    const v2 = upgradeV1toV2(v1);
    const v3 = upgradeV2toV3(v2);
    const latest = normalizeToLatest(v1);

    expect(v2.schemaVersion).toBe(2);
    expect(v3.schemaVersion).toBe(3);
    expect(latest.schemaVersion).toBe(3);
    expect(latest.memoryPosture.cogneeMode).toBe('advisory-only');
    expect(latest.claimLedger.supportedClaims).toEqual([]);
    expect(CapsuleAnyVersionSchema.parse(v1).schemaVersion).toBe(1);
  });

  it('creates and reads capsules with a v3 envelope and one authoritative readiness score', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-v3-new',
      label: 'V3 new capsule',
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1'],
        outputCoreIds: ['memo'],
      },
    }, deps(db));
    const stored = db.data.get('users/u1/capsules/cap-v3-new');
    const loaded = await getCapsule('u1', 'cap-v3-new', deps(db));

    expect(capsule.schemaVersion).toBe(3);
    expect(stored?.schemaVersion).toBe(3);
    expect(stored?.v3).toMatchObject({ schemaVersion: 3 });
    expect(loaded?.v3?.schemaVersion).toBe(3);
    expect(loaded?.readiness?.score).toBe(loaded?.trust.score);
    expect(loaded?.readiness?.score).toBe(loaded?.health.score);
  });

  it('rejects review-card patches outside the capsule envelope allow-list and records an audit entry', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-review' }, deps(db));

    expect(() => CapsuleEnvelopePatchSchema.parse({
      label: 'Allowed',
      archivedAt: '2026-05-28T00:00:00.000Z',
    })).toThrow();

    await expect(createCapsuleReviewCard('u1', 'cap-review', {
      title: 'Unsafe patch',
      sourceType: 'agent',
      target: 'capsuleEnvelope',
      proposedEnvelopePatch: {
        label: 'Allowed',
        archivedAt: '2026-05-28T00:00:00.000Z',
      } as never,
    }, deps(db))).rejects.toThrow(/not allowed/i);

    const auditRows = Array.from(db.data.keys()).filter((key) => key.startsWith('users/u1/capsules/cap-review/reviewAudits/'));
    expect(auditRows).toHaveLength(1);
    expect(db.data.get(auditRows[0])?.event).toBe('review_card_patch_rejected');
  });

  it('validates claim-ledger receipts in envelope patches', () => {
    const receipt = {
      sourceId: 'src-1',
      url: 'https://example.test/rule',
      publisher: 'Official source',
      date: '2026-05-01',
      reliabilityTier: 1,
      snippet: 'Procurement recommendations require legal review.',
      charOffset: { start: 12, end: 88 },
      embedding: [0.1, 0.2],
      confidence: 0.91,
      stance: 'supports',
    };

    expect(EvidenceReceiptSchema.parse(receipt)).toMatchObject(receipt);
    expect(CapsuleEnvelopePatchSchema.parse({
      claimLedger: [{
        claimId: 'claim-1',
        text: 'Procurement requires legal review.',
        sourceRefIds: ['src-1'],
        validFrom: '2026-05-01',
        validUntil: '2026-06-30',
        asOf: '2026-05-15',
        causalLinks: { causes: ['claim-2'], deEscalates: ['claim-3'] },
        receipts: [receipt],
      }],
    }).claimLedger?.[0]).toMatchObject({
      claimId: 'claim-1',
      receipts: [receipt],
    });
  });

  it('runs the one-shot claim-ledger receipt migration and bumps capsule version', async () => {
    const db = new FakeFirestore();
    db.data.set('users/u1/capsules/cap-flat', {
      capsuleId: 'cap-flat',
      ownerUid: 'u1',
      label: 'Flat claim capsule',
      schemaVersion: 3,
      version: 2,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      coreRefs: {
        sourceCoreIds: ['src-1'],
        documentCoreIds: [],
        outputCoreIds: [],
      },
      sourceRefs: [{
        sourceId: 'src-1',
        label: 'Official procurement rule',
        url: 'https://example.test/rule',
        publisher: 'Official source',
        date: '2026-05-01',
        reliabilityTier: 1,
      }],
      claimLedger: [{
        claimId: 'claim-1',
        text: 'Procurement requires legal review.',
        support: 'supported',
        sourceRefIds: ['src-1'],
      }],
    });

    const result = await migrateCapsuleClaimLedgerReceipts('u1', 'cap-flat', deps(db));
    const stored = db.data.get('users/u1/capsules/cap-flat');

    expect(result?.migrated).toBe(true);
    expect(result?.capsule.version).toBe(3);
    expect(result?.capsule.v3?.claimLedger.allClaims[0].receipts[0]).toMatchObject({
      sourceId: 'src-1',
      url: 'https://example.test/rule',
      publisher: 'Official source',
      reliabilityTier: 1,
      stance: 'supports',
    });
    expect(stored?.version).toBe(3);
    expect(db.data.get('users/u1/capsules/cap-flat/versions/v2')?.version).toBe(2);
    expect(db.data.get('users/u1/capsules/cap-flat/versions/v3')?.version).toBe(3);
  });
});

function deps(db: FakeFirestore) {
  return {
    db: db as never,
    now: () => new Date('2026-05-28T00:00:00.000Z'),
  };
}

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

  collection(path: string) {
    return new FakeCollection(this, path);
  }

  batch() {
    const writes: Array<() => void> = [];
    return {
      set: (ref: FakeDoc, value: Record<string, unknown>, options?: { merge?: boolean }) => {
        writes.push(() => ref.setSync(value, options));
      },
      commit: async () => {
        writes.forEach((write) => write());
      },
    };
  }
}

class FakeCollection {
  constructor(private db: FakeFirestore, private path: string) {}

  doc(id = `doc-${this.db.data.size + 1}`) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => new FakeSnapshot(true, value, path.split('/').pop() ?? 'unknown'));
    return { docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async get() {
    const value = this.db.data.get(this.path);
    return new FakeSnapshot(Boolean(value), value ?? {}, this.id);
  }

  async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
    this.setSync(value, options);
  }

  setSync(value: Record<string, unknown>, options?: { merge?: boolean }) {
    const current = this.db.data.get(this.path) ?? {};
    this.db.data.set(this.path, options?.merge ? { ...current, ...value } : value);
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
