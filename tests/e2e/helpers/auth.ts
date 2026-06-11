import { createHmac } from 'crypto';
import { expect, type Page } from '@playwright/test';

const APP_OR_ONBOARDING = (url: URL) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding');
const SESSION_COOKIE = 'tacitus-auth-session';

export type FirebaseCanaryCredentials = {
  email?: string;
  password?: string;
};

export type AuthenticateFirebaseCanaryOptions = {
  allowOnboarding?: boolean;
  expectComposer?: boolean;
  finishOnboardingLater?: boolean;
};

export function getFirebaseCanaryCredentials(): FirebaseCanaryCredentials {
  return {
    email: process.env.TEST_FIREBASE_EMAIL ?? process.env.PRAXIS_CANARY_EMAIL,
    password: process.env.TEST_FIREBASE_PASSWORD ?? process.env.PRAXIS_CANARY_PASSWORD,
  };
}

export function hasFirebaseCanaryCredentials(): boolean {
  const credentials = getFirebaseCanaryCredentials();
  return Boolean(credentials.email && credentials.password);
}

export function canaryCredentialSkipReason(): string {
  return 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD or PRAXIS_CANARY_EMAIL/PRAXIS_CANARY_PASSWORD not set';
}

export function isOnboardingUrl(page: Page): boolean {
  return new URL(page.url()).pathname.startsWith('/onboarding');
}

export async function authenticateFirebaseCanary(
  page: Page,
  baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
  redirectPath = '/app',
  options: AuthenticateFirebaseCanaryOptions = {},
) {
  const credentials = getFirebaseCanaryCredentials();
  if (!credentials.email || !credentials.password) {
    throw new Error(canaryCredentialSkipReason());
  }

  const redirect = new URLSearchParams({ redirect: redirectPath }).toString();
  await page.goto(`${baseUrl}/login?${redirect}`);
  await page.evaluate(() => localStorage.setItem('praxis-tour-seen', 'true')).catch(() => {});
  await page.fill('input[type=email]', credentials.email);
  await page.fill('input[type=password]', credentials.password);
  await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
  await page.waitForURL(APP_OR_ONBOARDING, { timeout: 30_000 });

  if (options.finishOnboardingLater && isOnboardingUrl(page)) {
    await finishOnboardingLater(page, baseUrl);
  }

  if (!options.allowOnboarding) {
    expect(page.url(), 'Firebase canary user must be onboarded before authenticated runtime tests').not.toContain('/onboarding');
  }

  if (!isOnboardingUrl(page)) {
    await expectSignedInAppShell(page);
    if (options.expectComposer !== false) {
      await expect(page.getByLabel(/Describe a task or responsibility/i)).toBeVisible({ timeout: 30_000 });
    }
  }
}

export async function finishOnboardingLater(page: Page, baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000') {
  await expect(page.getByRole('heading', { name: /Set up your analyst profile|Review your analyst profile/i })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Finish later/i }).click();
  try {
    await page.waitForURL(/\/app/, { timeout: 30_000 });
    return;
  } catch (err) {
    if (!isLocalBaseUrl(baseUrl) || !(await installLocalOnboardingSkippedSession(page, baseUrl))) {
      throw err;
    }
    await page.goto(`${baseUrl}/app`);
    await page.waitForURL(/\/app/, { timeout: 30_000 });
  }
}

async function installLocalOnboardingSkippedSession(page: Page, baseUrl: string): Promise<boolean> {
  const cookies = await page.context().cookies(baseUrl);
  const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE);
  if (!session?.value) return false;
  const signedSession = decodeCookieValue(session.value);
  const separator = signedSession.lastIndexOf('.');
  if (separator < 1) return false;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(signedSession.slice(0, separator)) as Record<string, unknown>;
  } catch {
    return false;
  }
  if (typeof payload.token !== 'string') return false;
  const value = JSON.stringify({
    ...payload,
    onboarded: false,
    onboardingComplete: false,
    onboardingSkipped: true,
    issuedAt: Date.now(),
  });
  const url = new URL(baseUrl);
  await page.context().addCookies([{
    name: SESSION_COOKIE,
    value: encodeURIComponent(signTestSessionCookie(value)),
    url: url.origin,
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }]);
  return true;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function signTestSessionCookie(value: string): string {
  const secret = process.env.COOKIE_SIGNING_SECRET || 'praxis-dev-cookie-signing-secret';
  const signature = createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${signature}`;
}

function isLocalBaseUrl(baseUrl: string): boolean {
  const hostname = new URL(baseUrl).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export async function expectSignedInAppShell(page: Page) {
  expect(new URL(page.url()).pathname, 'authenticated app URL').toMatch(/^\/app/);
  await expect(page.locator('input[type=email]'), 'login form should not be visible after auth').toHaveCount(0, {
    timeout: 30_000,
  });
}

export async function expectAuthenticatedSession(page: Page) {
  const session = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session', { credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    const user = typeof body === 'object' && body && 'user' in body ? body.user : null;

    return {
      status: response.status,
      authenticated: Boolean((body as { authenticated?: unknown }).authenticated) || Boolean(user),
      userEmail: user && typeof user === 'object' && 'email' in user ? String(user.email ?? '') : '',
      onboardingComplete:
        user && typeof user === 'object' && 'onboardingComplete' in user
          ? Boolean(user.onboardingComplete)
          : false,
      onboardingSkipped:
        user && typeof user === 'object' && 'onboardingSkipped' in user
          ? Boolean(user.onboardingSkipped)
          : false,
    };
  });

  expect(session.status, 'auth session status').toBe(200);
  expect(session.authenticated, 'auth session must be authenticated').toBe(true);
  return session;
}
