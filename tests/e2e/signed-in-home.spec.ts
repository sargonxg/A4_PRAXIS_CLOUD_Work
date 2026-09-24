import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test('mobile and desktop users can create and attach quick context, then reach the document builder', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');
  await page.setViewportSize({ width: 390, height: 844 });
  await authenticateFirebaseCanary(page, BASE, '/app', { finishOnboardingLater: true, expectComposer: false });
  const composer = page.getByRole('textbox', { name: 'Ask PRAXIS', exact: true });
  await expect(composer).toBeVisible({ timeout: 30_000 });
  const welcome = page.getByRole('button', { name: 'Dismiss welcome', exact: true });
  if (await welcome.isVisible()) await welcome.click();
  const actions = page.getByRole('button', { name: 'Capsule Dock actions', exact: true });
  await expect(actions).toBeVisible();
  expect((await actions.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await actions.click();
  await page.getByRole('menuitem', { name: 'Build context', exact: true }).click();
  const builder = page.getByTestId('ask-inline-context-builder');
  await expect(builder).toBeVisible();
  await builder.getByRole('button', { name: 'Create and attach', exact: true }).click();
  await expect(builder).toBeHidden({ timeout: 90_000 });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByTestId('capsule-dock')).toContainText(/Policy/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: `output/playwright/signed-in-context-${width}.png`, fullPage: true });
  }
  await page.reload();
  await expect(page.getByTestId('capsule-dock')).toContainText(/Policy/, { timeout: 30_000 });
  await page.getByTestId('context-toggle').click();
  await page.getByTestId('advanced-edit-context').getByRole('link', { name: 'Build context', exact: true }).click();
  await expect(page.getByLabel('What should this capsule do?')).toBeVisible();
});
