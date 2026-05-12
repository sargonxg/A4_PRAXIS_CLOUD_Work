import { expect, test } from '@playwright/test';

test.describe('PRAXIS core product flows', () => {
  test('landing Ask preview, core builders, and memo workbench route stay wired', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/PRAXIS by TACITUS/i).first()).toBeVisible();

    const contextSelect = page.getByLabel('Situation Core');
    await expect(contextSelect).toBeVisible();
    await contextSelect.selectOption('ai-regulation-2026');
    await expect(contextSelect).toHaveValue('ai-regulation-2026');
    await expect(page.getByRole('heading', { name: /The answer is only useful if the graph behind it is legible\./i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Write with PRAXIS/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Policy context creation, research, and memo writing in one place\./i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open PRAXIS/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Attach the context that matters\. PRAXIS suggests the next move\./i })).toBeVisible();
    await expect(page.getByText(/Context stack/i)).toBeVisible();

    await page.request.post('/api/auth/session', { data: { demo: true } });

    await page.goto('/app/cores/context');
    await expect(page.getByText(/Situation Core Builder/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Build Context Core', exact: true }).first()).toBeVisible();

    await page.goto('/app/workbench/indo-pacific-2026?openChapter=memos');
    await expect(page.getByTestId('praxis-writer')).toBeVisible();
  });
});
