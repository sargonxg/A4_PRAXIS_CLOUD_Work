import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getCapsule,
  upsertImportedCapsule,
  type CreateCapsuleInput,
} from '@/lib/context/capsule-service';
import {
  buildDialecticaCapsuleImportPlan,
  parseDialecticaCapsulePackageFromParts,
} from '@/lib/context/dialectica-capsule-import';

type ImportedCapsuleInput = CreateCapsuleInput & {
  capsuleId: string;
  importSource: string;
  originalCapsuleId: string;
  packageVersion: number;
  importContentHash: string;
};

const fixtureRoot = join(process.cwd(), 'tests/fixtures/dialectica-capsule');
const fixtureCapsuleId = 'dialectica-cap_conflict_situation_fixture_v3-v1';

function fixtureText(path: string): string {
  return readFileSync(join(fixtureRoot, path), 'utf8');
}

describe('DIALECTICA capsule import idempotency', () => {
  it('upserts the same DIALECTICA capsule package version without duplicates', async () => {
    const db = new FakeFirestore();
    const input = fixtureInput('sha256:fixture-content-a');

    const first = await upsertImportedCapsule('u1', input, deps(db));
    const second = await upsertImportedCapsule('u1', {
      ...input,
      label: 'Updated fixture title',
      importedAt: '2026-06-12T12:05:00.000Z',
    }, deps(db));

    const capsules = await db.collection('users').doc('u1').collection('capsules').get();
    expect(first.created).toBe(true);
    expect(second.updated).toBe(true);
    expect(second.versionBumped).toBe(false);
    expect(capsules.docs).toHaveLength(1);
    expect(second.capsule.label).toBe('Updated fixture title');
    expect(second.capsule.version).toBe(1);
  });

  it('bumps the PRAXIS-side version when same package version content changes', async () => {
    const db = new FakeFirestore();

    await upsertImportedCapsule('u1', fixtureInput('sha256:fixture-content-a'), deps(db));
    const changed = await upsertImportedCapsule('u1', {
      ...fixtureInput('sha256:fixture-content-b', {
        claimsJsonl: JSON.stringify({
          id: 'clm_army_rejects_certification',
          text: 'Changed fixture claim text.',
          source_span: { source_id: 'src_commission_statement' },
        }),
      }),
    }, deps(db));

    expect(changed.versionBumped).toBe(true);
    expect(changed.capsule.version).toBe(2);
    expect(changed.capsule.importNotes?.join('\n')).toMatch(/Content changed/i);
    expect(db.data.has(`users/u1/capsules/${fixtureCapsuleId}/versions/v1`)).toBe(true);
    expect(db.data.has(`users/u1/capsules/${fixtureCapsuleId}/versions/v2`)).toBe(true);
    expect(await getCapsule('u1', fixtureCapsuleId, deps(db))).toMatchObject({
      importSource: 'dialectica',
      originalCapsuleId: 'cap_conflict_situation_fixture_v3',
      packageVersion: 1,
      provenance_root_hash: 'sha256:fixture-root-hash',
    });
  });
});

function fixtureInput(importContentHash: string, overrides: Record<string, unknown> = {}): ImportedCapsuleInput {
  const parsed = parseDialecticaCapsulePackageFromParts({
    manifest: JSON.parse(fixtureText('manifest.json')) as Record<string, unknown>,
    claimsJsonl: fixtureText('claims.jsonl'),
    sourcesJsonl: fixtureText('evidence/sources.jsonl'),
    episodesJson: JSON.parse(fixtureText('episodes.json')) as unknown,
    runtimeJson: JSON.parse(fixtureText('runtime.json')) as unknown,
    graphJsonld: JSON.parse(fixtureText('graph.jsonld')) as unknown,
    agentContextMd: fixtureText('agent_context.md'),
    operationsMd: fixtureText('operations.md'),
    mimetype: fixtureText('mimetype'),
    hasLadybugProjection: true,
    ...overrides,
  });
  return buildDialecticaCapsuleImportPlan(parsed, {
    ownerUid: 'u1',
    importedAt: '2026-06-12T12:00:00.000Z',
    importContentHash,
  }).capsuleInput as ImportedCapsuleInput;
}

function deps(db: FakeFirestore) {
  return {
    db: db as never,
    now: () => new Date('2026-06-12T12:00:00.000Z'),
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
