import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('Graph tab displays map projection', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'graph');

  await page.getByTestId('graph-layout-toggle').getByRole('button', { name: /Map/i }).click();
  await expect(page.getByTestId('praxis-map')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Map Projection/i })).toBeVisible();
  await expect(page.getByText(/mapped nodes/i)).toBeVisible();
});
