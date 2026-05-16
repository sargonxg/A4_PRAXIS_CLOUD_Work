import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('Desk What Changed includes inline graph timeline', async ({ page }) => {
  await openExampleWorkbench(page, 'user-case', 'desk');

  await expect(page.getByTestId('workbench-desk-surface')).toBeVisible();
  await expect(page.getByTestId('desk-inline-timeline')).toBeVisible();
  await expect(page.getByText(/Recent graph chronology/i)).toBeVisible();
});
