import { expect, test } from '@playwright/test';

test('landing renders light marketing sections and working anchors', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Ask anything\. Leave with a sourced brief\./i })).toBeVisible();
  await expect(page.getByTestId('marketing-hero-prompt')).toBeVisible();
  await expect(page.getByTestId('marketing-primary-cta')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /^Context Capsules$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Agentic research$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Capsule marketplace$/i })).toBeVisible();

  await page.getByRole('link', { name: /^Capsules$/i }).click();
  await expect(page.locator('#capsules')).toBeInViewport();
  await page.getByRole('link', { name: /^Pricing$/i }).click();
  await expect(page.locator('#pricing')).toBeInViewport();
});
