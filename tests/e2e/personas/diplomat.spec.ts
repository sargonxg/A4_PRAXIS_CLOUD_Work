import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from './_shared/persona-fixtures';

test('diplomat opens Syria case and reaches decision-product flow', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026');

  await expect(page.locator('h1').filter({ hasText: /Syria Transition/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Memos$/i })).toBeVisible();
  await expect(page.getByTestId('workbench-memos-surface')).toBeVisible();
  await expect(page.getByText(/From graph evidence to work product/i)).toBeVisible();

  await expect(page.getByRole('button', { name: /Desk.*always on/i })).toBeVisible();
  await expect(page.getByTestId('workbench-desk-surface')).toBeVisible();
});
