import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAndDeductCredits, checkAndDeductCreditsForUid, refundCredits } from '@/lib/api/with-credits';

const mocks = vi.hoisted(() => ({ db: null as unknown, session: JSON.stringify({ token: 'verified-fixture' }), dbReads: 0 }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: mocks.session }) }) }));
vi.mock('@/lib/auth/cookie-signer', () => ({ verifyCookie: (value: string) => value }));
vi.mock('@/lib/firebase/admin', () => ({ verifyIdToken: async () => ({ uid: 'owner' }), getAdminDbOrThrow: () => { mocks.dbReads++; if (!mocks.db) throw new Error('temporary datastore outage'); return mocks.db; } }));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { increment: (amount: number) => ({ increment: amount }), serverTimestamp: () => 'server-time' } }));

describe('enforced AI usage reservation', () => {
  beforeEach(() => { mocks.db = null; mocks.dbReads = 0; mocks.session = JSON.stringify({ token: 'verified-fixture' }); });

  it('allows only the funded number of concurrent calls and never overspends', async () => {
    const db = new LedgerDb({ 'users/owner': { credits: 20, totalCreditsUsed: 0 } }); mocks.db = db;
    const results = await Promise.all(Array.from({ length: 8 }, () => checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask')));
    expect(results.filter((result) => result.allowed)).toHaveLength(2);
    for (const result of results.filter((result) => !result.allowed)) {
      if (result.allowed) continue;
      expect(result.response.status).toBe(429);
      expect(await result.response.json()).toMatchObject({ code: 'ai_usage_limit', retryable: false, supportUrl: 'mailto:hello@tacitus.me' });
      expect(result.response.headers.get('retry-after')).toBeNull();
    }
    expect(db.rows.get('users/owner')).toMatchObject({ credits: 0, totalCreditsUsed: 20 });
    expect([...db.rows.keys()].filter((key) => key.startsWith('credit_transactions/'))).toHaveLength(2);
  });

  it('checks owner balance and workspace cap in one transaction with no partial charges', async () => {
    const db = new LedgerDb({ 'users/owner': { credits: 100, totalCreditsUsed: 0 }, 'users/owner/situations/case': { monthlyCreditCap: 20, monthlyCreditsUsed: 0 } }); mocks.db = db;
    const results = await Promise.all(Array.from({ length: 4 }, () => checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask', 'case')));
    expect(results.filter((result) => result.allowed)).toHaveLength(2);
    expect(db.rows.get('users/owner')).toMatchObject({ credits: 80, totalCreditsUsed: 20 });
    expect(db.rows.get('users/owner/situations/case')).toMatchObject({ monthlyCreditsUsed: 20 });
    db.rows.set('users/owner', { credits: 0, totalCreditsUsed: 20 });
    const workspace = { ...db.rows.get('users/owner/situations/case')!, monthlyCreditsUsed: 0 }; db.rows.set('users/owner/situations/case', workspace);
    await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask', 'case');
    expect(db.rows.get('users/owner/situations/case')).toEqual(workspace);
  });

  it.each(['deleting', 'deleted'])('refuses reservations for an account marked %s inside the transaction', async (accountDeletionStatus) => {
    const account = { credits: 100, totalCreditsUsed: 0, accountDeletionStatus };
    const db = new LedgerDb({ 'users/owner': account }); mocks.db = db;
    const result = await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.response.status).toBe(409);
    expect(db.rows.get('users/owner')).toEqual(account);
    expect(db.rows.size).toBe(1);
  });

  it('never recreates a missing/deleted profile or grants another signup allowance', async () => {
    const db = new LedgerDb({}); mocks.db = db;
    const result = await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.response.status).toBe(409);
    expect(db.rows.size).toBe(0);
  });

  it.each(['unmapped-operation', 'toString', '__proto__'])('fails closed for unknown operation %s before reserving capacity', async (operation) => {
    const db = new LedgerDb({ 'users/owner': { credits: 1000 } }); mocks.db = db;
    const result = await checkAndDeductCreditsForUid('owner', operation, 'Unknown action');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.response.status).toBe(503);
    expect(mocks.dbReads).toBe(0);
    expect(db.rows.get('users/owner')).toEqual({ credits: 1000 });
  });

  it('returns retryable 503 before providers on datastore outage and preserves the session entrypoint cap', async () => {
    const outage = await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask');
    expect(outage.allowed).toBe(false);
    if (!outage.allowed) expect(await outage.response.json()).toMatchObject({ retryable: true });
    mocks.db = new LedgerDb({ 'users/owner': { credits: 0 } });
    const depleted = await checkAndDeductCredits('ai_chat', 'Ask');
    expect(depleted.allowed).toBe(false);
    if (!depleted.allowed) expect(depleted.response.status).toBe(429);
  });

  it.each([NaN, Infinity])('fails closed before database access for nonfinite operation multipliers (%s)', async (costMultiplier) => {
    const result = await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask', undefined, { costMultiplier });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.response.status).toBe(503);
    expect(mocks.dbReads).toBe(0);
  });

  it('never grants unfunded provider execution to a public sample session', async () => {
    mocks.session = JSON.stringify({ demo: true });
    const result = await checkAndDeductCredits('ai_chat', 'Sample Ask');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.response.status).toBe(403);
      expect(await result.response.json()).toMatchObject({ code: 'sample_mode_ai_unavailable' });
    }
    expect(mocks.dbReads).toBe(0);
  });

  it('bounds heavier operation multipliers and charges before allowing execution', async () => {
    const db = new LedgerDb({ 'users/owner': { credits: 100, totalCreditsUsed: 0 } }); mocks.db = db;
    expect(await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask', undefined, { costMultiplier: 100 })).toEqual({ allowed: true });
    expect(db.rows.get('users/owner')).toMatchObject({ credits: 70, totalCreditsUsed: 30 });
  });

  it('returns retryable 503 with no debit when the reservation cannot commit', async () => {
    const account = { credits: 100, totalCreditsUsed: 0 };
    const db = new LedgerDb({ 'users/owner': account }); db.failCommit = true; mocks.db = db;
    const result = await checkAndDeductCreditsForUid('owner', 'ai_chat', 'Ask');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.response.status).toBe(503);
      expect(result.response.headers.get('retry-after')).toBe('15');
    }
    expect(db.rows.get('users/owner')).toEqual(account);
    expect(db.rows.size).toBe(1);
  });

  it.each([null, 'deleting', 'deleted'])('never recreates a missing or %s owner on refunds', async (accountDeletionStatus) => {
    const initial: Record<string, Row> = accountDeletionStatus ? { 'users/owner': { credits: 100, accountDeletionStatus } } : {};
    const db = new LedgerDb(initial); mocks.db = db;
    await refundCredits('ai_chat', 'Failed Ask');
    expect(Object.fromEntries(db.rows)).toEqual(initial);
  });
});

