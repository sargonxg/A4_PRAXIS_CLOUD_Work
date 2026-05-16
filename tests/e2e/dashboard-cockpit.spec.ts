import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';
import { openExampleWorkbench } from './personas/_shared/persona-fixtures';

const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /Download the React DevTools/i,
  /Hydration failed because/i,
  /eval\(\) is not supported in this environment/i,
  /^Warning:/,
];

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  });
  return errors;
}

test('dashboard is the shared PRAXIS capsule cockpit', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await openExampleWorkbench(page, 'user-case');
  await page.goto('/app/dashboard');

  await expect(page.getByTestId('dashboard-cockpit-only-shell')).toBeVisible();
  await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible();
  await expect(page.getByTestId('praxis-main-composer')).toBeVisible();
  await expect(page.getByTestId('tasklet-tool-cards')).toBeVisible();
  await expect(page.getByText(/^What can PRAXIS do for you\?$/i)).toBeVisible();
  await expect(page.getByText(/^Active ContextCapsules$/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^Learn$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Pricing$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Release notes$/i })).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('dashboard cockpit stays usable on mobile', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await openExampleWorkbench(page, 'user-case');
  await page.goto('/app/dashboard');

  const composer = page.getByTestId('praxis-main-composer');
  await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible();
  await expect(composer).toBeVisible();
  await expect(page.getByPlaceholder('Describe a task or responsibility')).toBeVisible();

  const box = await composer.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(300);
  expect(box?.height ?? 0).toBeGreaterThan(180);

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
