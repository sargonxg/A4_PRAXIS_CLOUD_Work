import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.use({ ...devices['iPhone 13'] });

test.describe('Mobile landing - iPhone 13', () => {
  test('light marketing home renders without cockpit overflow', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByTestId('praxis-chat-first-shell')).toBeVisible();
    await expect(page.getByTestId('marketing-home')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Ask anything\. Leave with a sourced brief\./i })).toBeVisible();
    await expect(page.getByTestId('tasklet-praxis-workbench')).toHaveCount(0);

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(2);
  });

  test('primary mobile CTA meets touch-target floor', async ({ page }) => {
    await page.goto(BASE_URL);
    const cta = page.getByTestId('marketing-primary-cta');
    const box = await cta.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
