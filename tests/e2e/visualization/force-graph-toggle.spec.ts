import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('Graph tab switches from oval to force layout', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'graph');

  await expect(page.getByTestId('praxis-graph-view')).toBeVisible();
  await expect(page.getByTestId('praxis-graph-canvas')).toBeVisible();

  await page.getByTestId('graph-layout-toggle').getByRole('button', { name: /Force/i }).click();
  await expect(page.getByTestId('praxis-force-graph')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Force Graph/i })).toBeVisible();
  await expect(page.getByTestId('graph-entity-panel')).toBeVisible();
});
