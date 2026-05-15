import { expect, test } from '@playwright/test';

const sectionIds = ['core-stack', 'methods', 'drafting', 'real-app', 'pricing'];

test('landing v2 renders target sections and working CTAs', async ({ page }) => {
  await page.goto('/?staticHero=1');

  await expect(page.getByRole('heading', { name: /Build the right context for policy AI\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Ask workspace/i }).first()).toHaveAttribute('href', '/app/assistant');
  await expect(page.getByRole('link', { name: /^Cores$/i })).toHaveAttribute('href', '#core-stack');

  for (const id of sectionIds) {
    await expect(page.locator(`#${id}`), `section #${id}`).toHaveCount(1);
  }

  await page.getByRole('link', { name: /^Cores$/i }).click();
  await expect(page.locator('#core-stack')).toBeInViewport();
  await expect(page.getByText(/Build the cores\. Ask from them\. Ship grounded work\./i)).toBeVisible();
});

test('landing primary app CTA routes to Ask PRAXIS', async ({ page }) => {
  await page.goto('/?staticHero=1');

  await expect(page.getByRole('link', { name: /Open Ask workspace/i }).first()).toHaveAttribute('href', '/app/assistant');
  await expect(page.getByRole('link', { name: /Open Ask workspace/i }).first()).toHaveAttribute('href', '/app/assistant');
});
