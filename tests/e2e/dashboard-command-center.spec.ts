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

  await expect(page.getByTestId('praxis-dashboard-command-center')).toBeVisible();
  await expect(page.getByTestId('dashboard-graph-orbit')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Start from the case/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Graph Inspect actors/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Tools Run ontology-aware/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Memo Studio Draft and export/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Boardroom Launch advisor/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /ACH Stress-test/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Personas/i })).toBeVisible();

  await page.getByRole('link', { name: /Graph Inspect actors/i }).click();
  await expect(page).toHaveURL(/\/app\/workbench\/syria-2026\?tab=graph/);
  await expect(page.getByTestId('praxis-graph-canvas')).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('dashboard graph remains prominent on mobile', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await openExampleWorkbench(page, 'syria-2026');
  await page.goto('/app/dashboard');

  const graph = page.getByTestId('dashboard-graph-orbit');
  await expect(page.getByTestId('praxis-dashboard-command-center')).toBeVisible();
  await expect(graph).toBeVisible();
  await expect(page.getByRole('link', { name: /Graph Inspect actors/i })).toBeVisible();

  const box = await graph.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(300);
  expect(box?.height ?? 0).toBeGreaterThan(280);

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
