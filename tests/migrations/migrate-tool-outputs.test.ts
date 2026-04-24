import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory Firestore store: Map<path, data>. Path segments use '/'.
const store = new Map<string, Record<string, unknown>>();

interface DocRef {
  id: string;
  path: string;
  get: () => Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | undefined; ref: DocRef }>;
  set: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
  collection: (name: string) => CollectionRef;
}

interface CollectionRef {
  path: string;
  doc: (id: string) => DocRef;
  get: () => Promise<{ empty: boolean; size: number; docs: Awaited<ReturnType<DocRef['get']>>[] }>;
  limit: (n: number) => CollectionRef;
}

function makeDoc(path: string): DocRef {
  const id = path.split('/').pop() as string;
  const ref: DocRef = {
    id,
    path,
    get: async () => {
      const data = store.get(path);
      return {
        exists: data !== undefined,
        id,
        data: () => data,
        ref,
      };
    },
    set: async (data) => {
      store.set(path, data);
    },
    delete: async () => {
      store.delete(path);
    },
    collection: (name) => makeCollection(`${path}/${name}`),
  };
  return ref;
}

function makeCollection(path: string, limitN?: number): CollectionRef {
  return {
    path,
    doc: (id: string) => makeDoc(`${path}/${id}`),
    limit: (n: number) => makeCollection(path, n),
    get: async () => {
      const prefix = `${path}/`;
      const entries: Array<[string, Record<string, unknown>]> = [];
      for (const [k, v] of store.entries()) {
        if (!k.startsWith(prefix)) continue;
        const remainder = k.slice(prefix.length);
        if (remainder.includes('/')) continue; // only direct children
        entries.push([k, v]);
      }
      const clipped = typeof limitN === 'number' ? entries.slice(0, limitN) : entries;
      return {
        empty: clipped.length === 0,
        size: clipped.length,
        docs: clipped.map(([k]) =>
          ({
            exists: true,
            id: k.split('/').pop() as string,
            data: () => store.get(k),
            ref: makeDoc(k),
          } as Awaited<ReturnType<DocRef['get']>>),
        ),
      };
    },
  };
}

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => ({
    collection: (p: string) => makeCollection(p),
  }),
}));

// FieldValue.serverTimestamp() sentinel — the script passes it to `set`, which
// stores whatever object we give it.
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => '__SERVER_TIMESTAMP__',
  },
}));

async function seedLegacy(uid: string, sid: string, toolId: string, output: unknown) {
  // user doc needs to exist for the users collection to enumerate it
  store.set(`users/${uid}`, { uid });
  store.set(`users/${uid}/situations/${sid}`, { sid });
  store.set(`users/${uid}/situations/${sid}/tool_outputs/${toolId}`, {
    toolId,
    output,
    profileVersion: 3,
  });
}

describe('migrate-tool-outputs-to-tools', () => {
  beforeEach(() => {
    store.clear();
  });

  it('returns zeroes when users collection is empty', async () => {
    const { run } = await import('@/../scripts/migrate-tool-outputs-to-tools');
    const totals = await run({ apply: false });
    expect(totals.userCount).toBe(0);
    expect(totals.copied).toBe(0);
  });

  it('dry-run does not write or delete', async () => {
    await seedLegacy('alice', 'sit1', 'risk-monitor', { score: 7 });
    const { run } = await import('@/../scripts/migrate-tool-outputs-to-tools');
    const totals = await run({ apply: false });
    expect(totals.copied).toBe(1);
    expect(store.has('users/alice/situations/sit1/tool_outputs/risk-monitor')).toBe(true);
    expect(store.has('users/alice/situations/sit1/tools/risk-monitor')).toBe(false);
  });

  it('apply mode copies legacy → tools and deletes source', async () => {
    await seedLegacy('bob', 'sit42', 'dashboard', { headline: 'hi' });
    const { run } = await import('@/../scripts/migrate-tool-outputs-to-tools');
    const totals = await run({ apply: true });
    expect(totals.copied).toBe(1);
    expect(store.has('users/bob/situations/sit42/tool_outputs/dashboard')).toBe(false);
    const copied = store.get('users/bob/situations/sit42/tools/dashboard');
    expect(copied).toBeDefined();
    expect((copied as { toolId: string }).toolId).toBe('dashboard');
  });

  it('skips when target already exists', async () => {
    await seedLegacy('carol', 's1', 'stakeholder-map', { nodes: [] });
    store.set('users/carol/situations/s1/tools/stakeholder-map', {
      toolId: 'stakeholder-map',
      output: { nodes: ['existing'] },
    });
    const { run } = await import('@/../scripts/migrate-tool-outputs-to-tools');
    const totals = await run({ apply: true });
    expect(totals.skippedExists).toBe(1);
    expect(totals.copied).toBe(0);
    // Existing target untouched
    const existing = store.get('users/carol/situations/s1/tools/stakeholder-map') as {
      output: { nodes: string[] };
    };
    expect(existing.output.nodes).toEqual(['existing']);
    // Legacy NOT deleted (skip path)
    expect(store.has('users/carol/situations/s1/tool_outputs/stakeholder-map')).toBe(true);
  });

  it('is idempotent (second run is a no-op after a full apply)', async () => {
    await seedLegacy('dave', 's1', 'dossier', { title: 'x' });
    const { run } = await import('@/../scripts/migrate-tool-outputs-to-tools');
    await run({ apply: true });
    const second = await run({ apply: true });
    expect(second.copied).toBe(0);
    expect(second.skippedExists).toBe(0);
  });
});
