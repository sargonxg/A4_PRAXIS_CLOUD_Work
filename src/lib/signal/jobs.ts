import { GoogleAuth } from 'google-auth-library';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getAgentRunTasksQueuePath, getAgentRunTasksCreateUrl } from '@/lib/agent-runtime/cloud-tasks';
import { signalStore, type SignalStore } from './store';
import { collectSignalDesk } from './collectors';
import { digest, newId, SignalError } from './domain';
import { pointer, type SignalDesk } from './schema';

export interface SignalJob { id: string; ownerUid: string; deskId: string; provider: 'rss' | 'gdelt'; window: string; inputDigest: string; sourcePackVersion: number; collectionWindowDays: number; status: 'scheduled' | 'running' | 'succeeded' | 'failed' | 'cancelled'; attempts: number; createdAt: string; updatedAt: string; leaseUntil: number; leaseToken: string | null; dispatched: boolean; error?: string; runId?: string }
const MAX_ATTEMPTS = 3;
const QUEUE_AGE = 6 * 60 * 60 * 1000;
export function signalJobId(uid: string, deskId: string, provider: string, window: string, packVersion: number, inputDigest = ''): string { return digest({ uid, deskId, provider, window, packVersion, inputDigest }).slice(0, 48); }
export function signalCollectionInputDigest(desk: SignalDesk): string { return digest({ name: desk.name, question: desk.question, scope: desk.scope, sourcePack: desk.sourcePack, languages: desk.languages, windowDays: desk.windowDays }); }
export function verifySignalJobInputs(job: SignalJob, desk: SignalDesk): void {
  if (!job.inputDigest || job.inputDigest !== signalCollectionInputDigest(desk) || job.sourcePackVersion !== desk.sourcePack.version || job.collectionWindowDays !== desk.windowDays) throw new SignalError(409, 'Scheduled collector inputs changed; this job is cancelled. A new schedule is required.');
}
export function claimSignalJob(job: SignalJob, now: number, token: string): boolean {
  if (job.status === 'succeeded' || job.status === 'cancelled' || (job.status === 'running' && job.leaseUntil > now)) return false;
  if (job.attempts >= MAX_ATTEMPTS || now - Date.parse(job.createdAt) > QUEUE_AGE) { job.status = 'failed'; job.error = 'Job expired or exhausted three attempts; operator recovery required.'; return false; }
  job.status = 'running'; job.attempts++; job.leaseToken = token; job.leaseUntil = now + 180_000; job.updatedAt = new Date(now).toISOString(); return true;
}
function jobs(uid: string) { pointer.parse(uid); return getAdminDbOrThrow().collection('users').doc(uid).collection('signalJobs'); }
export const MAX_WATCHED_DESKS = 5;
export function transitionSignalWatches(deskIds: string[], deskId: string, watched: boolean): string[] {
  const ids = [...new Set(deskIds)];
  if (!watched) return ids.filter(id => id !== deskId);
  if (ids.includes(deskId)) return ids;
  if (ids.length >= MAX_WATCHED_DESKS) throw new SignalError(429, 'You can watch up to 5 desks. Pause another watched desk before enabling this one.');
  return [...ids, deskId];
}
export async function setSignalWatch(uid: string, deskId: string, expectedVersion: number, watched: boolean): Promise<SignalDesk> {
  pointer.parse(uid); pointer.parse(deskId); const db = getAdminDbOrThrow();
  const owner = db.collection('users').doc(uid); const deskRef = owner.collection('signalDesks').doc(deskId); const controlRef = owner.collection('signalRuntime').doc('watchControl');
  const control = await controlRef.get();
  // Bootstrap only: project owner-scoped IDs, preserving every legacy watch without downloading desk evidence.
  // Existing SIGNAL rollout has no watches; legacy users must pause excess watches before adding more.
  const baseline = control.exists ? [] : (await owner.collection('signalDesks').where('watched', '==', true).select('ownerUid').get()).docs.filter(d => d.data().ownerUid === uid).map(d => d.id);
  return db.runTransaction(async tx => {
    const [deskSnap, controlSnap] = await Promise.all([tx.get(deskRef), tx.get(controlRef)]); const d = deskSnap.data() as SignalDesk | undefined;
    if (!d || d.ownerUid !== uid) throw new SignalError(404, 'Desk unavailable.');
    if (d.deletionRequestedAt) throw new SignalError(409, 'Desk deletion is in progress.');
    if (d.version !== expectedVersion) throw new SignalError(409, 'Desk changed. Reload before applying this action.');
    if (watched && (!d.sourcePack.allowGdelt || process.env.SIGNAL_GDELT_ENABLED !== 'true') && !d.sourcePack.feeds.some(f => f.allowCapture)) throw new SignalError(422, 'Configure a permitted source panel before watching.');
    const ids = controlSnap.exists ? controlSnap.data()?.deskIds : baseline;
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) throw new SignalError(503, 'Watch allowance control requires operator recovery.');
    const deskIds = transitionSignalWatches(ids, deskId, watched);
    d.watched = watched;
    if (!watched) for (const run of d.runs.filter(r => r.status === 'running' && r.provider !== 'analysis')) { run.status = 'cancelled'; run.endedAt = new Date().toISOString(); run.error = 'Watch disabled; future collector work cancelled, prior evidence retained.'; }
    d.version++; d.updatedAt = new Date().toISOString();
    if (Buffer.byteLength(JSON.stringify(d)) > 700000) throw new SignalError(413, 'Desk storage capacity reached.');
    tx.set(controlRef, { deskIds, updatedAt: d.updatedAt }); tx.set(deskRef, JSON.parse(JSON.stringify(d))); return d;
  });
}
export async function enqueueSignalJob(uid: string, desk: SignalDesk, provider: 'rss' | 'gdelt', now = new Date()): Promise<string> {
  if (provider === 'gdelt' && process.env.SIGNAL_GDELT_ENABLED !== 'true') throw new SignalError(503, 'Discovery provider is disabled; configure a permissioned RSS panel.');
  if (desk.ownerUid !== uid || !desk.watched) throw new SignalError(403, 'Only owned watched desks may schedule collection.');
  // Hourly pilot cadence respects the default daily allowance; it is not a latency SLA.
  const window = now.toISOString().slice(0, 13); const inputDigest = signalCollectionInputDigest(desk); const id = signalJobId(uid, desk.id, provider, window, desk.sourcePack.version, inputDigest); const ref = jobs(uid).doc(id);
  await getAdminDbOrThrow().runTransaction(async tx => { const existing = await tx.get(ref); if (!existing.exists) tx.create(ref, { id, ownerUid: uid, deskId: desk.id, provider, window, inputDigest, sourcePackVersion: desk.sourcePack.version, collectionWindowDays: desk.windowDays, status: 'scheduled', attempts: 0, createdAt: now.toISOString(), updatedAt: now.toISOString(), leaseUntil: 0, leaseToken: null, dispatched: false } satisfies SignalJob); });
  await dispatchSignalJob(uid, id); return id;
}
export async function dispatchSignalJob(uid: string, id: string): Promise<void> {
  pointer.parse(id); const ref = jobs(uid).doc(id); const snap = await ref.get(); const job = snap.data() as SignalJob | undefined;
  if (!job || job.ownerUid !== uid || job.dispatched || job.status !== 'scheduled') return;
  if (Date.now() - Date.parse(job.createdAt) > QUEUE_AGE || job.attempts >= MAX_ATTEMPTS) { await ref.update({ status: 'failed', error: 'Outbox job expired or exhausted attempts; operator recovery required.' }); return; }
  const base = process.env.SIGNAL_WORKER_BASE_URL || process.env.AGENT_RUN_WORKER_BASE_URL || process.env.APP_URL;
  const email = process.env.AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL;
  if (!base || !email) throw new SignalError(503, 'SIGNAL Cloud Tasks worker URL and OIDC identity must be configured.');
  const url = `${base.replace(/\/+$/, '')}/api/signal/worker`; if (!url.startsWith('https://')) throw new SignalError(503, 'SIGNAL worker requires HTTPS.');
  const parent = getAgentRunTasksQueuePath(); const name = `${parent}/tasks/signal-${id}-${job.attempts}`;
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }); const client = await auth.getClient();
  const token = await client.getAccessToken(); if (!token.token) throw new SignalError(503, 'Cloud Tasks identity unavailable.');
  const response = await fetch(getAgentRunTasksCreateUrl(parent), { method: 'POST', headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10_000), body: JSON.stringify({ task: { name, dispatchDeadline: '180s', httpRequest: { httpMethod: 'POST', url, headers: { 'Content-Type': 'application/json' }, body: Buffer.from(JSON.stringify({ ownerUid: uid, jobId: id })).toString('base64'), oidcToken: { serviceAccountEmail: email, audience: process.env.AGENT_RUN_WORKER_OIDC_AUDIENCE || url } } } }) });
  if (!response.ok && response.status !== 409) throw new SignalError(503, `Cloud Tasks dispatch failed: HTTP ${response.status}. Durable outbox will retry.`);
  await ref.update({ dispatched: true, updatedAt: new Date().toISOString() });
}
export async function executeSignalJob(uid: string, id: string): Promise<{ status: string }> {
  pointer.parse(id); const ref = jobs(uid).doc(id); const db = getAdminDbOrThrow(); const token = newId();
  const job = await db.runTransaction(async tx => { const snap = await tx.get(ref); const j = snap.data() as SignalJob | undefined; if (!j) return 'cancelled' as const; if (j.ownerUid !== uid) throw new SignalError(404, 'Job unavailable.'); const claimed = claimSignalJob(j, Date.now(), token); tx.set(ref, j); return claimed ? j : null; });
  if (job === 'cancelled') return { status: 'cancelled' };
  if (!job) return { status: 'duplicate_or_terminal' };
  const deskRef = db.collection('users').doc(uid).collection('signalDesks').doc(job.deskId);
  // Desk writes and lease validation share a transaction: lost workers cannot commit evidence.
  let firstWrite = true;
  const fencedStore: SignalStore = { ...signalStore, async mutate(owner, deskId, version, fn) {
    if (owner !== uid || deskId !== job.deskId) throw new SignalError(403, 'Job ownership mismatch.');
    const result = await db.runTransaction(async tx => {
      const [js, ds] = await Promise.all([tx.get(ref), tx.get(deskRef)]); const current = js.data() as SignalJob; const d = ds.data() as SignalDesk | undefined;
      if (!current || current.leaseToken !== token || current.status !== 'running' || current.leaseUntil <= Date.now()) throw new SignalError(409, 'Collection lease lost.');
      if (!d || d.ownerUid !== uid || !d.watched) throw new SignalError(409, 'Watched collection cancelled.');
      verifySignalJobInputs(current, d);
      if (version !== null && version !== d.version) throw new SignalError(409, 'Desk changed.');
      if (current.runId && !d.runs.some(r => r.id === current.runId && r.status === 'running')) current.runId = undefined;
      // A retry closes the receipt left by a crashed worker before starting a fresh bounded attempt.
      const previousRun = current.runId ? d.runs.find(r => r.id === current.runId) : undefined;
      if (previousRun && previousRun.status === 'running' && firstWrite && job.attempts > 1 && d.runs.at(-1)?.id === previousRun.id) { previousRun.status = 'cancelled'; previousRun.endedAt = new Date().toISOString(); previousRun.error = 'Worker lease expired; evidence preserved for retry.'; }
      fn(d); const activeRun = d.runs.at(-1); if (activeRun?.status === 'running') tx.update(ref, { runId: activeRun.id }); d.version++; d.updatedAt = new Date().toISOString();
      if (Buffer.byteLength(JSON.stringify(d)) > 700000) throw new SignalError(413, 'Desk storage capacity reached.');
      tx.set(deskRef, JSON.parse(JSON.stringify(d))); return d;
    });
    firstWrite = false; return result;
  } };
  let status: SignalJob['status'] = 'succeeded'; let error = '';
  try { const result = await collectSignalDesk(uid, job.deskId, null, job.provider, undefined, fencedStore); const latest = result.runs.at(-1); if (latest?.status === 'cancelled') status = 'cancelled'; if (latest?.status === 'failed') { status = 'failed'; error = latest.error || 'Collection failed.'; } }
  catch (e) { status = e instanceof SignalError && e.status === 409 ? 'cancelled' : 'failed'; error = e instanceof Error ? e.message : 'Collection failed.'; }
  await db.runTransaction(async tx => {
    const [snap, deskSnap] = await Promise.all([tx.get(ref), tx.get(deskRef)]); const current = snap.data() as SignalJob;
    if (current?.leaseToken !== token) return;
    if (status === 'cancelled') { const d = deskSnap.data() as SignalDesk | undefined; const run = d?.runs.find(r => r.id === current.runId && r.status === 'running'); if (d?.ownerUid === uid && run) { run.status = 'cancelled'; run.error = error.slice(0, 1000); run.endedAt = new Date().toISOString(); d.version++; d.updatedAt = run.endedAt; tx.set(deskRef, JSON.parse(JSON.stringify(d))); } }
    tx.update(ref, { status, error: error.slice(0, 1000), leaseUntil: 0, leaseToken: null, updatedAt: new Date().toISOString() });
  });
  if (status === 'failed' && job.attempts < MAX_ATTEMPTS) throw new SignalError(503, 'Collection failed; bounded queue retry requested.');
  return { status };
}
export async function sweepSignalWatches(): Promise<{ scanned: number; enqueued: number; recovered: number; errors: number }> {
  const db = getAdminDbOrThrow(); const totals = { scanned: 0, enqueued: 0, recovered: 0, errors: 0 };
  // Cursor rotates through the global server-only registry; no client collection-group access.
  const cursorRef = db.collection('signalRuntime').doc('watchSweep'); const cursor = (await cursorRef.get()).data()?.cursor as string | undefined;
  let q = db.collectionGroup('signalDesks').where('watched', '==', true).orderBy('__name__').limit(30);
  if (cursor) q = q.startAfter(db.doc(cursor));
  let snapshot = await q.get(); if (snapshot.empty && cursor) snapshot = await db.collectionGroup('signalDesks').where('watched', '==', true).orderBy('__name__').limit(30).get();
  for (const doc of snapshot.docs) {
    totals.scanned++; const d = doc.data() as SignalDesk;
    if (doc.ref.parent.parent?.parent.id !== 'users' || d.ownerUid !== doc.ref.parent.parent.id) continue;
    const provider = d.sourcePack.feeds.some(f => f.allowCapture) ? 'rss' : d.sourcePack.allowGdelt ? 'gdelt' : null;
    if (!provider) continue;
    try { await enqueueSignalJob(d.ownerUid, d, provider); totals.enqueued++; } catch { totals.errors++; }
  }
  await cursorRef.set({ cursor: snapshot.docs.at(-1)?.ref.path || null, updatedAt: new Date().toISOString() });
  const abandoned = await db.collectionGroup('signalJobs').where('status', '==', 'running').limit(30).get();
  for (const doc of abandoned.docs) { const j = doc.data() as SignalJob; if (doc.ref.parent.parent?.parent.id !== 'users' || j.ownerUid !== doc.ref.parent.parent.id || j.leaseUntil > Date.now()) continue; await db.runTransaction(async tx => { const snap = await tx.get(doc.ref); const current = snap.data() as SignalJob; if (current?.status === 'running' && current.leaseUntil <= Date.now()) tx.update(doc.ref, { status: 'scheduled', dispatched: false, leaseToken: null, leaseUntil: 0 }); }); }
  const pending = await db.collectionGroup('signalJobs').where('status', '==', 'scheduled').limit(30).get();
  for (const doc of pending.docs) { const j = doc.data() as SignalJob; if (doc.ref.parent.parent?.parent.id !== 'users' || j.ownerUid !== doc.ref.parent.parent.id) continue; try { await dispatchSignalJob(j.ownerUid, j.id); totals.recovered++; } catch { totals.errors++; } }
  return totals;
}
