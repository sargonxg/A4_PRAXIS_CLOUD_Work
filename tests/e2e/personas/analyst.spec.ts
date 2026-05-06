import { expect, test } from '@playwright/test';
import { openExampleWorkbench, expectWorkbenchTab } from './_shared/persona-fixtures';

test('analyst verifies graph and truth-layer context inside the unified workbench', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'graph');

  await expectWorkbenchTab(page, 'Graph');
  await expect(page.getByText(/truth layers/i)).toBeVisible();
  await expect(page.getByText(/provenance coverage/i)).toBeVisible();
});
