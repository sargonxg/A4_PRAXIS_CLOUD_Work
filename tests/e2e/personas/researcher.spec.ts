import { expect, test } from '@playwright/test';
import { openExampleWorkbench, openWorkbenchChapter } from './_shared/persona-fixtures';

test('researcher moves from Nordalia sources to research surface', async ({ page }) => {
  await openExampleWorkbench(page, 'nordalia-2026');

  await expect(page.getByRole('heading', { name: /Source Receipts/i })).toBeVisible();
  await openWorkbenchChapter(page, 'Research');
  await expect(page.getByTestId('workbench-research-surface')).toBeVisible();
  await expect(page.getByText(/structured fixture/i)).toBeVisible();
});
