import { afterEach, describe, expect, it, vi } from 'vitest';
const external = vi.hoisted(() => ({ vertex: vi.fn(), google: vi.fn(), pool: vi.fn() }));
vi.mock('@/lib/firebase/emulator-config', () => ({ serverFirebaseEmulators: () => ({ projectId: 'demo-praxis-local' }) }));
vi.mock('@ai-sdk/google', () => ({ createGoogleGenerativeAI: external.google }));
vi.mock('@ai-sdk/google-vertex', () => ({ createVertex: external.vertex }));
vi.mock('pg', () => ({ Pool: external.pool }));
import { getModel, getProModel } from '@/lib/ai/providers';
import { listRecentAgentRuns } from '@/lib/agent-runtime/postgres';
import { listCapsulePlusGraphRows } from '@/lib/capsule-plus/postgres';
describe('local persistence external boundaries', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('cannot create providers even when real-provider settings are inherited', () => {
    vi.stubEnv('GOOGLE_AI_API_KEY', 'synthetic-do-not-use');
    vi.stubEnv('GOOGLE_VERTEX_PROJECT', 'synthetic-cloud');
    expect(() => getModel()).toThrow();
    expect(() => getProModel()).toThrow();
    expect(external.vertex).not.toHaveBeenCalled(); expect(external.google).not.toHaveBeenCalled();
  });
  it('cannot construct a Postgres pool or run schema mutations', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://synthetic.invalid/never-connect');
    await expect(listRecentAgentRuns('owner')).rejects.toThrow('local lane');
    await expect(listCapsulePlusGraphRows({ ownerUid: 'owner', capsuleId: 'capsule-1' })).rejects.toThrow('local lane');
    expect(external.pool).not.toHaveBeenCalled();
  });
});
