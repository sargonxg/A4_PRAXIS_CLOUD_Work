import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from './personas/_shared/persona-fixtures';

test.describe('authenticated core stack', () => {
  test('example session shows the unified workspace shell and core library after login', async ({ page }) => {
    await openExampleWorkbench(page, 'syria-2026');
    await page.goto('/app/dashboard');

    await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();
    await expect(page.getByTestId('core-library-panel')).toBeVisible();
    await expect(page.getByText(/User Cores/i).first()).toBeVisible();
    await expect(page.getByText(/Situation Cores/i).first()).toBeVisible();
    await expect(page.getByText(/Drafting workbench/i).first()).toBeVisible();
  });
});
