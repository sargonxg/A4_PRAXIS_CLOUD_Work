import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('library renders Pack 27 faceted artifact browser', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'library');

  await expect(page.getByTestId('workbench-library-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Library$/i })).toBeVisible();
  for (const facet of ['Sources', 'Documents', 'Saved claims', 'Memo versions', 'Exports']) {
    await expect(page.getByRole('button', { name: new RegExp(`^${facet}$`, 'i') })).toBeVisible();
  }

  await page.getByPlaceholder(/Search titles/i).fill('ceasefire');
  await expect(page.getByText(/shown/i).first()).toBeVisible();
  await expect(page.getByText(/Select one receipt/i)).toBeVisible();
});
