import { describe, expect, it } from 'vitest';
import { claimSignalJob, signalJobId, transitionSignalWatches, signalCollectionInputDigest, verifySignalJobInputs, type SignalJob } from '@/lib/signal/jobs';
import { createDesk } from '@/lib/signal/domain';
function job(): SignalJob { return { id: 'job', ownerUid: 'alice', deskId: 'desk', provider: 'rss', window: '2026-10-05T12', inputDigest: 'fixture', sourcePackVersion: 1, collectionWindowDays: 7, status: 'scheduled', attempts: 0, createdAt: '2026-10-05T12:00:00Z', updatedAt: '2026-10-05T12:00:00Z', leaseUntil: 0, leaseToken: null, dispatched: false }; }
const now = Date.parse('2026-10-05T12:01:00Z');
describe('SIGNAL durable job leases', () => {
  it('keys outbox work by owner, desk, provider, bounded window and panel revision', () => { const key = signalJobId('alice', 'desk', 'rss', 'hour1', 1); expect(signalJobId('alice', 'desk', 'rss', 'hour1', 1)).toBe(key); expect(signalJobId('bob', 'desk', 'rss', 'hour1', 1)).not.toBe(key); expect(signalJobId('alice', 'desk', 'rss', 'hour1', 2)).not.toBe(key); });
  it('enforces five watched desks, idempotent enables and slot release', () => {
    const ids = ['one', 'two', 'three', 'four', 'five']; expect(() => transitionSignalWatches(ids, 'six', true)).toThrow('up to 5 desks'); expect(transitionSignalWatches(ids, 'five', true)).toEqual(ids);
    const paused = transitionSignalWatches(ids, 'three', false); expect(paused).toHaveLength(4); expect(transitionSignalWatches(paused, 'six', true)).toHaveLength(5); expect(transitionSignalWatches(['one', 'one'], 'two', true)).toEqual(['one', 'two']);
    expect(transitionSignalWatches([...ids, 'legacy'], 'legacy', false)).toEqual(ids);
  });
  it('pins scheduled input configuration and cancels changed panels without consuming collection allowance', () => {
    const desk = createDesk('alice', { name: 'Pilot', question: 'What is changing?', audience: 'Analyst', scope: { kind: 'country', label: 'Ukraine', countries: ['UA'] }, languages: ['en'] });
    const scheduled = { ...job(), inputDigest: signalCollectionInputDigest(desk), sourcePackVersion: desk.sourcePack.version, collectionWindowDays: desk.windowDays };
    expect(() => verifySignalJobInputs(scheduled, desk)).not.toThrow();
    const oldKey = signalJobId('alice', desk.id, 'rss', scheduled.window, desk.sourcePack.version, scheduled.inputDigest);
    for (const change of [(d: typeof desk) => { d.scope.countries = ['US']; }, (d: typeof desk) => { d.languages = ['uk']; }, (d: typeof desk) => { d.windowDays = 1; }, (d: typeof desk) => { d.sourcePack.allowGdelt = true; }, (d: typeof desk) => { d.question = 'Another question'; }]) {
      const changed = structuredClone(desk); change(changed); expect(() => verifySignalJobInputs(scheduled, changed)).toThrow('new schedule'); expect(changed.usage.collections).toBe(0); expect(signalJobId('alice', changed.id, 'rss', scheduled.window, changed.sourcePack.version, signalCollectionInputDigest(changed))).not.toBe(oldKey);
    }
    expect(() => verifySignalJobInputs({ ...scheduled, inputDigest: '' }, desk)).toThrow('cancelled');
  });
  it('rejects concurrent dispatch but recovers a crashed worker after lease expiry', () => { const j = job(); expect(claimSignalJob(j, now, 'worker1')).toBe(true); expect(claimSignalJob(j, now + 1, 'worker2')).toBe(false); expect(claimSignalJob(j, now + 180001, 'worker2')).toBe(true); expect(j.leaseToken).toBe('worker2'); expect(j.attempts).toBe(2); });
  it('prevents cancellation and terminal success from restarting', () => { for (const status of ['succeeded', 'cancelled'] as const) { const j = { ...job(), status }; expect(claimSignalJob(j, now, 'worker')).toBe(false); expect(j.attempts).toBe(0); } });
  it('dead-letters expired and three-attempt jobs', () => { const j = { ...job(), attempts: 3, status: 'failed' as const }; expect(claimSignalJob(j, now, 'worker')).toBe(false); expect(j.error).toContain('operator recovery'); const stale = job(); expect(claimSignalJob(stale, now + 7 * 3600000, 'worker')).toBe(false); expect(stale.status).toBe('failed'); });
});
