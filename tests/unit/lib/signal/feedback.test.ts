import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { appendSignalFeedback, MAX_SIGNAL_FEEDBACK } from '@/lib/signal/feedback';
import { approveBrief, capture, createDesk, draftBrief, propose, review } from '@/lib/signal/domain';
import { FeedbackInputSchema } from '@/lib/signal/schema';
import { signalStore } from '@/lib/signal/store';
import { GET, POST } from '@/app/api/signal/route';

const identity = vi.hoisted(() => ({ uid: 'owner' }));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: (req: NextRequest, user: { uid: string }) => unknown) => (req: NextRequest) => handler(req, { uid: identity.uid }) }));
vi.mock('@/lib/signal/store', async original => { const actual = await original<typeof import('@/lib/signal/store')>(); return { ...actual, signalStore: actual.memorySignalStore() }; });
vi.mock('@/lib/signal/capsules', () => ({ attachSignalContext: vi.fn() }));
vi.mock('@/lib/signal/collectors', () => ({ collectSignalDesk: vi.fn() }));
vi.mock('@/lib/signal/jobs', () => ({ setSignalWatch: vi.fn() }));
vi.mock('@/lib/signal/deletion', () => ({ deleteSignalDesk: vi.fn(), revokeSignalSnapshotExports: vi.fn() }));

