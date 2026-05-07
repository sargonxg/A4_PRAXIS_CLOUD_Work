import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('Graph tab displays timeline projection', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'graph');

  await page.getByTestId('graph-layout-toggle').getByRole('button', { name: /Timeline/i }).click();
  await expect(page.getByTestId('praxis-timeline')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Timeline Projection/i })).toBeVisible();
  await expect(page.getByText(/dated nodes/i)).toBeVisible();
  await expect(page.getByTestId('graph-entity-panel')).toBeVisible();
});
