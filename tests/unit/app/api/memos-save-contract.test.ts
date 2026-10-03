import { beforeEach, describe, expect, it, vi } from 'vitest';
const save = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/memo-service', () => ({ saveMemoDraft: save, loadMemoDraft: vi.fn(), MemoReviewConflictError: class extends Error {} }));
import { MemoReviewConflictError } from '@/lib/firebase/memo-service';
import { POST } from '@/app/api/memos/route';
const user = { uid: 'owner', isDemo: false };
const input = { caseId: 'project-1', templateId: 'policy-memo', title: 'Synthetic brief', graphSnapshotId: 'capsule:v1', expectedVersionId: null, operationId: 'operation-001', blocks: [{ id: 'memo-body', type: 'paragraph', content: 'Funding remains undecided.', citations: [], metadata: {} }] };
const invoke = (body: unknown, principal = user) => (POST as unknown as (req: Request, user: typeof principal) => Promise<Response>)(new Request('http://localhost/api/memos', { method: 'POST', body: JSON.stringify(body) }), principal);
describe('memo API version contract (controlled service)', () => {
  beforeEach(() => { save.mockReset().mockResolvedValue({ memo: { id: 'saved-1' }, versions: [{ id: 'v1' }] }); });
  it('requires explicit create/base revision and replay operation before any write', async () => {
    const { expectedVersionId: _base, ...withoutBase } = input;
    const { operationId: _operation, ...withoutOperation } = input;
    expect((await invoke(withoutBase)).status).toBe(400);
    expect((await invoke(withoutOperation)).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });
  it('passes authenticated identity and exact base to persistence', async () => {
    const response = await invoke(input);
    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalledWith('owner', input);
    expect((await response.json()).memo.id).toBe('saved-1');
  });
  it('returns a recoverable conflict and never returns false success for sample mode', async () => {
    save.mockRejectedValue(new MemoReviewConflictError('Reopen saved version.'));
    const conflict = await invoke(input);
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).code).toBe('memo_revision_conflict');
    save.mockClear();
    expect((await invoke(input, { ...user, isDemo: true })).status).toBe(403);
    expect(save).not.toHaveBeenCalled();
  });
});
