import { expect, test } from '@playwright/test';

test.describe('PRAXIS core product flows', () => {
  test('landing context switch, context wizard, and drafting route stay wired', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/PRAXIS by TACITUS/i).first()).toBeVisible();

    const contextSelect = page.getByLabel('Context');
    await expect(contextSelect).toBeVisible();
    await contextSelect.selectOption('ai-regulation-2026');
    await expect(page.getByRole('heading', { name: /AI Regulation 2026 graph/i })).toBeVisible();
    await expect(page.getByText(/Memo Drafter/i)).toBeVisible();

    await page.goto('/contexts');
    await expect(page.getByRole('heading', { name: /Context workspace/i })).toBeVisible();
    await page.getByRole('button', { name: /New Context/i }).click();
    await expect(page.getByRole('heading', { name: /Create Context/i })).toBeVisible();
    await page.getByLabel(/Name and brief/i).fill('Humanitarian access negotiation for Port Orion');
    await expect(page.getByText(/Suggested: Humanitarian/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Context/i })).toBeVisible();

    await page.goto('/draft/new?caseId=indo-pacific-2026&template=country-card');
    await expect(page.getByText(/Auto-fill from context/i)).toBeVisible();
    await expect(page.getByText(/Export preview/i)).toBeVisible();
  });
});
