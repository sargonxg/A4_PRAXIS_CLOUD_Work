import { expect, test } from '@playwright/test';

test.describe('authenticated core stack', () => {
  test('example session shows draggable Active Core Stack after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Open example case workspace/i }).click();
    await page.waitForLoadState('networkidle');
    await page.goto('/app/dashboard');

    await expect(page.getByTestId('active-core-stack')).toBeVisible();
    await expect(page.getByText(/Drag the cores into the order this case needs/i)).toBeVisible();
    await expect(page.getByText(/User Core/i).first()).toBeVisible();
    await expect(page.getByText(/Graph Core/i).first()).toBeVisible();
    await expect(page.getByText(/Team Core remains staged/i)).toBeVisible();
  });
});
