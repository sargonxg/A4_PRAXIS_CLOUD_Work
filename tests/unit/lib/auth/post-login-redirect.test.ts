import { describe, expect, it } from 'vitest';
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect';

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
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/dashboard'), false, false)).toBe('/onboarding');
  });

  it('keeps legacy sample users on the user-owned dashboard', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('example=user-case'), true, true)).toBe('/app');
  });
});
