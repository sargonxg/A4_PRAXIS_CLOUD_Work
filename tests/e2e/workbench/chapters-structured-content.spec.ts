import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('chapters render the five Pack 26 case chapters with actionable content', async ({ page }) => {
  await openExampleWorkbench(page, 'user-case');

  for (const title of [
    'Situation Frame',
    'Source Receipts',
    'Conflict Graph',
    'DIALECTICA Reasoning',
    'Decision Product',
  ]) {
    await expect(page.getByRole('button', { name: new RegExp(title, 'i') })).toBeVisible();
  }

  await expect(page.getByText(/Context \| Tools divider/i)).toBeVisible();
  await expect(page.getByText(/Above: context\. Below: tools/i)).toBeVisible();
  await expect(page.getByText(/What is happening, why does it matter/i)).toBeVisible();
});
