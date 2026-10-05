import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { createDesk, SignalError } from './domain';
import { pointer, type SignalDesk } from './schema';

export interface SignalStore {
  create(uid: string, input: unknown): Promise<SignalDesk>;
  get(uid: string, id: string): Promise<SignalDesk>;
  list(uid: string, cursor?: string): Promise<{ desks: SignalDesk[]; nextCursor: string | null }>;
  mutate(uid: string, id: string, expectedVersion: number | null, fn: (desk: SignalDesk) => void): Promise<SignalDesk>;
}
const clean = <T>(data: T): T => JSON.parse(JSON.stringify(data));
function validateSize(desk: SignalDesk) { if (Buffer.byteLength(JSON.stringify(desk), 'utf8') > 700000) throw new SignalError(413, 'This bounded pilot desk has reached storage capacity. Create a new desk before adding evidence.'); }
function collection(uid: string) { pointer.parse(uid); return getAdminDbOrThrow().collection('users').doc(uid).collection('signalDesks'); }
export const signalStore: SignalStore = {
  async create(uid, input) {
    const desk = createDesk(uid, input); const desks = collection(uid); const control = desks.parent!.collection('signalRuntime').doc('deskControl');
    await getAdminDbOrThrow().runTransaction(async tx => {
      const state = await tx.get(control); const count = state.exists ? Number(state.data()?.count) : (await tx.get(desks.select('ownerUid'))).docs.filter(d => d.data().ownerUid === uid).length;
      if (!Number.isSafeInteger(count) || count < 0) throw new SignalError(503, 'Desk allowance requires operator recovery.');
      if (count >= 20) throw new SignalError(429, 'You can keep up to 20 desks. Export and delete an unused desk before creating another.');
      tx.create(desks.doc(desk.id), desk); tx.set(control, { count: count + 1 });
    }); return desk;
  },
  async get(uid, id) { pointer.parse(id); const doc = await collection(uid).doc(id).get(); if (!doc.exists || doc.data()?.ownerUid !== uid) throw new SignalError(404, 'Desk unavailable.'); return doc.data() as SignalDesk; },
  async list(uid, cursor) {
    let query = collection(uid).orderBy('updatedAt', 'desc').limit(21);
    if (cursor) { pointer.parse(cursor); const last = await collection(uid).doc(cursor).get(); if (!last.exists || last.data()?.ownerUid !== uid) throw new SignalError(404, 'Cursor unavailable.'); query = query.startAfter(last); }
    const docs = (await query.get()).docs.filter(d => d.data().ownerUid === uid);
    return { desks: docs.slice(0, 20).map(d => d.data() as SignalDesk), nextCursor: docs.length > 20 ? docs[19].id : null };
  },
  async mutate(uid, id, expectedVersion, fn) {
    pointer.parse(id); const ref = collection(uid).doc(id);
    return getAdminDbOrThrow().runTransaction(async tx => {
      const snap = await tx.get(ref); const desk = snap.data() as SignalDesk | undefined;
      if (!desk || desk.ownerUid !== uid) throw new SignalError(404, 'Desk unavailable.');
      if (desk.deletionRequestedAt) throw new SignalError(409, 'Desk deletion is in progress. Retry deletion.');
      if (expectedVersion !== null && desk.version !== expectedVersion) throw new SignalError(409, 'Desk changed. Reload before applying this action.');
      fn(desk); desk.version++; desk.updatedAt = new Date().toISOString(); validateSize(desk); tx.set(ref, clean(desk)); return clean(desk);
    });
  },
};
/** Isolated adapter for invariant tests; never selected by runtime configuration. */
export function memorySignalStore(): SignalStore {
  const values = new Map<string, SignalDesk>(); const key = (uid: string, id: string) => `${uid}/${id}`;
  return {
    async create(uid, input) { const d = createDesk(uid, input); values.set(key(uid, d.id), clean(d)); return clean(d); },
    async get(uid, id) { const d = values.get(key(uid, id)); if (!d || d.ownerUid !== uid) throw new SignalError(404, 'Desk unavailable.'); return clean(d); },
    async list(uid) { return { desks: [...values.values()].filter(d => d.ownerUid === uid).map(clean), nextCursor: null }; },
    async mutate(uid, id, version, fn) { const original = values.get(key(uid, id)); if (!original || original.ownerUid !== uid) throw new SignalError(404, 'Desk unavailable.'); if (version !== null && original.version !== version) throw new SignalError(409, 'Desk changed.'); const d = clean(original); fn(d); d.version++; d.updatedAt = new Date().toISOString(); validateSize(d); values.set(key(uid, id), clean(d)); return clean(d); },
  };
}
