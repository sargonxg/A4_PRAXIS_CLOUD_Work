import { expect, test } from '@playwright/test';
import { expectWorkbenchTab, openSeededDemoWorkbench, openWorkbenchChapter } from './_shared/persona-fixtures';

test('domestic policy analyst validates AI regulation context, sources, and methods', async ({ page }) => {
  await openSeededDemoWorkbench(page, 'ai-regulation-2026');

  await expect(page.locator('h1').filter({ hasText: /AI Regulation/i })).toBeVisible();
  await expect(page.getByText(/Federal preemption debate/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Library$/i }).click();
  await expectWorkbenchTab(page, 'Library');
  await expect(page.getByTestId('workbench-library-surface')).toBeVisible();
  await expect(page.getByText(/Source receipts/i).first()).toBeVisible();

  await page.getByLabel(/Close workspace tab/i).click();
  await openWorkbenchChapter(page, 'Tools');
  await expect(page.getByTestId('workbench-tools-surface')).toBeVisible();
  await expect(page.getByText(/Recipe library/i)).toBeVisible();
  await expect(page.getByPlaceholder(/Search tools/i)).toBeVisible();
  await expect(page.getByText(/Recipes/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Graph$/i }).click();
  await expectWorkbenchTab(page, 'Graph');
  await expect(page.getByText(/Timeline/i).first()).toBeVisible();
});
