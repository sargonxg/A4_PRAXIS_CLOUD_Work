import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from './personas/_shared/persona-fixtures';

test.describe('PRAXIS MVP core surfaces', () => {
  test('authenticated app exposes Ask, User Core, Situation Core, and tool suggestions', async ({ page }) => {
    await openExampleWorkbench(page, 'syria-2026');
    await page.goto('/app/dashboard');

    await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();
    await expect(page.getByTestId('core-library-panel')).toBeVisible();
    await expect(page.getByTestId('draft-workbench-panel')).toBeVisible();
    await expect(page.getByText(/Ask first/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Ask from context/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Create context/i }).first()).toBeVisible();

    await page.goto('/app/contexts');
    await expect(page.getByRole('heading', { name: /Build the capsule once, then use it everywhere/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage stack/i })).toBeVisible();
    await expect(page.getByText(/Advanced details/i)).toBeVisible();

    await page.goto('/app/cores/context');
    await expect(page.getByRole('heading', { name: /Create a specific context, attach sources, then ask/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create context/i })).toBeVisible();
    await expect(page.getByText(/Active stack readiness/i)).toBeVisible();

    await page.goto('/app/cores/user');
    await expect(page.getByRole('heading', { name: /Set the analyst posture PRAXIS should use/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Edit profile/i })).toBeVisible();
    await expect(page.getByText(/Advanced details/i)).toBeVisible();
  });
});
