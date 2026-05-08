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
  const closeWorkspaceTab = () => page.getByRole('button', { name: /^Close workspace tab$/i }).click();

  await openExampleWorkbench(page, 'syria-2026');
  await expect(page.getByText('Example case')).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();

  await expect(page.getByRole('button', { name: /Desk.*always on/i })).toBeVisible();
  await expect(page.getByTestId('workbench-desk-surface')).toBeVisible();
  await expect(page.getByText(/Context generation flow/i)).toBeVisible();
  await expect(page.getByText(/Geographic intelligence/i)).toBeVisible();
  await expect(page.getByText(/Cinematic timeline/i)).toBeVisible();
  await expect(page.getByText(/Stakeholder|NYC/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Context$/i }).click();
  await expect(page.getByTestId('workbench-context-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Context Studio$/i })).toBeVisible();
  await expect(page.getByText(/Shape the scope/i)).toBeVisible();
  await expect(page.getByText(/Frame editor/i)).toBeVisible();
  await expect(page.getByText(/AI Scope Advisory/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Preferences$/i })).toBeVisible();
  await expect(page.getByText('Document upload', { exact: true })).toBeVisible();
  await expect(page.getByText('Actors / Claims / Interests', { exact: true })).toBeVisible();
  await closeWorkspaceTab();

  await page.getByRole('button', { name: /^Library$/i }).click();
  const librarySurface = page.getByTestId('workbench-library-surface');
  await expect(librarySurface).toBeVisible();
  await expect(librarySurface.getByRole('heading', { name: /^Library$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Saved claims$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Memo versions$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Save case-frame claim$/i })).toBeVisible();
  await closeWorkspaceTab();

  await page.getByRole('button', { name: /^Research$/i }).click();
  const researchSurface = page.getByTestId('workbench-research-surface');
  await expect(researchSurface).toBeVisible();
  await expect(researchSurface.getByText(/Current source receipts/i)).toBeVisible();
  await expect(researchSurface.getByText('Grounded reference layer', { exact: true })).toBeVisible();
  await expect(researchSurface.getByText(/Live AI modes/i)).toBeVisible();

  await page.getByRole('button', { name: /^Ontology$/i }).click();
  await expect(page.getByTestId('ontology-schema-viewer')).toBeVisible();
  await expect(page.getByText('Node Types', { exact: true })).toBeVisible();
  await expect(page.getByText('Validators', { exact: true })).toBeVisible();
  await expect(page.getByTestId('ontology-active-lenses')).toBeVisible();
  await expect(page.getByTestId('ontology-validator-pass-rate')).toBeVisible();
  await expect(page.getByTestId('ontology-primitive-coverage')).toBeVisible();
  await expect(page.getByTestId('ontology-recommended-tools')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add secondary ontology$/i })).toBeVisible();
  await closeWorkspaceTab();

  await page.getByRole('button', { name: /^Graph$/i }).click();
  await expect(page.getByTestId('praxis-graph-canvas')).toBeVisible();
  await expect(page.getByRole('img', { name: /Canonical PRAXIS graph/i })).toBeVisible();
  await expect(page.getByText(/Graph nodes/i).first()).toBeVisible();
  await closeWorkspaceTab();

  await page.getByRole('button', { name: /^Tools$/i }).click();
  await expect(page.getByTestId('workbench-tools-surface')).toBeVisible();
  await expect(page.getByTestId('tool-marketplace')).toBeVisible();
  await expect(page.getByText(/DIALECTICA backbone/i)).toBeVisible();
  await expect(page.getByText(/Graph-grounded execution/i)).toBeVisible();

  await page.getByRole('button', { name: /^Memos$/i }).click();
  await expect(page.getByTestId('workbench-memos-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Memo Studio$/i })).toBeVisible();
  await expect(page.getByText(/From graph evidence to work product/i)).toBeVisible();

  await page.getByRole('button', { name: /^Draft$/i }).click();
  await expect(page.getByTestId('workbench-draft-surface')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Briefing Assembly$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Memos Selection$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Cover Page$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Appendices$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Redaction Settings$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Export Controls$/i })).toBeVisible();
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^Export package$/i }).click(),
  ]).then(([file]) => file);
  expect(download.suggestedFilename()).toContain('briefing-package');
  await expect(page.getByText(/Export manifest persisted|Demo export manifest generated|Download prepared locally/i)).toBeVisible();

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