type Row = Record<string, unknown>;
class LedgerDb {
  rows: Map<string, Row>;
  private sequence = 0;
  failCommit = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(initial: Record<string, Row>) { this.rows = new Map(Object.entries(initial)); }
  collection(path: string) { return { doc: (id?: string) => new Ref(this, `${path}/${id ?? `receipt-${++this.sequence}`}`) }; }
  runTransaction<T>(callback: (tx: { get: (ref: Ref) => Promise<{ exists: boolean; data: () => Row | undefined }>; set: (ref: Ref, body: Row, opts?: { merge?: boolean }) => void; update: (ref: Ref, body: Row) => void }) => Promise<T>): Promise<T> {
    const work = this.queue.then(async () => {
      const writes: Array<() => void> = [];
      const result = await callback({ get: async (ref) => { if (writes.length) throw new Error('Firestore requires all reads before writes'); const row = this.rows.get(ref.path); return { exists: Boolean(row), data: () => row && { ...row } }; }, set: (ref, body, opts) => { writes.push(() => this.write(ref.path, body, opts?.merge)); }, update: (ref, body) => { writes.push(() => this.write(ref.path, body, true)); } });
      if (this.failCommit) throw new Error('temporary transaction commit failure');
      writes.forEach((write) => write()); return result;
    });
    this.queue = work.catch(() => {}); return work;
  }
  write(path: string, body: Row, merge = false) { const row = merge ? { ...this.rows.get(path) } : {}; for (const [key, value] of Object.entries(body)) row[key] = value && typeof value === 'object' && 'increment' in value ? Number(row[key] ?? 0) + Number(value.increment) : value; this.rows.set(path, row); }
}
class Ref {
  constructor(private db: LedgerDb, readonly path: string) {}
  collection(path: string) { return this.db.collection(`${this.path}/${path}`); }
  async set(body: Row, opts?: { merge?: boolean }) { this.db.write(this.path, body, opts?.merge); }
}
