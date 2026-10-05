import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ snapshot: null as unknown, credits: vi.fn(), calls: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: (req: Request, user: { uid: string }) => Promise<Response>) => (req: Request) => handler(req, { uid: 'owner' }) }));
vi.mock('@/lib/api/with-calibration', () => ({ withCalibration: () => (handler: (req: Request, ctx: unknown) => Promise<Response>) => async (req: Request) => { state.credits(); return handler(req, { uid: 'owner', calibration: { systemPromptBlock: 'Calibrated' } }); } }));
vi.mock('@/lib/signal/world-service', () => ({ getSignalWorld: async () => { state.calls(); return state.snapshot; } }));
vi.mock('ai', () => ({ generateText: vi.fn(), Output: { object: (v: unknown) => v } }));
vi.mock('@/lib/ai/providers', () => ({ getModel: vi.fn() }));
vi.mock('@/lib/ai/model-runtime-policy', () => ({ getAskPraxisModelRuntimePolicy: () => ({ frontierPrimary: { chatModelId: 'primary' }, stableFallback: { chat: [] } }) }));
import { POST } from '@/app/api/ai/signal-world/route';
import { generateText } from 'ai';
const validBody = { question: 'What is actually reported?', countryCode: 'BR' };
const request = (raw: string) => new Request('https://praxis.example/api/ai/signal-world', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw });
beforeEach(() => { state.credits.mockClear(); state.calls.mockClear(); vi.mocked(generateText).mockReset(); state.snapshot = { updatedAt: '2026-10-05T12:00:00.000Z', countries: [{ code: 'BR', name: 'Brazil', metrics: [], headlines: [] }] }; });
describe('world research preflight before credits', () => {
  it.each(['malformed', 'unknown-country', 'forged-field', 'too-large', 'no-data'])('blocks %s before calibration or model access', async scenario => {
    const body = scenario === 'malformed' ? '{bad' : scenario === 'unknown-country' ? JSON.stringify({ ...validBody, countryCode: 'ZZ' }) : scenario === 'forged-field' ? JSON.stringify({ ...validBody, ownerUid: 'forged' }) : scenario === 'too-large' ? 'x'.repeat(64001) : JSON.stringify(validBody);
    const response = await POST(request(body)); expect(response.status).toBe(scenario === 'too-large' ? 413 : scenario === 'no-data' ? 503 : 422); expect(state.credits).not.toHaveBeenCalled(); expect(generateText).not.toHaveBeenCalled();
  });
  it('retains calibrated credit gating and the exact preflighted evidence for valid data', async () => {
    state.snapshot = { updatedAt: '2026-10-05T12:00:00.000Z', countries: [{ code: 'BR', name: 'Brazil', metrics: [{ status: 'available', value: 123, year: 2024, indicator: 'population', label: 'Population', unit: 'people', providerUrl: 'https://api.worldbank.org/v2/country/BRA' }], headlines: [] }] };
    vi.mocked(generateText).mockResolvedValue({ output: { observations: [{ text: 'The reported fixture population is 123 people in 2024.', kind: 'reported-data', citationIds: ['metric-BR-population-2024'] }], limitations: [] }, usage: { totalTokens: 8 } } as never);
    const response = await POST(request(JSON.stringify(validBody))); expect(response.status).toBe(200); expect(state.credits).toHaveBeenCalledTimes(1); expect(state.calls).toHaveBeenCalledTimes(1); expect(generateText).toHaveBeenCalledTimes(1); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    const data = await response.json(); expect(data.reviewRequired).toBe(true); expect(data.sources[0].url).toBe('https://api.worldbank.org/v2/country/BRA');
  });
});
