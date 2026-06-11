import { expect, test } from '@playwright/test';

test('landing renders light marketing sections and working anchors', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Ask anything\. Leave with a sourced brief\./i })).toBeVisible();
  await expect(page.getByTestId('marketing-hero-prompt')).toBeVisible();
  await expect(page.getByTestId('marketing-primary-cta')).toHaveCount(1);
  await expect(page.getByTestId('ask-context-bar')).toBeVisible();
  await expect(page.getByRole('link', { name: /^Ask$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Saved context$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Boardroom$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Drafts$/i })).toBeVisible();

  await expect(page.getByRole('link', { name: /^Pricing$/i })).toHaveAttribute('href', '/pricing');
  await expect(page.getByRole('link', { name: /^Learn$/i })).toHaveAttribute('href', '/learn');
});
