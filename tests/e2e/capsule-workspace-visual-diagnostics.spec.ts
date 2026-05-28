import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const AUTH_EMAIL = process.env.TEST_FIREBASE_EMAIL ?? process.env.PRAXIS_CANARY_EMAIL;
const AUTH_PASSWORD = process.env.TEST_FIREBASE_PASSWORD ?? process.env.PRAXIS_CANARY_PASSWORD;
const APP_OR_ONBOARDING = (url: URL) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding');

const widths = [390, 768, 1280] as const;

test.describe('capsule workspace visual diagnostics', () => {
  test('public root keeps the normal Ask composer outside the capsule studio', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    if (await page.getByText(/Failed to load chunk/i).isVisible().catch(() => false)) {
      test.skip(true, 'Existing dev server is serving a stale Next.js chunk.');
    }
    await waitForLandingHydration(page);
    await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('praxis-main-composer')).toBeVisible();
    await expect(page.getByTestId('capsule-studio-header')).toHaveCount(0);
  });

  test('authenticated capsules stay contained and readable', async ({ page }) => {
    test.skip(!AUTH_EMAIL || !AUTH_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD or PRAXIS_CANARY_EMAIL/PRAXIS_CANARY_PASSWORD not set');

    await page.goto(`${BASE}/login?redirect=/app/capsules`);
    await page.fill('input[type=email]', AUTH_EMAIL!);
    await page.fill('input[type=password]', AUTH_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 30_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before capsule workspace diagnostics can run.');
    await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 30_000 });

    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(`${BASE}/app/capsules`);
      await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('capsule-studio-header')).toBeVisible();
      const primaryActions = page.getByTestId('capsule-studio-primary-actions');
      const commandBand = page.getByTestId('capsule-studio-command-band');
      await expect(primaryActions).toBeVisible();
      await expect(primaryActions.getByRole('button', { name: /Build capsule/i })).toBeVisible();
      await expect(primaryActions.getByRole('button', { name: /Use in Ask/i })).toBeVisible();
      await expect(primaryActions.getByRole('button', { name: /Review improvements/i })).toBeVisible();
      await expect(commandBand.getByRole('button', { name: /Build capsule/i })).toBeVisible();
      await expect(commandBand.getByRole('button', { name: /Use in Ask/i })).toBeVisible();
      await expect(commandBand.getByRole('button', { name: /Review improvements/i })).toBeVisible();
      await expect(page.getByTestId('praxis-main-composer')).toHaveCount(0);
      await expectNoDocumentOverflow(page, '/app/capsules', width);
      await expectNoInternalOverflow(page, '[data-testid="capsule-studio-command-band"]', width);
      await expectNoInternalOverflow(page, '[data-testid="capsule-studio-library"]', width);
      await expectNoInternalOverflow(page, '[data-testid="capsule-studio-workspace"]', width);
      await expectNoInternalOverflow(page, '[data-testid="capsule-studio-review-queue"]', width);
      await expectNoInternalOverflow(page, '[data-testid="featured-expert-picks-shelf"]', width);
      await expectNoInternalOverflow(page, '[data-testid="tasklet-capsule-cards"]', width);
      await expectOpaquePanels(page, [
        '[data-testid="capsule-studio-command-band"]',
        '[data-testid="capsule-studio-workspace"]',
        '[data-testid="capsule-studio-review-queue"]',
        '[data-testid="capsule-taxonomy-surface"] > section',
        '[data-testid="featured-expert-picks-shelf"]',
        '[data-testid^="capsule-card-"]',
      ]);

      const firstCard = page.locator('[data-testid^="capsule-card-"]').first();
      await expect(firstCard.getByRole('button', { name: /^Add$/ })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: /Read more/i })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: /Inspect/i })).toBeVisible();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('capsule-studio-chat-panel')).toBeVisible();
    await expect(page.getByTestId('capsule-studio-source-section')).toBeVisible();
    await page.locator('[data-testid^="capsule-card-"]').first().getByRole('button', { name: /Inspect/i }).click();
    const inspector = page.getByTestId('capsule-inspector-sheet');
    await expect(inspector).toBeVisible();
    await expect(page.getByTestId('capsule-inspector-chat-panel')).toBeVisible();
    await expectNoInternalOverflow(page, '[data-testid="capsule-inspector-sheet"]', 390);

    await page.keyboard.press('Escape');
  });
});

async function waitForLandingHydration(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('tasklet-praxis-workbench').waitFor({ state: 'visible', timeout: 20_000 });
}

async function expectNoDocumentOverflow(page: import('@playwright/test').Page, path: string, width: number) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${path} document overflow at ${width}px`).toBeLessThanOrEqual(2);
}

async function expectNoInternalOverflow(page: import('@playwright/test').Page, selector: string, width: number) {
  const overflow = await page.locator(selector).first().evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow, `${selector} internal overflow at ${width}px`).toBeLessThanOrEqual(2);
}

async function expectOpaquePanels(page: import('@playwright/test').Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    await expect(locator, selector).toBeVisible();
    const background = await locator.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background, `${selector} background`).toMatch(/rgb\(/);
    expect(background, `${selector} must not use alpha transparency`).not.toMatch(/rgba\([^)]*,\s*0\.[0-8]/);
  }
}
