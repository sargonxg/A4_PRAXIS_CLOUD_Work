import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from '@/proxy';

function request(path: string, session?: Record<string, unknown>) {
  const req = new NextRequest(`https://praxis.tacitus.me${path}`);
  if (session) req.cookies.set('tacitus-auth-session', `${JSON.stringify(session)}.test-routing-signature`);
  return req;
}

describe('proxy onboarding gate contract', () => {
  it('allows explicitly skipped onboarding sessions through authenticated app routes', () => {
    expect(proxy(request('/app', { token: 'fixture', onboardingSkipped: true })).headers.get('location')).toBeNull();
  });
  it('preserves the requested workspace and question through first-account onboarding', () => {
    const response = proxy(request('/app/capsules/builder?capsulePrompt=Compare%20positions', { token: 'fixture' }));
    const target = new URL(response.headers.get('location')!);
    expect(target.pathname).toBe('/onboarding');
    expect(target.searchParams.get('redirect')).toBe('/app/capsules/builder?capsulePrompt=Compare%20positions');
  });
  it('preserves the workspace target if the session expires on onboarding', () => {
    const response = proxy(request('/onboarding?redirect=%2Fapp%3Fpanel%3Dmemo'));
    const target = new URL(response.headers.get('location')!);
    expect(target.pathname).toBe('/login');
    expect(target.searchParams.get('redirect')).toBe('/app?panel=memo');
  });
});
