import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { SignalError } from './domain';
import { pointer, type SignalDesk } from './schema';

/** Only desk-generated native snapshots are removed; attached customer capsules survive. */
export function isDeskGeneratedCapsule(uid: string, deskId: string, id: string, data: Record<string, unknown>): boolean {
  const provenance = data.provenance as { createdBy?: string; notes?: string } | undefined;
  return /^signal-[a-f0-9]+$/.test(id) && data.ownerUid === uid && provenance?.createdBy === uid &&
    provenance.notes?.startsWith(`Immutable SIGNAL desk ${deskId} version `) === true;
}

export async function revokeSignalSnapshotExports(uid: string, desk: SignalDesk) {
  const owner = getAdminDbOrThrow().collection('users').doc(pointer.parse(uid));
  for (const id of new Set(desk.contextCapsuleIds ?? [])) {
    const ref = owner.collection('capsules').doc(pointer.parse(id)); const snap = await ref.get();
    if (snap.exists && isDeskGeneratedCapsule(uid, desk.id, id, snap.data()!)) await ref.update({ 'access.allowDownload': false });
  }
}

/** Two-phase deletion blocks writers first and can safely resume after cleanup failures. */
export async function deleteSignalDesk(uid: string, id: string, expectedVersion: number) {
  pointer.parse(uid); pointer.parse(id);
  const db = getAdminDbOrThrow(); const owner = db.collection('users').doc(uid);
  const ref = owner.collection('signalDesks').doc(id);
  const watchControl = owner.collection('signalRuntime').doc('watchControl');
  const deskControl = owner.collection('signalRuntime').doc('deskControl');
  const desk = await db.runTransaction(async tx => {
    const [snap, watch] = await Promise.all([tx.get(ref), tx.get(watchControl)]);
    const d = snap.data() as SignalDesk | undefined;
    if (!d || d.ownerUid !== uid) throw new SignalError(404, 'Desk unavailable.');
    if (d.version !== expectedVersion) throw new SignalError(409, 'Desk changed. Reload before deletion.');
    if (!d.deletionRequestedAt) {
      d.deletionRequestedAt = new Date().toISOString(); d.watched = false; d.version++;
      tx.set(ref, d);
    }
    if (watch.exists) tx.set(watchControl, { deskIds: (watch.data()?.deskIds ?? []).filter((v: string) => v !== id) });
    return d;
  });
  for (const capsuleId of new Set(desk.contextCapsuleIds ?? [])) {
    pointer.parse(capsuleId); const capsule = owner.collection('capsules').doc(capsuleId); const snapshot = await capsule.get();
    if (snapshot.exists && isDeskGeneratedCapsule(uid, id, capsuleId, snapshot.data()!)) await db.recursiveDelete(capsule);
  }
  // Delayed tasks encounter a missing job and cannot resurrect a deleted desk.
  const jobs = await owner.collection('signalJobs').where('deskId', '==', id).get();
  for (const job of jobs.docs) await db.recursiveDelete(job.ref);
  await db.runTransaction(async tx => {
    const [snap, control] = await Promise.all([tx.get(ref), tx.get(deskControl)]);
    if (!snap.exists) return;
    if (snap.data()?.ownerUid !== uid || !snap.data()?.deletionRequestedAt) throw new SignalError(409, 'Deletion state changed.');
    tx.delete(ref);
    if (control.exists) tx.set(deskControl, { count: Math.max(0, Number(control.data()?.count ?? 0) - 1) });
  });
}
