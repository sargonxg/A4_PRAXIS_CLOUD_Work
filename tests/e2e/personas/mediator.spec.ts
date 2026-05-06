import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from './_shared/persona-fixtures';

test('mediator opens Nordalia and checks boardroom readiness gate', async ({ page }) => {
  await openExampleWorkbench(page, 'nordalia-2026', 'boardroom');

  await expect(page.getByRole('heading', { name: /Nordalia NDC Simulation/i })).toBeVisible();
  await expect(page.getByText(/Context needs work before this tool runs|Use advisor deliberation/i)).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();
});
