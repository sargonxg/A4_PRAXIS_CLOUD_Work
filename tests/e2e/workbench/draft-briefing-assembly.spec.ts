import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('draft renders Pack 28 briefing assembly and exports a package', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'draft');

  await expect(page.getByTestId('workbench-draft-surface')).toBeVisible();
  for (const heading of ['Briefing Assembly', 'Memos Selection', 'Cover Page', 'Appendices', 'Redaction Settings', 'Export Controls']) {
    await expect(page.getByRole('heading', { name: new RegExp(`^${heading}$`, 'i') })).toBeVisible();
  }

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^Export package$/i }).click(),
  ]).then(([file]) => file);

  expect(download.suggestedFilename()).toContain('briefing-package');
  await expect(page.getByText(/Export manifest persisted|Demo export manifest generated|Download prepared locally/i)).toBeVisible();
});
