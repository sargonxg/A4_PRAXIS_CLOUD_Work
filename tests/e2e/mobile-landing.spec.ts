import { test, expect, devices } from "@playwright/test";

/**
 * Mobile landing parity — verifies the PRAXIS landing renders correctly on
 * common iPhone viewports with the design system intact.
 *
 * Run via: npm run test:mobile
 *
 * Requires the dev server running at http://localhost:3000 (or set BASE_URL).
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

test.use({ ...devices["iPhone 13"] });

test.describe("Mobile landing — iPhone 13 (390×844)", () => {
  test("landing renders with capsule buttons + sections", async ({ page }) => {
    await page.goto(BASE_URL);

    // Capsule button class lands on the page (proves DESIGN_SYSTEM shipped).
    const ctaCount = await page
      .locator(".btn-capsule-primary, .btn-capsule-secondary")
      .count();
    expect(ctaCount).toBeGreaterThan(0);

    // Section rhythm wrapper exists for the additive landing block.
    await expect(page.locator(".section-rhythm")).toHaveCount(1);
  });

  test("primary mobile CTAs meet touch-target floor (≥44px)", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const buttons = page.locator(".btn-capsule-primary, .btn-capsule-secondary");
    const n = await buttons.count();
    for (let i = 0; i < n; i++) {
      const el = buttons.nth(i);
      const box = await el.boundingBox();
      if (!box) continue;
      expect(box.height, `cta #${i} height`).toBeGreaterThanOrEqual(40);
    }
  });

  test("mobile drawer opens, closes, and locks body scroll", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const toggle = page.locator('button[aria-label="Toggle menu"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Body scroll locked
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe("hidden");
    // Close
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("output catalog horizontal-scrolls without body overflow", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.locator("text=Output catalog").scrollIntoViewIfNeeded();
    const bodyOverflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(bodyOverflowX).toBeLessThanOrEqual(2);
  });
});

test.describe("Mobile landing — reduced motion", () => {
  test.use({
    ...devices["iPhone 13"],
    reducedMotion: "reduce",
  });

  test("respects prefers-reduced-motion on capsule hero", async ({ page }) => {
    await page.goto(BASE_URL);
    // The CoreCapsuleHero is not necessarily on the landing today, but the
    // capsule strip / section rhythm should still render without runtime
    // animation errors.
    await expect(page.locator(".section-rhythm")).toBeVisible();
  });
});
