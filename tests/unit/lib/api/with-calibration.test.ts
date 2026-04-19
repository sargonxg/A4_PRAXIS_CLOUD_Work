import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: unknown) => h,    // pass-through for test
}));
vi.mock('@/lib/api/with-credits', () => ({
  checkAndDeductCreditsForUid: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock('@/lib/context/profile-context', () => ({
  buildCalibratedContext: vi.fn().mockResolvedValue({
    systemPromptBlock: '<analyst-profile>X</analyst-profile>',
    outputConstraints: { language: 'en', audienceTone: 'myself', redLineClauses: [], styleHint: 'rapid_brief' },
    toolContext: { profile: null, situation: null, retrievedChunks: [] },
    provenance: { profileVersion: 0, situationVersion: null, generatedAt: '2026-04-18T00:00:00Z' },
  }),
}));
vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: vi.fn().mockResolvedValue({ meta: { completedAt: new Date() } }),
}));

import { withCalibration } from '@/lib/api/with-calibration';
import { buildCalibratedContext } from '@/lib/context/profile-context';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';

describe('withCalibration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default: completed onboarding profile
    (getAnalystProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ meta: { completedAt: new Date() } });
  });

  it('injects calibration into handler', async () => {
    const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    const route = withCalibration('risk-monitor', 'ai_risk_assessment')(handler);
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify({ situationId: 's1' }) });
    // pass-through withAuth means the test handler is called directly with a synthetic user
    const user = { uid: 'u1', email: 'a@b', name: 'A', isDemo: false };
    const res = await (route as unknown as (r: Request, u: typeof user) => Promise<Response>)(req, user);
    expect(buildCalibratedContext).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'u1', toolId: 'risk-monitor', situationId: 's1',
    }));
    expect(handler).toHaveBeenCalledWith(expect.any(Request), expect.objectContaining({
      uid: 'u1',
      calibration: expect.objectContaining({ systemPromptBlock: expect.stringContaining('analyst-profile') }),
    }));
    expect(res.status).toBe(200);
  });

  it('returns 402 when credits insufficient', async () => {
    const { checkAndDeductCreditsForUid } = await import('@/lib/api/with-credits');
    (checkAndDeductCreditsForUid as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      response: new Response('{"error":"low"}', { status: 402, headers: { 'Content-Type': 'application/json' } }),
    });
    const handler = vi.fn();
    const route = withCalibration('risk-monitor', 'ai_risk_assessment')(handler);
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify({}) });
    const res = await (route as unknown as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(req, { uid: 'u1', email: '', name: '', isDemo: false });
    expect(res.status).toBe(402);
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 403 when non-demo user has no completed onboarding profile', async () => {
    (getAnalystProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const handler = vi.fn();
    const route = withCalibration('risk-monitor', 'ai_risk_assessment')(handler);
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify({}) });
    const res = await (route as unknown as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(req, { uid: 'u1', email: '', name: '', isDemo: false });
    expect(res.status).toBe(403);
    const body = await res.json() as { error: string; redirectTo: string };
    expect(body.error).toBe('Onboarding required');
    expect(body.redirectTo).toBe('/onboarding');
    expect(handler).not.toHaveBeenCalled();
  });

  it('bypasses onboarding gate for demo users', async () => {
    (getAnalystProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    const route = withCalibration('risk-monitor', 'ai_risk_assessment')(handler);
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify({}) });
    const res = await (route as unknown as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(req, { uid: 'demo-user-001', email: '', name: '', isDemo: true });
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });
});
