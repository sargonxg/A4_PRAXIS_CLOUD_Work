import { expect, test } from '@playwright/test';

const sectionIds = ['six-steps', 'dialectica', 'live-demo', 'built-for', 'trust', 'pricing'];

test('landing v2 renders target sections and working CTAs', async ({ page }) => {
  await page.goto('/?staticHero=1');

  await expect(page.getByRole('heading', { name: /Where policy analysts write/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Try the Syria case/i }).first()).toHaveAttribute('href', '/login?demo=1');
  await expect(page.getByRole('link', { name: /See how it works/i })).toHaveAttribute('href', '#six-steps');

  for (const id of sectionIds) {
    await expect(page.locator(`#${id}`), `section #${id}`).toHaveCount(1);
  }

  await page.getByRole('link', { name: /See how it works/i }).click();
  await expect(page.locator('#six-steps')).toBeInViewport();

  await expect(page.getByRole('link', { name: /Talk to Giulio/i })).toHaveAttribute(
    'href',
    'mailto:hello@tacitus.me?subject=PRAXIS%20intro%20call',
  );
});

test('live demo keyboard navigation steps through screens', async ({ page }) => {
  await page.goto('/?staticHero=1');

  const demo = page.getByRole('region', { name: /Interactive 35 second Syria case demo/i });
  await demo.focus();
  await page.keyboard.press('ArrowRight');

  await expect(page.getByText(/demo\/syria-case · Graph staging/i)).toBeVisible();
});
