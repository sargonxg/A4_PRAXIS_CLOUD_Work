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
    await expect(page.getByRole('link', { name: /User Cores/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Situation Cores/i }).first()).toBeVisible();

    await page.goto('/app/contexts');
    await expect(page.getByRole('heading', { name: /Open the context PRAXIS should use/i })).toBeVisible();
    await expect(page.getByText('My contexts')).toBeVisible();
    await expect(page.getByText('Examples')).toBeVisible();
    await expect(page.getByText(/Example context/i).first()).toBeVisible();

    await page.goto('/app/cores/context');
    await expect(page.getByRole('heading', { name: /Build the policy situation PRAXIS reasons from/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Build Context Core', exact: true })).toBeVisible();
    await expect(page.getByText(/Context readiness/i)).toBeVisible();

    await page.goto('/app/cores/user');
    await expect(page.getByRole('heading', { name: /Build the analyst model PRAXIS carries into every answer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Maintain User Core/i })).toBeVisible();
    await expect(page.getByText(/Prompt effects/i)).toBeVisible();
  });
});
