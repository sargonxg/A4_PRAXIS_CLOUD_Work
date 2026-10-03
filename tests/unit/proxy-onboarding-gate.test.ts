import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { proxy } from '@/proxy';

function request(path: string, session?: Record<string, unknown>) {
  const req = new NextRequest(`https://praxis.tacitus.me${path}`);
  if (session) req.cookies.set('tacitus-auth-session', `${JSON.stringify(session)}.test-routing-signature`);
  return req;
}

describe('proxy onboarding gate contract', () => {
  it('cleans legacy incoming login URLs before rendering and retains safe destination', () => {
    const response = proxy(request('/login?capsulePrompt=Private&redirect=%2Fapp%2Fprojects%3FprojectId%3Dp123%26prompt%3DPrivate&mode=signup'));
    const target = new URL(response.headers.get('location')!);
    expect(target.pathname).toBe('/login');
    expect(target.searchParams.get('redirect')).toBe('/app/projects?projectId=p123');
    expect(target.searchParams.get('mode')).toBe('signup');
    expect(target.href).not.toContain('Private');
    expect(proxy(request(`${target.pathname}${target.search}`)).headers.get('location')).toBeNull();
  });
  it('allows webpack evaluation only for guarded local emulator development', () => {
    const env = { PRAXIS_LOCAL_EMULATORS: 'true', NEXT_PUBLIC_PRAXIS_LOCAL_EMULATORS: 'true', GCLOUD_PROJECT: 'demo-praxis-local', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-praxis-local', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', NODE_ENV: 'development' };
    try {
      for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
      const csp = proxy(request('/login')).headers.get('Content-Security-Policy');
      expect(csp).toContain("'unsafe-eval'"); expect(csp).toContain('http://127.0.0.1:9099');
      vi.stubEnv('NODE_ENV', 'production'); expect(proxy(request('/login')).headers.get('Content-Security-Policy')).not.toContain("'unsafe-eval'");
    } finally { vi.unstubAllEnvs(); }
    expect(proxy(request('/login')).headers.get('Content-Security-Policy')).not.toContain("'unsafe-eval'");
  });
  it('allows explicitly skipped onboarding sessions through authenticated app routes', () => {
    expect(proxy(request('/app', { token: 'fixture', onboardingSkipped: true })).headers.get('location')).toBeNull();
  });
  it('preserves the requested workspace and removes legacy question text through onboarding', () => {
    const response = proxy(request('/app/capsules/builder?capsulePrompt=Compare%20positions', { token: 'fixture' }));
    const target = new URL(response.headers.get('location')!);
    expect(target.pathname).toBe('/onboarding');
    expect(target.searchParams.get('redirect')).toBe('/app/capsules/builder');
  });
  it('preserves the workspace target if the session expires on onboarding', () => {
    const response = proxy(request('/onboarding?redirect=%2Fapp%3Fpanel%3Dmemo'));
    const target = new URL(response.headers.get('location')!);
    expect(target.pathname).toBe('/login');
    expect(target.searchParams.get('redirect')).toBe('/app?panel=memo');
  });
});
