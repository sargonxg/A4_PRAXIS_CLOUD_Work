import { expect, test } from '@playwright/test';

test.describe('PRAXIS MVP core surfaces', () => {
  test('authenticated app exposes Ask, User Core, Situation Core, and tool suggestions', async ({ page }) => {
    const session = await page.request.post('/api/auth/session', { data: { demo: true } });
    expect(session.ok()).toBeTruthy();

    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: /Explore Freely/i }).click({ timeout: 5000 }).catch(() => undefined);
    await page.getByRole('button', { name: /^Dismiss conflict grammar primer$/i }).click({ timeout: 5000 }).catch(() => undefined);

    await expect(page.getByTestId('ask-praxis-home')).toBeVisible();
    await expect(page.getByText(/Ask PRAXIS anything about this policy situation/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /User Core/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Situation Core/i }).first()).toBeVisible();

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
