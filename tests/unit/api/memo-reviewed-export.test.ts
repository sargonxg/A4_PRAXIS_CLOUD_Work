import { beforeEach, describe, expect, it, vi } from 'vitest';
import { memoOutputBodyHash } from '@/lib/memo/output-review';
import { signMemoHumanApproval } from '@/lib/memo/human-review-server';

const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/memo-service', () => ({ loadMemoById: mocks.load,
  primaryMemoBody: (blocks: Array<{ content: string }>) => blocks[0]?.content ?? '' }));
import { GET } from '@/app/api/memos/[id]/export/route';

const user = { uid: 'owner', name: 'Owner', email: 'owner@example.test', isDemo: false };
const context = { params: Promise.resolve({ id: 'memo-1' }) };
const invoke = (query = 'format=md&versionId=v1', principal = user) =>
  (GET as unknown as (req: Request, user: typeof principal, ctx: typeof context) => Promise<Response>)(
    new Request(`https://praxis.example.test/api/memos/memo-1/export?${query}`), principal, context);

describe('saved reviewed memo export', () => {
  beforeEach(async () => {
    const approval = signMemoHumanApproval({ memoId: 'memo-1', versionId: 'v1', reviewerUid: 'owner',
      bodyHash: await memoOutputBodyHash('Reviewed body'), approvedAt: '2026-09-30T12:00:00Z',
      intendedUse: 'internal-analysis', limitations: 'No field interviews.' });
    mocks.load.mockReset().mockResolvedValue({ memo: { id: 'memo-1', title: 'Policy memo', currentVersionId: 'v1', humanApproval: approval },
      versions: [{ id: 'v1', blocks: [{ content: 'Reviewed body' }] }] });
  });
  it('exports the saved body with precise internal-use scope and limitations', async () => {
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const text = await response.text();
    expect(text).toContain('Human review for: Internal analysis');
    expect(text).toContain('No field interviews.');
    expect(text).toContain('Reviewed body');
    expect(text).not.toContain('Human review for: Publication');
  });
  it.each(['forged', 'changed-body', 'wrong-reviewer', 'stale-version'])('blocks %s approval', async (caseName) => {
    const record = await mocks.load();
    if (caseName === 'forged') record.memo.humanApproval.attestation = 'client-written';
    if (caseName === 'changed-body') record.versions[0].blocks[0].content = 'New body';
    if (caseName === 'wrong-reviewer') record.memo.humanApproval = signMemoHumanApproval({ ...record.memo.humanApproval, reviewerUid: 'other' });
    if (caseName === 'stale-version') record.memo.currentVersionId = 'v2';
    expect((await invoke()).status).toBe(409);
  });
  it('requires an explicit saved version and rejects unsupported formats', async () => {
    expect((await invoke('format=md')).status).toBe(400);
    expect((await invoke('format=html&versionId=v1')).status).toBe(400);
  });
  it('does not export demo or missing records', async () => {
    expect((await invoke(undefined, { ...user, isDemo: true })).status).toBe(403);
    mocks.load.mockResolvedValue(null);
    expect((await invoke()).status).toBe(404);
  });
  it('produces a real Word package for the approved saved version', async () => {
    const response = await invoke('format=docx&versionId=v1');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('wordprocessingml');
    expect(Array.from(new Uint8Array(await response.arrayBuffer()).slice(0, 2))).toEqual([80, 75]);
  });
});
