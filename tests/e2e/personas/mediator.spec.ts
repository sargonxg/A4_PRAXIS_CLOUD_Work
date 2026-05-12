import { expect, test } from '@playwright/test';
import { openExampleWorkbench, openWorkbenchChapter } from './_shared/persona-fixtures';

test('mediator opens Nordalia and checks boardroom readiness gate', async ({ page }) => {
  await openExampleWorkbench(page, 'nordalia-2026');
  await openWorkbenchChapter(page, 'Boardroom');

  await expect(page.getByRole('heading', { name: /Nordalia NDC Simulation workbench/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Agentic Boardroom/i })).toBeVisible();
  await expect(page.getByText(/No chapter briefings yet/i)).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();
});
