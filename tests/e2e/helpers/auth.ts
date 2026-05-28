import { expect, type Page } from '@playwright/test';

const APP_OR_ONBOARDING = (url: URL) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding');

export function hasFirebaseCanaryCredentials(): boolean {
  return Boolean(process.env.TEST_FIREBASE_EMAIL && process.env.TEST_FIREBASE_PASSWORD);
}

export async function authenticateFirebaseCanary(
  page: Page,
  baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
  redirectPath = '/app',
) {
  const redirect = new URLSearchParams({ redirect: redirectPath }).toString();
  await page.goto(`${baseUrl}/login?${redirect}`);
  await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
  await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
  await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
  await page.waitForURL(APP_OR_ONBOARDING, { timeout: 30_000 });

  expect(page.url(), 'Firebase canary user must be onboarded before authenticated runtime tests').not.toContain('/onboarding');
  await expect(page.getByLabel(/Describe a task or responsibility/i)).toBeVisible({ timeout: 30_000 });
}
