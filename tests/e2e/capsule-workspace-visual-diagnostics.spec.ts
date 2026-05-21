import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const AUTH_EMAIL = process.env.TEST_FIREBASE_EMAIL ?? process.env.PRAXIS_CANARY_EMAIL;
const AUTH_PASSWORD = process.env.TEST_FIREBASE_PASSWORD ?? process.env.PRAXIS_CANARY_PASSWORD;
const APP_OR_ONBOARDING = (url: URL) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding');

const widths = [390, 768, 1280] as const;

test.describe('capsule workspace visual diagnostics', () => {
  test('public root and login avoid horizontal overflow and translucent control panes', async ({ page }) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });

      for (const path of ['/', '/login']) {
        await page.goto(`${BASE}${path}`);
        await expect(page.locator('body')).toBeVisible();
        if (path === '/') await waitForLandingHydration(page);
        await expectNoDocumentOverflow(page, path, width);

        if (path === '/') {
          await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });
          await expectOpaquePanels(page, [
            '[data-testid="praxis-main-composer"]',
            '[data-testid="capsule-taxonomy-surface"] > section',
            '[data-testid="featured-expert-picks-shelf"]',
            '[data-testid^="capsule-card-"]',
          ]);
        }
      }
    }
  });

  test('authenticated capsules stay contained and readable', async ({ page }) => {
    test.skip(!AUTH_EMAIL || !AUTH_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD or PRAXIS_CANARY_EMAIL/PRAXIS_CANARY_PASSWORD not set');

    await page.goto(`${BASE}/login?redirect=/app/capsules`);
    await page.fill('input[type=email]', AUTH_EMAIL!);
    await page.fill('input[type=password]', AUTH_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 30_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before capsule workspace diagnostics can run.');

    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(`${BASE}/app/capsules`);
      await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('capsule-factory-header')).toBeVisible();
      await expect(page.getByTestId('capsule-factory-actions')).toBeVisible();
      await expect(page.getByTestId('praxis-main-composer')).toHaveCount(0);
      await expectNoDocumentOverflow(page, '/app/capsules', width);
      await expectNoInternalOverflow(page, '[data-testid="capsule-factory-command-band"]', width);
      await expectNoInternalOverflow(page, '[data-testid="featured-expert-picks-shelf"]', width);
      await expectNoInternalOverflow(page, '[data-testid="tasklet-capsule-cards"]', width);
      await expectOpaquePanels(page, [
        '[data-testid="capsule-factory-command-band"]',
        '[data-testid="capsule-taxonomy-surface"] > section',
        '[data-testid="featured-expert-picks-shelf"]',
        '[data-testid^="capsule-card-"]',
      ]);

      const firstCard = page.locator('[data-testid^="capsule-card-"]').first();
      await expect(firstCard.getByRole('button', { name: /^Add$/ })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: /Details/i })).toBeVisible();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: /Inspect capsule/i }).click();
    const inspector = page.getByTestId('capsule-inspector-sheet');
    await expect(inspector).toBeVisible();
    await expect(page.getByTestId('capsule-inspector-chat-panel')).toBeVisible();
    await expectNoInternalOverflow(page, '[data-testid="capsule-inspector-sheet"]', 390);

    await page.keyboard.press('Escape');
  });

  test('work action menus expose real readable popovers when menu content exists', async ({ page }) => {
    await page.goto(BASE);
    await waitForLandingHydration(page);
    const menuButton = page.getByRole('button', { name: /Work on this/i }).first();
    await expect(menuButton).toBeVisible({ timeout: 20_000 });
    await menuButton.click();
    const menu = page.getByTestId('work-action-menu-panel').first();
    await expect(menu).toBeVisible();
    await expectOpaquePanels(page, ['[data-testid="work-action-menu-panel"]']);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });
});

async function waitForLandingHydration(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => document.documentElement.dataset.praxisHydrated === 'true');
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
