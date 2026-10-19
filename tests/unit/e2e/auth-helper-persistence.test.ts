import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '@playwright/test';
import { finishOnboardingLater } from '../../e2e/helpers/auth';

vi.mock('@playwright/test', () => ({
  expect: (value: unknown) => ({
    toBeVisible: async () => {},
    toBeEnabled: async () => {},
    toBe: (expected: unknown) => expect(value).toBe(expected),
  }),
}));

function browser(status: number, navigationError = false) {
  const addCookies = vi.fn();
  const click = vi.fn(async () => {});
  const waitForURL = vi.fn(async () => {
    if (navigationError && waitForURL.mock.calls.length === 1) throw new Error('Navigation failed');
  });
  const page = {
    getByRole: () => ({ click }),
    waitForResponse: vi.fn(async () => ({ status: () => status })),
    waitForURL,
    goto: vi.fn(async () => {}),
    context: () => ({
      cookies: async () => [{ name: 'tacitus-auth-session', value: JSON.stringify({ token: 'unit-fixture' }) + '.fixture-signature' }],
      addCookies,
    }),
  };
  return { page: page as unknown as Page, addCookies, click, waitForURL };
}

beforeEach(() => vi.clearAllMocks());

describe('authenticated onboarding acceptance', () => {
  it('rejects failed persistence even if the app navigates', async () => {
    const fixture = browser(500);
    await expect(finishOnboardingLater(fixture.page, 'http://127.0.0.1:3000')).rejects.toThrow();
    expect(fixture.addCookies).not.toHaveBeenCalled();
  });

  it('does not manufacture a session when navigation fails', async () => {
    const fixture = browser(200, true);
    await expect(finishOnboardingLater(fixture.page, 'http://127.0.0.1:3000')).rejects.toThrow('Navigation failed');
    expect(fixture.addCookies).not.toHaveBeenCalled();
  });

  it('accepts server-confirmed persistence followed by app navigation', async () => {
    const fixture = browser(200);
    await finishOnboardingLater(fixture.page, 'http://127.0.0.1:3000');
    expect(fixture.click).toHaveBeenCalledOnce();
    expect(fixture.waitForURL).toHaveBeenCalledOnce();
    expect(fixture.addCookies).not.toHaveBeenCalled();
  });
});
