import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleVersionConflictError } from '@/lib/context/capsule-version-resolution';

const mocks = vi.hoisted(() => ({ enriched: vi.fn(), evidence: vi.fn(), model: vi.fn(), stream: vi.fn(), db: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/api/with-calibration', () => ({ withCalibration: () => (handler: unknown) => handler }));
vi.mock('@/lib/compat/sample-mode', () => ({ isServerDemoMode: () => false, hashInput: vi.fn(), getCachedResponse: vi.fn(), formatAsStreamResponse: vi.fn() }));
vi.mock('@/lib/knowledge/context-enrichment-adapter', () => ({ buildEnrichedTurnCapsule: mocks.enriched }));
vi.mock('@/lib/agent-runtime/evidence-pack', () => ({ buildCapsuleEvidencePack: mocks.evidence, formatEvidencePackPromptBlock: vi.fn() }));
vi.mock('@/lib/ai/providers', () => ({ getModel: mocks.model }));
vi.mock('@/lib/ai/ask-answer-stream', () => ({ streamAskAnswer: mocks.stream, readAskModelIdentity: vi.fn(), requireAnswerText: vi.fn() }));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: mocks.db, getAdminStorage: vi.fn(), getDefaultBucketName: vi.fn() }));

import { POST } from '@/app/api/ai/chat/route';

const user = { uid: 'user-1', isDemo: false, calibration: { systemPromptBlock: 'An analyst.',
  outputConstraints: { language: 'en', redLineClauses: [] }, path: null } };
const snapshot = { ownerUid: 'user-1', capsuleId: 'case', version: 2,
  coreRefs: { situationCoreId: 'historical-situation', documentCoreIds: ['document-A'], sourceCoreIds: ['source-A'] } };
type Handler = (request: Request, principal: typeof user) => Promise<Response>;
const post = () => (POST as unknown as Handler)(new Request('https://praxis.test/api/ai/chat', {
  method: 'POST', body: JSON.stringify({ capsuleId: 'case', messages: [{ role: 'user', content: 'Use only the attached evidence.' }],
    activeContextStack: { capsuleRefs: [{ capsuleId: 'case', role: 'situation', version: 2 }] } }),
}), user);

describe('Ask supplemental evidence version boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enriched.mockResolvedValue({ injectableContext: { capsule: snapshot, promptBlock: 'Attached capsule v2.' },
      retrievalPlan: { promptBlock: 'Retrieve attached evidence only.' } });
    mocks.evidence.mockRejectedValue(new CapsuleVersionConflictError('case', 2));
  });

  it('forwards the resolved v2 snapshot and treats a supplemental version conflict as recoverable before any provider call', async () => {
    const response = await post();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'capsule_version_unavailable',
      details: { capsuleId: 'case', requestedVersion: 2, recoverable: true, action: 'reattach_capsule' } });
    expect(mocks.evidence).toHaveBeenCalledExactlyOnceWith({ ownerUid: 'user-1', capsuleId: 'case', capsuleVersion: 2,
      resolvedCapsule: snapshot, objective: 'Use only the attached evidence.', maxParagraphs: 6 });
    expect(mocks.model).not.toHaveBeenCalled(); expect(mocks.stream).not.toHaveBeenCalled(); expect(mocks.db).not.toHaveBeenCalled();
  });

  it('does not downgrade an unavailable primary pin into a thin fallback or supplemental latest lookup', async () => {
    mocks.enriched.mockRejectedValueOnce(new CapsuleVersionConflictError('case', 2));
    const response = await post();
    expect(response.status).toBe(409);
    expect(mocks.evidence).not.toHaveBeenCalled(); expect(mocks.model).not.toHaveBeenCalled(); expect(mocks.stream).not.toHaveBeenCalled();
  });
});
