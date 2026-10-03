import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
const mocks = vi.hoisted(() => ({ inventory: vi.fn(), propose: vi.fn(), assist: vi.fn(), calibrated: vi.fn(), calibratedBody: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/api/with-calibration', () => ({ withCalibration: (...args: unknown[]) => { mocks.calibrated(...args); return (handler: (req: Request, user: unknown) => Promise<Response>) => async (req: Request) => { mocks.calibratedBody(await req.clone().json()); return handler(req, { uid: 'owner', isDemo: false, calibration: { systemPromptBlock: 'calibrated' } }); }; } }));
vi.mock('@/lib/cognitive-capsule/service', async (original) => ({ ...await original<Record<string, unknown>>(), getCognitiveCapsuleInventory: mocks.inventory, proposeCognitiveKnowledge: mocks.propose }));
vi.mock('@/lib/cognitive-capsule/model-assist', async (original) => ({ ...await original<Record<string, unknown>>(), assistCognitiveInterview: mocks.assist }));
type Handler = (req: Request, user: { uid: string; isDemo: boolean }, context: { params: Promise<{ capsuleId: string }> }) => Promise<Response>;
const user = { uid: 'owner', isDemo: false }; const context = { params: Promise.resolve({ capsuleId: 'owned' }) };
const input = { action: 'interview', mode: 'distinction', consent: true, messages: [{ role: 'user', content: 'Authorization is not expenditure.' }] };
const capture = { kind: 'distinction', label: 'Budget stages', scope: ['budget'], terms: ['authorization', 'expenditure'], body: 'Do not conflate the stages.' };
async function post(value: unknown, actor = user) {
  const route = await import('@/app/api/context/capsules/[capsuleId]/cognitive-assist/route');
  return (route.POST as unknown as Handler)(new Request('https://praxis.tacitus.me/api/context/capsules/owned/cognitive-assist', { method: 'POST', body: JSON.stringify(value), headers: { 'Content-Type': 'application/json' } }), actor, context);
}
describe('calibrated capsule interview route', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.inventory.mockResolvedValue({ cognition: createCognitiveCapsule('owned'), capsuleVersion: 1 }); mocks.assist.mockResolvedValue({ reply: 'What source would establish spending?', followUps: [], blindSpotSuggestions: [], capture: null, modelId: 'actual-matrix-model', reviewRequired: true }); });
  it('validates consent, body identity, sample boundary and owner before calibration or model calls', async () => {
    expect((await post({ ...input, consent: false })).status).toBe(400);
    expect((await post({ ...input, capsuleId: 'other' })).status).toBe(400);
    expect((await post(input, { ...user, isDemo: true })).status).toBe(403);
    mocks.inventory.mockResolvedValue(null); expect((await post(input)).status).toBe(404);
    expect(mocks.calibrated).not.toHaveBeenCalled(); expect(mocks.assist).not.toHaveBeenCalled();
  });
  it('makes ordinary interview turns read-only and runs through the existing calibrated tool', async () => {
    expect((await post(input)).status).toBe(200);
    expect(mocks.calibrated).toHaveBeenCalledWith('ask-praxis', 'ai_chat', expect.objectContaining({ blockOnThinContext: false }));
    expect(mocks.propose).not.toHaveBeenCalled(); expect(mocks.assist).toHaveBeenCalledOnce();
    expect(mocks.calibratedBody).toHaveBeenCalledWith(expect.objectContaining({ capsuleId: 'owned', activeContextStack: {
      capsuleId: 'owned', capsuleRefs: [{ capsuleId: 'owned', version: 1, role: 'primary', primary: true }],
    } }));
  });
  it('does not save when the model still needs missing expertise', async () => {
    const response = await post({ ...input, action: 'propose' });
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ persisted: false, capture: null });
    expect(mocks.propose).not.toHaveBeenCalled();
  });
  it('refuses an identity change between outer authentication and calibration', async () => {
    expect((await post(input, { uid: 'changed-owner', isDemo: false })).status).toBe(403);
    expect(mocks.assist).not.toHaveBeenCalled(); expect(mocks.propose).not.toHaveBeenCalled();
  });
  it('stages only exact server output through a model-authored review proposal', async () => {
    mocks.assist.mockResolvedValue({ reply: 'Ready for review.', followUps: [], blindSpotSuggestions: [], capture, modelId: 'actual-matrix-model', reviewRequired: true });
    mocks.propose.mockResolvedValue({ card: { reviewCardId: 'review', state: 'proposed' } });
    expect((await post({ ...input, action: 'propose' })).status).toBe(201);
    expect(mocks.propose).toHaveBeenCalledWith('owner', 'owned', expect.objectContaining(capture), undefined, { type: 'model', id: 'actual-matrix-model', expectedCapsuleVersion: 1 });
    expect((await post({ ...input, action: 'propose', capture: { ...capture, reviewState: 'accepted' } })).status).toBe(400);
  });
  it('checks current evidence and capsule version again after generation', async () => {
    mocks.assist.mockResolvedValue({ reply: 'Ready.', followUps: [], blindSpotSuggestions: [], capture: { ...capture, sourceRefs: ['invented'] }, modelId: 'matrix', reviewRequired: true });
    expect((await post({ ...input, action: 'propose' })).status).toBe(400); expect(mocks.propose).not.toHaveBeenCalled();
    mocks.assist.mockResolvedValue({ reply: 'Ready.', followUps: [], blindSpotSuggestions: [], capture, modelId: 'matrix', reviewRequired: true });
    mocks.inventory.mockResolvedValueOnce({ cognition: createCognitiveCapsule('owned'), capsuleVersion: 1 }).mockResolvedValueOnce({ cognition: createCognitiveCapsule('owned'), capsuleVersion: 2 });
    expect((await post({ ...input, action: 'propose' })).status).toBe(409); expect(mocks.propose).not.toHaveBeenCalled();
  });
  it('stops oversized streamed bodies before consuming the remaining input or charging', async () => {
    const cancelled = vi.fn(); let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { pulls++; controller.enqueue(new Uint8Array(20001)); }, cancel: cancelled }, { highWaterMark: 0 });
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognitive-assist/route');
    const request = new Request('https://praxis.tacitus.me/api/context/capsules/owned/cognitive-assist', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    const response = await (route.POST as unknown as Handler)(request, user, context);
    expect(response.status).toBe(413); expect(pulls).toBe(2); expect(cancelled).toHaveBeenCalledOnce();
    expect(mocks.inventory).not.toHaveBeenCalled(); expect(mocks.calibrated).not.toHaveBeenCalled();
  });
  it('returns a conflict when the persistence service detects a later saved version', async () => {
    mocks.assist.mockResolvedValue({ reply: 'Ready.', followUps: [], blindSpotSuggestions: [], capture, modelId: 'matrix', reviewRequired: true });
    mocks.propose.mockRejectedValue(Object.assign(new Error('The capsule changed.'), { status: 409 }));
    expect((await post({ ...input, action: 'propose' })).status).toBe(409);
  });
});
