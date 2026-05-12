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

test('dashboard is the real app command center for active case work', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await openExampleWorkbench(page, 'syria-2026');
  await page.goto('/app/dashboard');

  await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();
  await expect(page.getByTestId('core-library-panel')).toBeVisible();
  await expect(page.getByTestId('draft-workbench-panel')).toBeVisible();
  await expect(page.getByText(/^Ask PRAXIS$/i).first()).toBeVisible();
  await expect(page.getByText(/^Core library$/i).first()).toBeVisible();
  await expect(page.getByText(/^Drafting workbench$/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Open memo route/i }).first()).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('dashboard graph remains prominent on mobile', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await openExampleWorkbench(page, 'syria-2026');
  await page.goto('/app/dashboard');

  const shell = page.getByTestId('praxis-workspace-shell');
  const library = page.getByTestId('core-library-panel');
  await expect(shell).toBeVisible();
  await expect(library).toBeVisible();
  await expect(page.getByText(/^Core library$/i).first()).toBeVisible();

  const box = await library.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(300);
  expect(box?.height ?? 0).toBeGreaterThan(280);

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
