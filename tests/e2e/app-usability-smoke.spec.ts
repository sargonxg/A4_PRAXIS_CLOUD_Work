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
  await expect(page.getByRole('heading', { name: /Policy AI that starts with the right context\./i })).toBeVisible();
  await expect(page.getByText(/Ask PRAXIS about this policy context/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /^Open Ask workspace$/i }).first()).toBeVisible();

  const realApp = page.locator('#real-app');
  await realApp.scrollIntoViewIfNeeded();
  await expect(realApp.getByText(/Inside the real app/i)).toBeVisible();
  await expect(realApp.getByText(/Policy context creation, research, and memo writing in one place\./i)).toBeVisible();
  await expect(realApp.getByText(/dashboard, workbench, graph, memo studio, research, and context creation/i)).toBeVisible();

  await page.goto('/?staticHero=1');
  await expect(page.getByRole('heading', { name: /Policy AI that starts with the right context\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Open Ask workspace$/i }).first()).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('demo workbench exposes context, ontology, graph, tools, memo, and draft surfaces', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  const closeWorkspaceTab = () => page.getByRole('button', { name: /^Close workspace tab$/i }).click();

  await openExampleWorkbench(page, 'syria-2026');
  await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();

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
  await expect(page.getByText(/Select an artifact/i)).toBeVisible();
  await expect(page.getByText(/Details, provenance fields, and source\/export actions appear here/i)).toBeVisible();
  await expect(page.getByText(/^Upload source$/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Refresh receipts$/i })).toBeVisible();
  await closeWorkspaceTab();

  await page.getByTestId('workspace-chapter-desk').getByRole('button', { name: /^Research$/i }).click();
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
  await expect(page.getByRole('heading', { name: /^Recipe library$/i })).toBeVisible();
  await expect(page.getByText(/Recommended for this case/i)).toBeVisible();
  await expect(page.getByTestId('tool-marketplace').getByText(/DIALECTICA recipes/i)).toBeVisible();

  const memosSurface = page.getByTestId('workbench-memos-surface');
  if (!(await memosSurface.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^Memos$/i }).click();
  }
  await expect(memosSurface).toBeVisible();
  await expect(memosSurface.getByRole('heading', { name: /From graph evidence to work product/i })).toBeVisible();
  await expect(memosSurface.getByRole('link', { name: /Principal briefing/i })).toBeVisible();
  await expect(memosSurface.getByRole('link', { name: /Policy memo/i })).toBeVisible();

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

  await openExampleWorkbench(page, 'syria-2026');
  await page.goto('/app/workbench');
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  const intro = page.getByText(/Ask PRAXIS starts from (?:the selected user core and situation core|[^.]+ and [^.]+)\./i);
  await expect(intro).toBeVisible();

  const color = await intro.evaluate((element) => getComputedStyle(element).color);
  const luminance = color.startsWith('lab(')
    ? Number((color.match(/^lab\(([-0-9.]+)/)?.[1] ?? '100'))
    : color.startsWith('rgb(')
      ? (() => {
          const [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
          return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55;
        })()
      : 100;
  expect(luminance).toBeGreaterThan(0);
  expect(luminance).toBeLessThan(40);

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});

test('ask workspace exposes the full-page write surface and core attachers', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await openExampleWorkbench(page, 'syria-2026');
  await page.goto('/app/assistant');

  await expect(page.getByTestId('ask-workspace-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Write, attach context, and route the work from one page\./i })).toBeVisible();
  await expect(page.getByText(/^Ask PRAXIS$/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^Tools library$/i })).toBeVisible();
  await expect(page.getByLabel(/User Core/i)).toBeVisible();
  await expect(page.getByLabel(/Situation Core/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /^Open drafting workbench$/i })).toBeVisible();
  await expect(page.getByText(/Gemini now, provider picker later/i)).toBeVisible();

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
});
