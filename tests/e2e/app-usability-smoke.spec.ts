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

test('demo workbench exposes context, ontology, graph, tools, memo, and draft surfaces', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await openExampleWorkbench(page, 'syria-2026');
  await expect(page.getByText('Example case')).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();

  await page.getByRole('button', { name: /^Desk$/i }).click();
  await expect(page.getByTestId('workbench-desk-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Desk$/i })).toBeVisible();
  await expect(page.getByText(/Next best actions/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Review queue$/i })).toBeVisible();

  await page.getByRole('button', { name: /^Context$/i }).click();
  await expect(page.getByTestId('workbench-context-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Context Studio$/i })).toBeVisible();
  await expect(page.getByText(/Shape the scope/i)).toBeVisible();
  await expect(page.getByText(/Frame editor/i)).toBeVisible();

  await page.getByRole('button', { name: /^Library$/i }).click();
  await expect(page.getByTestId('workbench-library-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Library$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Saved claims$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Memo versions$/i })).toBeVisible();

  await page.getByRole('button', { name: /^Research$/i }).click();
  await expect(page.getByTestId('workbench-research-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Research$/i })).toBeVisible();
  await expect(page.getByText(/Staged collection plan/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Candidate sources$/i })).toBeVisible();

  await page.getByRole('button', { name: /^Ontology$/i }).click();
  await expect(page.getByTestId('ontology-schema-viewer')).toBeVisible();
  await expect(page.getByText('Node Types', { exact: true })).toBeVisible();
  await expect(page.getByText('Validators', { exact: true })).toBeVisible();
  await expect(page.getByTestId('ontology-active-lenses')).toBeVisible();
  await expect(page.getByTestId('ontology-validator-pass-rate')).toBeVisible();
  await expect(page.getByTestId('ontology-primitive-coverage')).toBeVisible();
  await expect(page.getByTestId('ontology-recommended-tools')).toBeVisible();

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

  await page.getByRole('button', { name: /^Draft$/i }).click();
  await expect(page.getByTestId('workbench-draft-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Briefing Assembly$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Memos Selection$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Cover Page$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Appendices$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Redaction Settings$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Export Controls$/i })).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('workbench case picker uses readable copy contrast', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.goto('/app/workbench');
  const intro = page.getByText(/Each case opens in the same operating room/i);
  await expect(intro).toBeVisible();

  const color = await intro.evaluate((element) => getComputedStyle(element).color);
  expect(color).toBe('rgb(51, 65, 85)');

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
