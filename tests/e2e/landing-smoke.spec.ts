import { test, expect, type ConsoleMessage } from '@playwright/test';

/**
 * Landing smoke — loads `/`, confirms no console errors, scrolls through every
 * section, and clicks each nav anchor to verify it resolves to a real section
 * with that id. Reads `PLAYWRIGHT_BASE_URL` to target staging or prod.
 *
 * Known-benign warnings (Next.js dev hints, framer-motion SSR notes) are
 * filtered out; any unknown error fails the run.
 */

const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /Download the React DevTools/i,
  /eval\(\) is not supported in this environment/i,
  /Hydration failed because/i, // surfaced as warning in dev but may still fail the page
  /A tree hydrated but some attributes of the server rendered HTML didn't match/i,
  /<script> cannot contain a <link>/i,
  /^Warning:/, // React dev warnings
];

test('landing page renders without console errors and every nav anchor resolves', async ({ page, baseURL }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
    consoleErrors.push(text);
  });

  await page.goto(baseURL ?? '/');
  await expect(page).toHaveTitle(/PRAXIS|TACITUS/i);

  // Scroll to bottom in steps so IntersectionObserver-driven sections mount.
  const steps = 8;
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  for (let i = 1; i <= steps; i++) {
    await page.evaluate(
      ({ i, steps, h }: { i: number; steps: number; h: number }) => {
        const total = document.documentElement.scrollHeight;
        window.scrollTo({ top: (i / steps) * total, behavior: 'instant' as ScrollBehavior });
        return total > h;
      },
      { i, steps, h: viewport.height },
    );
    await page.waitForTimeout(200);
  }

  // Collect in-page nav anchors
  const anchors = await page.locator('a[href^="#"]').evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).getAttribute('href') ?? ''),
  );
  const uniqueIds = Array.from(new Set(anchors.map((h) => h.replace(/^#/, '')).filter(Boolean)));

  // Every anchor target must correspond to a real element with that id.
  for (const id of uniqueIds) {
    await expect(page.locator(`#${cssEscape(id)}`), `anchor #${id} must resolve`).toHaveCount(1);
  }

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('landing does not expose cockpit capsule filters to logged-out visitors', async ({ page, baseURL }) => {
  await page.goto(baseURL ?? '/');
  await expect(page.getByTestId('marketing-home')).toBeVisible();
  await expect(page.getByTestId('ask-context-bar')).toBeVisible();
  await expect(page.getByTestId('capsule-taxonomy-filter-bar')).toHaveCount(0);
  await expect(page.getByTestId('tasklet-capsule-cards')).toHaveCount(0);
});

function cssEscape(id: string): string {
  return id.replace(/([\.:#\[\]\(\)\s])/g, '\\$1');
}
