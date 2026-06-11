import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';
const WIDTHS = [360, 390, 768] as const;

test.describe('Mobile landing responsiveness', () => {
  for (const width of WIDTHS) {
    test(`light marketing home renders without cockpit overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 768 ? 900 : 844 });
      await page.goto(BASE_URL);
      await expect(page.getByTestId('praxis-chat-first-shell')).toBeVisible();
      await expect(page.getByTestId('marketing-home')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Ask anything\. Leave with a sourced brief\./i })).toBeVisible();
      await expect(page.getByTestId('tasklet-praxis-workbench')).toHaveCount(0);

      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflowX, `document overflow at ${width}px`).toBeLessThanOrEqual(2);
    });

    test(`primary CTA meets touch-target floor at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 768 ? 900 : 844 });
      await page.goto(BASE_URL);
      const cta = page.getByTestId('marketing-primary-cta');
      const box = await cta.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });
  }
});
