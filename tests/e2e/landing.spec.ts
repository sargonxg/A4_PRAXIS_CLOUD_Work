import { expect, test } from '@playwright/test';

const sectionIds = ['six-steps', 'dialectica', 'live-demo', 'built-for', 'trust', 'pricing'];

test('landing v2 renders target sections and working CTAs', async ({ page }) => {
  await page.goto('/?staticHero=1');

  await expect(page.getByRole('heading', { name: /The policy workbench for grounded statecraft/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Start Your Workspace/i }).first()).toHaveAttribute('href', '/login');
  await expect(page.getByRole('link', { name: /Scroll to the six steps/i })).toHaveAttribute('href', '#six-steps');

  for (const id of sectionIds) {
    await expect(page.locator(`#${id}`), `section #${id}`).toHaveCount(1);
  }

  await page.getByRole('link', { name: /Scroll to the six steps/i }).click();
  await expect(page.locator('#six-steps')).toBeInViewport();

  await page.getByRole('button', { name: /Try an example case/i }).click();
  await expect(page.getByRole('dialog', { name: /Six example cases/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open guest session/i }).first()).toHaveAttribute(
    'href',
    '/login?mode=demo&example=syria-2026',
  );
});

test('example case modal closes with escape and restores the trigger', async ({ page }) => {
  await page.goto('/?staticHero=1');

  const trigger = page.getByRole('button', { name: /Try an example case/i });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: /Six example cases/i })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Six example cases/i })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
