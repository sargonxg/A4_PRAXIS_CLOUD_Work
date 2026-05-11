import { expect, test } from '@playwright/test';
import { expectWorkbenchTab, openSeededDemoWorkbench, openWorkbenchChapter } from './_shared/persona-fixtures';

test('foreign policy analyst validates Indo-Pacific research, graph, and draft flow', async ({ page }) => {
  await openSeededDemoWorkbench(page, 'indo-pacific-2026');

  await expect(page.locator('h1').filter({ hasText: /Indo-Pacific Strategic Competition/i })).toBeVisible();
  await expect(page.getByText(/Alliance modernization/i).first()).toBeVisible();

  await openWorkbenchChapter(page, 'Research');
  await expect(page.getByTestId('workbench-research-surface')).toBeVisible();
  await expect(page.getByText(/Research question/i)).toBeVisible();
  await expect(page.getByText(/Source Scout/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Graph$/i }).click();
  await expectWorkbenchTab(page, 'Graph');
  await expect(page.getByTestId('workbench-graph-intelligence')).toBeVisible();
  await expect(page.getByText(/Stakeholder Analysis/i)).toBeVisible();

  await page.getByLabel(/Close workspace tab/i).click();
  await openWorkbenchChapter(page, 'Draft');
  await expect(page.getByTestId('workbench-draft-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Briefing Assembly/i })).toBeVisible();
  await expect(page.getByText(/decision-ready briefing package/i)).toBeVisible();
});
