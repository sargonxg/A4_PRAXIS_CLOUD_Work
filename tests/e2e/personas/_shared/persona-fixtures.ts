import crypto from 'node:crypto';
import { expect, type Page } from '@playwright/test';

const DEMO_SESSION_SECRET = 'praxis-dev-cookie-signing-secret';
const DEMO_SESSION_COOKIE = 'tacitus-auth-session';
const BASE_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

function signDemoSession(value: string) {
  const sig = crypto.createHmac('sha256', DEMO_SESSION_SECRET).update(value).digest('base64url');
  return `${value}.${sig}`;
}

async function seedDemoSession(page: Page) {
  const sessionValue = JSON.stringify({ demo: true, onboarded: true, onboardingComplete: true });
  await page.context().addCookies([
    {
      name: DEMO_SESSION_COOKIE,
      value: signDemoSession(sessionValue),
      url: BASE_ORIGIN,
    },
  ]);
}

export async function openExampleWorkbench(page: Page, caseId: string, tab = 'chapters') {
  await page.addInitScript(() => {
    window.localStorage.setItem('praxis-tour-seen', 'true');
  });
  await seedDemoSession(page);
  await page.goto(`/app/workbench/${caseId}`);
  await page.waitForURL(new RegExp(`/app/workbench/${caseId}(?:\\?.*)?$`), { timeout: 30_000 });
  await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ask PRAXIS/i }).first()).toBeVisible();
  const dismissPrimer = page.getByRole('button', { name: /^Dismiss conflict grammar primer$/i });
  if (await dismissPrimer.isVisible().catch(() => false)) {
    await dismissPrimer.click();
  }

  if (tab !== 'chapters') {
    await page.goto(`/app/workbench/${caseId}?tab=${tab}`);
    await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
  }
}

export async function openSeededDemoWorkbench(page: Page, caseId: string, tab?: 'context' | 'library' | 'ontology' | 'graph') {
  await page.addInitScript(() => {
    window.localStorage.setItem('praxis-tour-seen', 'true');
  });
  await seedDemoSession(page);
  await page.goto(`/app/workbench/${caseId}`);
  await page.waitForURL(new RegExp(`/app/workbench/${caseId}$`), { timeout: 30_000 });
  if (tab) {
    await page.goto(`/app/workbench/${caseId}?tab=${tab}`);
    await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
  }
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByTestId('praxis-workspace-shell')).toBeVisible();
  const dismissPrimer = page.getByRole('button', { name: /^Dismiss conflict grammar primer$/i });
  if (await dismissPrimer.isVisible().catch(() => false)) {
    await dismissPrimer.click();
  }
}

export async function openWorkbenchChapter(page: Page, chapter: 'Research' | 'Memos' | 'Draft' | 'ACH' | 'Tools' | 'Boardroom') {
  const legacyDeskSurface = page.getByTestId('workspace-chapter-desk');
  const button = legacyDeskSurface.getByRole('button', { name: new RegExp(`^${chapter}$`, 'i') });
  await expect(button).toBeVisible();
  if ((await button.getAttribute('aria-pressed')) !== 'true') {
    await button.click();
  }
  await page.locator(`#${chapter.toLowerCase()}`).scrollIntoViewIfNeeded();
}

export async function expectWorkbenchTab(page: Page, heading: string) {
  const headingPattern = heading === 'Graph'
    ? /^(Graph|Graph Visualization)$/i
    : heading === 'Ontology'
      ? /^(Ontology|Ontology System)$/i
      : heading === 'Tools'
        ? /^(Tools|Tools Marketplace)$/i
        : new RegExp(`^${heading}$`, 'i');

  await expect(page.getByRole('heading', { name: headingPattern }).first()).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();

  if (heading === 'Graph') {
    await expect(page.getByTestId('praxis-graph-canvas')).toBeVisible();
    await expect(page.getByText('Graph nodes').first()).toBeVisible();
    await expect(page.getByText(/truth layers/i).first()).toBeVisible();
    return;
  }

  await expect(page.getByText('Risk').first()).toBeVisible();
  await expect(page.getByText('Graph nodes').first()).toBeVisible();
}
