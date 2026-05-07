import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('desk renders Pack 26 command-center panels', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'desk');

  await expect(page.getByTestId('workbench-desk-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Desk$/i })).toBeVisible();
  await expect(page.getByText('What changed', { exact: true })).toBeVisible();
  await expect(page.getByText(/Next best actions/i)).toBeVisible();
  await expect(page.getByText('Open questions', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Stale context advisory|Context freshness acceptable/i)).toBeVisible();
  await expect(page.getByText(/AI remains advisory/i)).toBeVisible();
});
