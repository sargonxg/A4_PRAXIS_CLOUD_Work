import { expect, test } from '@playwright/test';

test.describe('PRAXIS core product flows', () => {
  test('landing Ask preview, core builders, and memo workbench route stay wired', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/PRAXIS by TACITUS/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /PRAXIS builds inheritable policy cores\./i })).toBeVisible();

    await expect(page.getByText(/User Core/i).first()).toBeVisible();
    await expect(page.getByText(/Situation Core/i).first()).toBeVisible();
    await expect(page.getByText(/Graph Core/i).first()).toBeVisible();
    await expect(page.getByText(/Open Ask PRAXIS and work from the active core stack/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Open Ask workspace/i }).first()).toHaveAttribute('href', '/app/assistant');

    await page.request.post('/api/auth/session', { data: { demo: true } });

    await page.goto('/app/cores/context');
    await expect(page.getByText(/Situation Core Builder/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Build Context Core', exact: true }).first()).toBeVisible();

    await page.goto('/app/workbench/indo-pacific-2026?openChapter=memos');
    await expect(page.getByTestId('praxis-writer')).toBeVisible();
  });
});
