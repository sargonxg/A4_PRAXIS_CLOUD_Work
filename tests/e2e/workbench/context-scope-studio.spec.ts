import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('context tab renders Pack 26 scope studio sections', async ({ page }) => {
  await openExampleWorkbench(page, 'user-case', 'context');

  await expect(page.getByTestId('workbench-context-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Context Studio$/i })).toBeVisible();
  await expect(page.getByText(/Shape the scope/i)).toBeVisible();
  await expect(page.getByText(/Frame editor/i)).toBeVisible();
  await expect(page.getByText(/AI Scope Advisory/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Preferences$/i })).toBeVisible();
  await expect(page.getByText('Document upload', { exact: true })).toBeVisible();
  await expect(page.getByText('Actors / Claims / Interests', { exact: true })).toBeVisible();
  await expect(page.getByText(/Context storage contract/i)).toBeVisible();
});
