import { expect, test } from '@playwright/test';

test.describe('PRAXIS core product flows', () => {
  test('landing Ask preview, core builders, and memo workbench route stay wired', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/PRAXIS by TACITUS/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Build a ContextCapsule for the policy work in front of you\./i })).toBeVisible();

    await expect(page.getByText(/User Core/i).first()).toBeVisible();
    await expect(page.getByText(/Suggested path/i).first()).toBeVisible();
    await expect(page.getByText(/Output goal/i).first()).toBeVisible();
    await expect(page.getByText(/No agent run before login/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Open Ask workspace/i }).first()).toHaveAttribute('href', '/app/assistant');

    await page.request.post('/api/auth/session', {
      data: { demo: true, onboarded: true, onboardingComplete: true },
    });

    await page.goto('/app/cores/context');
    await expect(page.getByRole('heading', { name: /Create a specific context, attach sources, then ask/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create context/i }).first()).toBeVisible();

    await page.goto('/app/workbench/indo-pacific-2026?openChapter=memos');
    await expect(page.getByRole('button', { name: /Memos production/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Write with PRAXIS/i })).toBeVisible();
  });
});
