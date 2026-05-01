import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/api/with-calibration', () => ({
  withCalibration: () => (h: (req: Request, ctx: { uid: string; calibration: { systemPromptBlock: string; outputConstraints: { audienceTone: string }; provenance: { profileVersion: number } } }) => Promise<Response>) =>
    async (req: Request) => h(req, {
      uid: 'u1',
      calibration: {
        systemPromptBlock: '<analyst-profile/>',
        outputConstraints: { audienceTone: 'concise' },
        provenance: { profileVersion: 1 },
      },
    } as never),
}));

vi.mock('@/lib/ai/providers', () => ({
  getProModel: () => ({}),
  callProModel: vi.fn(async () => ({
    output: {
      headline: 'Nordalia deteriorating',
      body: 'Lines of effort remain stalled. Track 1 actors have not convened in 14 days. Risk monitor indicators trending up. Consider tabling escalation brief for senior leadership tomorrow.',
      suggestedTools: ['risk-monitor', 'early-warning'],
    },
  })),
}));

vi.mock('ai', () => ({
  Output: { object: (x: unknown) => x },
  generateText: vi.fn(async () => ({
    experimental_output: {
      headline: 'Nordalia deteriorating',
      body: 'Lines of effort remain stalled. Track 1 actors have not convened in 14 days. Risk monitor indicators trending up. Consider tabling escalation brief for senior leadership tomorrow.',
      suggestedTools: ['risk-monitor', 'early-warning'],
    },
  })),
}));

vi.mock('@/lib/api/save-tool-output', () => ({
  saveToolOutput: vi.fn(async () => undefined),
}));

vi.mock('@/lib/ai/situation-context', () => ({
  buildToolContext: () => 'minimal context',
  buildWebGroundedContext: vi.fn(async () => 'minimal web context'),
}));

describe('dashboard-summary route', () => {
  it('returns a Daily read for a minimal situation', async () => {
    const { POST } = await import('@/app/api/ai/dashboard-summary/route');
    const res = await POST(new Request('http://localhost/api/ai/dashboard-summary', {
      method: 'POST',
      body: JSON.stringify({ situation: { id: 's1', name: 'Nordalia', type: 'war' } }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.headline).toBeDefined();
    expect(json.suggestedTools).toBeInstanceOf(Array);
  });
});
