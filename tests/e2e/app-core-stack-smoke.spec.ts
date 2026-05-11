import { expect, test } from '@playwright/test';

test.describe('authenticated core stack', () => {
  test('example session shows draggable Active Core Stack after login', async ({ page }) => {
    const session = await page.request.post('/api/auth/session', { data: { demo: true } });
    expect(session.ok()).toBeTruthy();

    await page.goto('/app/dashboard');

    await page
      .getByRole('button', { name: /Explore Freely/i })
      .click({ timeout: 5000 })
      .catch(() => undefined);
    await page
      .getByRole('button', { name: /^Dismiss conflict grammar primer$/i })
      .click({ timeout: 5000 })
      .catch(() => undefined);

    await expect(page.getByTestId('active-core-stack')).toBeVisible();
    await expect(page.getByText(/Drag the cores into the order this case needs/i)).toBeVisible();
    await expect(page.getByText(/User Core/i).first()).toBeVisible();
    await expect(page.getByText(/Graph Core/i).first()).toBeVisible();
    await expect(page.getByText(/Team Core remains staged/i)).toBeVisible();
  });
});
