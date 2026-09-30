import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', label: 'Home', heading: 'Policy analysis you can inspect.' },
  { path: '/pricing', label: 'Pricing', heading: 'Start with one question.' },
  { path: '/learn', label: 'Learn', heading: 'How PRAXIS works' },
  { path: '/guide', label: 'Guide', heading: 'Ask the question. Check the evidence. Save the work.' },
  { path: '/release-notes', label: 'Release notes', heading: 'Release notes' },
];

for (const width of [390, 1440]) {
  test(`public pages share usable navigation and content at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    for (const item of pages) {
      const response = await page.goto(item.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1, name: item.heading, exact: true })).toBeVisible();
      await expect(page.locator('main')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
      if (width < 1024) {
        const menu = page.getByRole('button', { name: 'Toggle menu' });
        expect((await menu.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        await menu.click();
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        for (const destination of pages) await expect(page.locator('#mobile-menu').getByRole('link', { name: destination.label, exact: true })).toBeVisible();
        await expect(page.locator('#mobile-menu').getByRole('link', { name: item.label, exact: true })).toHaveAttribute('aria-current', 'page');
        await page.keyboard.press('Escape');
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
        await expect(menu).toBeFocused();
      } else {
        await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeHidden();
        for (const destination of pages) await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: destination.label, exact: true })).toBeVisible();
      }
      await page.screenshot({ path: `output/playwright/public-${item.label.toLowerCase().replaceAll(' ', '-')}-${width}.png`, fullPage: true });
    }
    expect(pageErrors).toEqual([]);
    await page.goto('/guide');
    await expect(page.getByRole('link', { name: 'Build from documents', exact: true })).toHaveAttribute('href', '/app/capsules/builder');
    await page.goto('/release-notes');
    await expect(page.getByRole('heading', { name: 'Clearer first steps and more reliable capsule work' })).toBeVisible();
    await page.goto('/pricing');
    await page.getByTestId('pricing-checkout-free').click();
    await page.waitForURL(/\/login\?/);
    expect(new URL(page.url()).searchParams.get('redirect')).toBe('/app');
  });
}
