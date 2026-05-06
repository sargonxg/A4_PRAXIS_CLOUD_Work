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

test('landing renders hero animation, static fallback, and 3D ontology graph', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.goto('/');
  await expect(page.getByTestId('landing-hero-visual')).toBeVisible();
  await expect(page.getByText(/Policy workbench/i).first()).toBeVisible();

  await page.locator('#dialectica').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('dialectica-graph-3d')).toBeVisible();
  await expect(page.getByText(/Ontology-bound/i)).toBeVisible();
  await expect(page.getByText(/Cypher grounded/i)).toBeVisible();

  await page.goto('/?staticHero=1');
  await expect(page.getByTestId('landing-hero-visual')).toBeVisible();
  await expect(page.getByText(/source-grounded graph/i)).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('demo workbench exposes context, ontology, graph, tools, and memo surfaces', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await openExampleWorkbench(page, 'syria-2026');
  await expect(page.getByText('Example case')).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();

  await page.getByRole('button', { name: /^Context$/i }).click();
  await expect(page.getByRole('heading', { name: /^Context Studio$/i })).toBeVisible();
  await expect(page.getByText(/Build the case before analysis/i)).toBeVisible();

  await page.getByRole('button', { name: /^Ontology$/i }).click();
  await expect(page.getByTestId('ontology-schema-viewer')).toBeVisible();
  await expect(page.getByText(/Node Types/i)).toBeVisible();
  await expect(page.getByText(/Validators/i)).toBeVisible();

  await page.getByRole('button', { name: /^Graph$/i }).click();
  await expect(page.getByTestId('praxis-graph-canvas')).toBeVisible();
  await expect(page.getByRole('img', { name: /Canonical PRAXIS graph/i })).toBeVisible();
  await expect(page.getByText(/Graph nodes/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Tools$/i }).click();
  await expect(page.getByTestId('tool-marketplace')).toBeVisible();
  await expect(page.getByText('Run history', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Run$/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /^Memos$/i }).click();
  await expect(page.getByRole('heading', { name: /Memo Studio/i })).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
