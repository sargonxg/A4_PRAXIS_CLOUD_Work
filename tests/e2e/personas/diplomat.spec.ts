import { expect, test } from '@playwright/test';
import { openExampleWorkbench, expectWorkbenchTab } from './_shared/persona-fixtures';

test('diplomat opens Syria case and reaches decision-product flow', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026');

  await expect(page.locator('h1').filter({ hasText: /Syria Transition/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Decision Product/i })).toBeVisible();

  await page.getByRole('button', { name: /^Desk$/i }).click();
  await expectWorkbenchTab(page, 'Desk');
});
