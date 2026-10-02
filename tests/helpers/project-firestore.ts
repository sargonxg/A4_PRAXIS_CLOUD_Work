import type { Firestore } from 'firebase-admin/firestore';

/** Transactional fixture, not a Firebase emulator. Commits only after successful callbacks. */
export function projectFirestore() {
  const records = new Map<string, unknown>();
  interface FixtureReference {
    path: string; collection: (name: string) => FixtureReference; doc: (id: string) => FixtureReference;
    get: () => Promise<unknown>; limit: (count: number) => FixtureReference; orderBy: (field: string, direction: string) => FixtureReference;
  }
  const reference = (path: string, sort?: { field: string; direction: string }, limit = Infinity): FixtureReference => ({
    path,
    collection: (name: string) => reference(`${path}/${name}`),
    doc: (id: string) => reference(`${path}/${id}`),
    get: async () => path.split('/').length % 2 === 0
      ? snapshot(path)
      : { docs: [...records.keys()].filter((key) => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1).sort((a, b) => {
        if (!sort) return a.localeCompare(b);
        const first = String((records.get(a) as Record<string, unknown>)[sort.field]); const second = String((records.get(b) as Record<string, unknown>)[sort.field]);
        return first.localeCompare(second) * (sort.direction === 'desc' ? -1 : 1);
      }).slice(0, limit).map(snapshot) },
    limit: (count: number) => reference(path, sort, count),
    orderBy: (field: string, direction: string) => reference(path, { field, direction }, limit),
  });
  const snapshot = (path: string) => ({ exists: records.has(path), id: path.split('/').at(-1), data: () => structuredClone(records.get(path)) });
  let tail: Promise<unknown> = Promise.resolve();
  const db = {
    collection: (name: string) => reference(name),
    runTransaction: (callback: (transaction: unknown) => Promise<unknown>) => {
      const next = tail.then(async () => {
        const pending = new Map<string, unknown>();
        const result = await callback({
          get: (ref: { path: string }) => Promise.resolve(snapshot(ref.path)),
          set: (ref: { path: string }, data: unknown) => pending.set(ref.path, structuredClone(data)),
        });
        pending.forEach((data, path) => records.set(path, data));
        return result;
      });
      tail = next.catch(() => undefined);
      return next;
    },
  } as unknown as Firestore;
  return { db, records };
}
