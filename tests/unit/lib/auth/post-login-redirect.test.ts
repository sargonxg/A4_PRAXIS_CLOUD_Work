import { describe, expect, it } from 'vitest';
import { resolvePostLoginRedirect, safeWorkspaceReturnTarget, resolveOnboardingReturnTarget } from '@/lib/auth/post-login-redirect';

describe('post-login redirect', () => {
  it('lands normal users on the Tasklet-style Home when no explicit app redirect is present', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams(), false, true)).toBe('/app');
  });

  it('preserves safe explicit app redirects', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/assistant'), false, true)).toBe('/app/assistant');
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/capsules'), false, true)).toBe('/app/capsules');
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/repository'), false, true)).toBe('/app/capsules?lane=repository');
  });

  it('rejects unsafe explicit app-like redirects', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app.evil.test'), false, true)).toBe('/app');
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=https://evil.test/app/capsules'), false, true)).toBe('/app');
  });

  it('preserves the system health settings return target', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/settings?tab=system'), false, true)).toBe('/app/settings?tab=system');
  });

  it('preserves safe explicit agent workspace redirects', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/agents/run_123'), false, true)).toBe('/agents/run_123');
  });

  it('keeps incomplete onboarding users in onboarding before the app shell', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/capsules/builder?question=Compare%20positions'), false, false)).toBe('/onboarding?redirect=%2Fapp%2Fcapsules%2Fbuilder');
  });

  it('keeps legacy sample users on the user-owned dashboard', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('example=user-case'), true, true)).toBe('/app');
  });

  it('preserves query-backed Home destinations through login and onboarding', () => {
    const target = '/app?panel=memo&handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4';
    expect(resolvePostLoginRedirect(new URLSearchParams({ redirect: target }), false)).toBe(target);
    const onboarding = resolvePostLoginRedirect(new URLSearchParams({ redirect: target }), false, false);
    expect(resolveOnboardingReturnTarget(new URLSearchParams(onboarding.split('?')[1]), false)).toBe(target);
    expect(resolveOnboardingReturnTarget(new URLSearchParams(onboarding.split('?')[1]), true)).toBe(target);
    expect(resolveOnboardingReturnTarget(new URLSearchParams(), true)).toBe('/app/capsules/builder?fromOnboarding=1');
    expect(resolveOnboardingReturnTarget(new URLSearchParams({ redirect: '/app' }), true)).toBe('/app/capsules/builder?fromOnboarding=1');
  });

  it.each(['//evil.test/app', '/app\\evil', '/app/%2f%2fevil.test', '/app/../login', '/agents/../../evil', '/app?x=\nsecret', '/app/%5csecret'])('rejects malformed return targets %s', (target) => {
    expect(safeWorkspaceReturnTarget(target)).toBeNull();
  });
});
