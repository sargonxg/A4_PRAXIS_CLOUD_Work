import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('research renders Pack 27 Source Scout and stages candidate ingest', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'research');

  await expect(page.getByTestId('workbench-research-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Research$/i })).toBeVisible();
  await expect(page.getByText(/Staged collection plan/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Candidate sources$/i })).toBeVisible();

  await page.getByLabel(/Research question/i).fill('latest ceasefire monitoring sources');
  await page.getByRole('button', { name: /Run source scout/i }).click();
  await expect(page.getByRole('heading', { name: /^Candidate sources$/i })).toBeVisible();

  await page.getByRole('button', { name: /^Ingest$/i }).first().click();
  await expect(page.getByText(/staged for non-destructive re-genesis review/i)).toBeVisible();
});
