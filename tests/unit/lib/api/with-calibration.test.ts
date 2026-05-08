import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: unknown) => h,    // pass-through for test
}));
vi.mock('@/lib/api/with-credits', () => ({
  checkAndDeductCreditsForUid: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock('@/lib/api/with-context-aware', () => ({
  withContextAware: vi.fn().mockResolvedValue({
    headers: new Headers(),
    snapshot: {
      user: {
        uid: 'u1',
        workspaceId: 'personal-u1',
        identity: { displayName: 'A', role: 'analyst' },
        preferences: {},
        capturedAt: {},
      },
      workspace: {
        workspaceId: 'personal-u1',
        ownerUid: 'u1',
        label: 'Personal workspace',
        guidelines: [],
        methodologyDocs: ['Structured analytic technique notes'],
      },
      case: {
        caseId: 's1',
        ownerUid: 'u1',
        ontologyId: 'conflict',
        frame: { name: 'Case', summary: 'A real enough situation summary for prompt health.' },
        sourceCount: 2,
        documentCount: 1,
        graphNodeCount: 8,
        graphEdgeCount: 4,
        contextHealth: {
          score: 86,
          threshold: 60,
          ready: true,
          lowestDimension: { id: 'sources', label: 'Sources', score: 86, detail: 'Sources are adequate.' },
        },
      },
      conversation: {
        sessionId: 'test-session',
        startedAt: '2026-05-08T00:00:00.000Z',
        workbenchTab: 'tools',
        recentActions: [],
      },
      composite: {
        health: 86,
        weakestLayer: 'case',
        advisories: [],
      },
    },
  }),
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
  getAnalystProfile: vi.fn().mockResolvedValue(completeProfile()),
}));

import { AI_REQUEST_LIMITS } from '@/lib/api/ai-request-limits';
import { withCalibration } from '@/lib/api/with-calibration';
import { buildCalibratedContext } from '@/lib/context/profile-context';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';

function completeProfile() {
  return {
    identity: {
      role: 'analyst',
      seniority: 'senior',
      org: '',
      team: '',
    },
    perspective: {
      mandate: 'Provide grounded policy analysis for complex political and conflict situations.',
      lenses: ['diplomatic'],
      regions: ['global'],
      audience: 'myself',
      primaryDomain: 'conflict',
      secondaryDomains: [],
    },
    workingStyle: {
      sourceCategories: ['foundational'],
      language: 'en',
      redLines: [],
      analyticalStyle: 'rapid_brief',
    },
    meta: {
      version: 1,
      completedAt: new Date(),
      lastEditedAt: null,
      skipCount: 0,
      createdAt: null,
      deletedAt: null,
    },
  };
}

describe('withCalibration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default: completed onboarding profile
    (getAnalystProfile as ReturnType<typeof vi.fn>).mockResolvedValue(completeProfile());
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
      calibration: expect.objectContaining({
        systemPromptBlock: expect.stringContaining('Current PRAXIS Tool Contract: Risk Monitor'),
      }),
    }));
    expect(res.status).toBe(200);
  });

  it('derives situationId from a nested situation object when body.situationId is absent', async () => {
    const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    const route = withCalibration('chat', 'ai_chat')(handler);
    const req = new Request('http://x', {
      method: 'POST',
      body: JSON.stringify({ situation: { id: 's-nested', name: 'Nested situation' } }),
    });
    const user = { uid: 'u1', email: 'a@b', name: 'A', isDemo: false };

    const res = await (route as unknown as (r: Request, u: typeof user) => Promise<Response>)(req, user);

    expect(buildCalibratedContext).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'u1',
      toolId: 'chat',
      situationId: 's-nested',
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

  it('rejects oversized AI request bodies before credits or calibration', async () => {
    const { checkAndDeductCreditsForUid } = await import('@/lib/api/with-credits');
    const handler = vi.fn();
    const route = withCalibration('chat', 'ai_chat')(handler);
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(AI_REQUEST_LIMITS.maxTextChars + 1) }] }),
    });

    const res = await (route as unknown as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(
      req,
      { uid: 'u1', email: '', name: '', isDemo: false },
    );
    const body = await res.json() as { error: string; message: string };

    expect(res.status).toBe(413);
    expect(body.error).toBe('ai_request_too_large');
    expect(handler).not.toHaveBeenCalled();
    expect(getAnalystProfile).not.toHaveBeenCalled();
    expect(checkAndDeductCreditsForUid).not.toHaveBeenCalled();
    expect(buildCalibratedContext).not.toHaveBeenCalled();
  });

  it('rejects excessive chat history before credits or calibration', async () => {
    const { checkAndDeductCreditsForUid } = await import('@/lib/api/with-credits');
    const handler = vi.fn();
    const route = withCalibration('chat', 'ai_chat')(handler);
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: Array.from({ length: AI_REQUEST_LIMITS.maxMessages + 1 }, () => ({ role: 'user', content: 'hello' })),
      }),
    });

    const res = await (route as unknown as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(
      req,
      { uid: 'u1', email: '', name: '', isDemo: false },
    );
    const body = await res.json() as { error: string; details: { maxMessages: number; receivedMessages: number } };

    expect(res.status).toBe(413);
    expect(body.error).toBe('ai_request_too_many_messages');
    expect(body.details.maxMessages).toBe(AI_REQUEST_LIMITS.maxMessages);
    expect(handler).not.toHaveBeenCalled();
    expect(getAnalystProfile).not.toHaveBeenCalled();
    expect(checkAndDeductCreditsForUid).not.toHaveBeenCalled();
    expect(buildCalibratedContext).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON requests before credits or calibration', async () => {
    const { checkAndDeductCreditsForUid } = await import('@/lib/api/with-credits');
    const handler = vi.fn();
    const route = withCalibration('chat', 'ai_chat')(handler);
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"messages":',
    });

    const res = await (route as unknown as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(
      req,
      { uid: 'u1', email: '', name: '', isDemo: false },
    );
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe('malformed_json');
    expect(handler).not.toHaveBeenCalled();
    expect(getAnalystProfile).not.toHaveBeenCalled();
    expect(checkAndDeductCreditsForUid).not.toHaveBeenCalled();
    expect(buildCalibratedContext).not.toHaveBeenCalled();
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
