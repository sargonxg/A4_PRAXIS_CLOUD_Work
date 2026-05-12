import { expect, test } from '@playwright/test';

test.describe('PRAXIS core product flows', () => {
  test('landing Ask preview, core builders, and memo workbench route stay wired', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/PRAXIS by TACITUS/i).first()).toBeVisible();

    const contextSelect = page.getByLabel('Situation Core');
    await expect(contextSelect).toBeVisible();
    await contextSelect.selectOption('ai-regulation-2026');
    await expect(page.getByRole('heading', { name: /AI Regulation 2026 graph/i })).toBeVisible();
    await expect(page.getByText(/Memo Drafter/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Not a chat box/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open real app/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Drag cores into the stack/i })).toBeVisible();
    await expect(page.getByText(/Core priority builder/i)).toBeVisible();

    await page.request.post('/api/auth/session', { data: { demo: true } });

    await page.goto('/app/cores/context');
    await expect(page.getByText(/Situation Core Builder/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Build Context Core', exact: true }).first()).toBeVisible();

    await page.goto('/app/workbench/indo-pacific-2026?openChapter=memos');
    await expect(page.getByText(/Memo|Draft|Briefing/i).first()).toBeVisible();
  });
});
