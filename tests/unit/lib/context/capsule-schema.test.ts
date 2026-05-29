import { describe, expect, it } from 'vitest';

import { createCapsule, createCapsuleReviewCard, getCapsule } from '@/lib/context/capsule-service';
import {
  CapsuleAnyVersionSchema,
  CapsuleEnvelopePatchSchema,
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
