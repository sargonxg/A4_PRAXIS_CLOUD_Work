import crypto from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const DEMO_SESSION_SECRET = 'praxis-dev-cookie-signing-secret';
const DEMO_SESSION_COOKIE = 'tacitus-auth-session';
const BASE_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

function signDemoSession(value: string) {
  const sig = crypto.createHmac('sha256', DEMO_SESSION_SECRET).update(value).digest('base64url');
  return `${value}.${sig}`;
}

async function seedDemoSession(page: Page) {
  const sessionValue = JSON.stringify({ demo: true, onboarded: true, onboardingComplete: true });
  await page.context().addCookies([
    {
      name: DEMO_SESSION_COOKIE,
      value: signDemoSession(sessionValue),
      url: BASE_ORIGIN,
    },
  ]);
  await page.addInitScript(() => {
    window.localStorage.setItem('praxis-tour-seen', 'true');
  });
}

test('simplified app shell exposes context bar, command palette, and five-surface flow', async ({ page }) => {
  await seedDemoSession(page);

  await page.goto('/app/dashboard');
  await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();
  await expect(page.getByText('User Core').first()).toBeVisible();
  await expect(page.getByText('Situation Core').first()).toBeVisible();
  await expect(page.getByText('Health').first()).toBeVisible();
  await expect(page.getByText('Active Context Stack')).toBeVisible();
  await expect(page.getByText('Copy to workspace').first()).toBeVisible();

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.getByTestId('command-palette')).toBeVisible();
  await expect(page.getByTestId('command-palette').getByPlaceholder('Command or ask PRAXIS...')).toBeVisible();
  await expect(page.getByText('Open Home', { exact: true })).toBeVisible();
  await expect(page.getByText('Open Library', { exact: true })).toBeVisible();
  await expect(page.getByText('Open Memo Studio', { exact: true })).toBeVisible();
  await expect(page.getByText('Open Canvas', { exact: true })).toBeVisible();
  await page.getByText('Open Canvas', { exact: true }).click();
  await expect(page).toHaveURL(/\/app\/canvas$/);
  await expect(page.getByTestId('context-canvas-page')).toBeVisible();
  await expect(page.getByTestId('context-canvas-nodes')).toBeVisible();

  await page.goto('/app/assistant');
  await expect(page.getByTestId('ask-workspace-page')).toBeVisible();
  await expect(page.getByText(/Next best actions/i).first()).toBeVisible();

  await page.goto('/app/contexts');
  await expect(page.getByRole('heading', { name: /Core Library/i }).first()).toBeVisible();

  await page.goto('/app/workbench/indo-pacific-2026?tab=library');
  await expect(page.getByText('Drop source on this panel').first()).toBeVisible();

  await page.goto('/app/write');
  await expect(page.getByTestId('praxis-writer')).toBeVisible();
  await expect(page.getByText('Evidence Gap Finder')).toBeVisible();
});