const now = '2026-10-05T12:00:00.000Z';
const mandate = { name: 'Synthetic feedback desk', question: 'What makes the evidence view easier to inspect?', audience: 'Private demo reviewer', scope: { kind: 'country', label: 'Brazil', countries: ['BR'] }, languages: ['en'] };
const feedback = { area: 'Evidence', category: 'usability', rating: 4, message: '  Show the original quotation next to the review.  ', synthetic: true };
async function post(body: Record<string, unknown>) {
  return POST(new Request('https://praxis.example/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as NextRequest);
}
async function read(id: string) { return GET(new Request('https://praxis.example/api/signal?deskId=' + id) as NextRequest); }

describe('private SIGNAL product feedback', () => {
  beforeEach(() => { identity.uid = 'owner'; vi.clearAllMocks(); });
  it('defaults synthetic false while validating real bounds and all six areas', () => {
    const { synthetic: _synthetic, ...withoutFlag } = feedback;
    expect(FeedbackInputSchema.parse(withoutFlag).synthetic).toBe(false);
    for (const area of ['Overview', 'Coverage', 'Narratives', 'Evidence', 'Context', 'Briefs']) expect(FeedbackInputSchema.parse({ ...feedback, area }).area).toBe(area);
    for (const rating of [0, 6, 2.5, '4']) expect(FeedbackInputSchema.safeParse({ ...feedback, rating }).success).toBe(false);
    expect(FeedbackInputSchema.safeParse({ ...feedback, message: '    x   ' }).success).toBe(false);
    expect(FeedbackInputSchema.safeParse({ ...feedback, message: 'x'.repeat(1501) }).success).toBe(false);
  });
  it('adds server provenance and is compatible with a legacy desk lacking feedback', () => {
    const d = createDesk('owner', mandate, now); expect(d.feedback).toBeUndefined();
    const entry = appendSignalFeedback(d, 'owner', feedback, now);
    expect(entry).toMatchObject({ actorUid: 'owner', createdAt: now, deskVersion: 1, message: feedback.message.trim(), synthetic: true });
    expect(entry.id).toMatch(/^[a-f0-9]{32}$/); expect(d.feedback).toEqual([entry]);
    expect(() => appendSignalFeedback(d, 'other', feedback, now)).toThrow('Desk unavailable');
  });
  it('retains all thirty notes and rejects overflow without erasing prior feedback', () => {
    const d = createDesk('owner', mandate, now);
    for (let i = 0; i < MAX_SIGNAL_FEEDBACK; i++) appendSignalFeedback(d, 'owner', { ...feedback, message: `Synthetic feedback note ${i}` }, now);
    const prior = structuredClone(d.feedback);
    expect(() => appendSignalFeedback(d, 'owner', feedback, now)).toThrow('30 feedback-note');
    expect(d.feedback).toEqual(prior); expect(new Set(d.feedback!.map(f => f.id)).size).toBe(30);
  });
  it('persists through the authenticated action and reloads trimmed notes with pre-write version', async () => {
    const d = await signalStore.create('owner', mandate);
    const response = await post({ action: 'feedback', deskId: d.id, expectedVersion: d.version, ...feedback });
    expect(response.status).toBe(200); const saved = (await response.json()).desk;
    expect(saved.version).toBe(d.version + 1); expect(saved.feedback[0].deskVersion).toBe(d.version);
    const reloaded = await read(d.id); expect(reloaded.status).toBe(200);
    expect((await reloaded.json()).desk.feedback).toEqual(saved.feedback);
  });
  it('accepts feedback under stale context without changing evidence, knowledge or artifacts', async () => {
    const d = await signalStore.create('owner', mandate);
    const prepared = await signalStore.mutate('owner', d.id, d.version, value => {
      const text = 'SYNTHETIC: Talks remain conditional.';
      const source = capture(value, { title: 'Synthetic source', text, language: 'en', synthetic: true, rights: { basis: 'Owned fixture', allowExport: true } }, now);
      const claim = propose(value, { sourceRevisionId: source.id, proposition: 'Talks remain conditional', speaker: 'Synthetic spokesperson', quote: text, start: 0, end: text.length }, now);
      review(value, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Exact fixture reading' }, now);
      const brief = draftBrief(value, now);
      approveBrief(value, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Synthetic editorial approval' }, now);
      value.contextStale = true; value.contextReceipt = { capsuleVersion: '1.0.0', evidenceSpans: [] }; value.contextText = 'Quoted context';
    });
    const response = await post({ action: 'feedback', deskId: prepared.id, expectedVersion: prepared.version, ...feedback });
    expect(response.status).toBe(200); const after = (await response.json()).desk;
    for (const key of ['claims', 'reviews', 'briefs', 'sources', 'runs', 'usage', 'contextStale', 'contextReceipt', 'contextText']) expect(after[key]).toEqual(prepared[key as keyof typeof prepared]);
    expect(after.contextStale).toBe(true);
    expect(after.claims[0].status).toBe('accepted'); expect(after.briefs[0].status).toBe('approved');
  });
  it.each(['ownerUid', 'actorUid', 'createdAt', 'deskVersion', 'approval', 'capsuleId'])('rejects forged %s with 422 and no stored feedback', async forged => {
    const d = await signalStore.create('owner', mandate);
    const response = await post({ action: 'feedback', deskId: d.id, expectedVersion: d.version, ...feedback, [forged]: 'forged' });
    expect(response.status).toBe(422); expect((await signalStore.get('owner', d.id)).feedback).toBeUndefined();
  });
  it('rejects stale versions and second-tenant access without changing persisted feedback', async () => {
    const d = await signalStore.create('owner', mandate);
    expect((await post({ action: 'feedback', deskId: d.id, expectedVersion: d.version + 1, ...feedback })).status).toBe(409);
    identity.uid = 'other'; expect((await post({ action: 'feedback', deskId: d.id, expectedVersion: d.version, ...feedback })).status).toBe(404);
    expect((await read(d.id)).status).toBe(404);
    expect((await signalStore.get('owner', d.id)).feedback).toBeUndefined();
  });
  it('returns 429 for the persisted cap and preserves prior notes on reload', async () => {
    const d = await signalStore.create('owner', mandate);
    const full = await signalStore.mutate('owner', d.id, d.version, value => { for (let i = 0; i < MAX_SIGNAL_FEEDBACK; i++) appendSignalFeedback(value, 'owner', { ...feedback, message: `Synthetic feedback note ${i}` }, now); });
    const response = await post({ action: 'feedback', deskId: full.id, expectedVersion: full.version, ...feedback });
    expect(response.status).toBe(429); expect((await signalStore.get('owner', d.id)).feedback).toEqual(full.feedback);
  });
  it('does not add feedback while deletion is in progress', () => {
    const d = createDesk('owner', mandate, now); d.deletionRequestedAt = now;
    expect(() => appendSignalFeedback(d, 'owner', feedback, now)).toThrow('deletion is in progress'); expect(d.feedback).toBeUndefined();
  });
});
