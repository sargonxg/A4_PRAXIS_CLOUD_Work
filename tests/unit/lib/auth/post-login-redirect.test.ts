import { describe, expect, it } from 'vitest';
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect';

describe('post-login redirect', () => {
  it('lands normal users on the Tasklet-style Home when no explicit app redirect is present', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams(), false, true)).toBe('/app/dashboard');
  });

  it('preserves safe explicit app redirects', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/assistant'), false, true)).toBe('/app/assistant');
  });

  it('keeps incomplete onboarding users in onboarding before the app shell', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('redirect=/app/dashboard'), false, false)).toBe('/onboarding');
  });

  it('keeps demo users on example workbench routes', () => {
    expect(resolvePostLoginRedirect(new URLSearchParams('example=syria-2026'), true, true)).toBe('/app/workbench/syria-2026');
  });
});
