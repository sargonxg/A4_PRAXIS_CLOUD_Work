import { expect, test } from '@playwright/test';
import { openExampleWorkbench, expectWorkbenchTab } from './_shared/persona-fixtures';

test('researcher moves from Nordalia sources to research surface', async ({ page }) => {
  await openExampleWorkbench(page, 'nordalia-2026');

  await expect(page.getByRole('heading', { name: /Source Receipts/i })).toBeVisible();
  await page.getByRole('button', { name: /^Research$/i }).click();
  await expectWorkbenchTab(page, 'Research');
  await expect(page.getByText(/source discovery/i)).toBeVisible();
});
