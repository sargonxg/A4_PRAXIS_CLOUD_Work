import { expect, test } from '@playwright/test';
import dossier from '../fixtures/example-advisory-dossier.json';
import { projectFirestore } from '../helpers/project-firestore';
import { createProject, getProject, listProjects, mutateProject, ProjectError } from '../../src/lib/projects/service';
import { sanitizeCapsule } from '../../src/lib/context/capsule-service';

test.use({ serviceWorkers: 'block' });
test('private project scope and pinned assignments survive reconnect, lost responses and context changes', async ({ context, page, baseURL }) => {
  test.setTimeout(180_000);
  test.info().annotations.push({ type: 'evidence', description: 'Loopback UI + real project service with transactional in-memory storage fixture. Firebase authentication/session and auxiliary APIs are mocked. No model/provider or live writes.' });
  const origin = new URL(baseURL ?? 'http://localhost:3102');
  expect(['localhost', '127.0.0.1']).toContain(origin.hostname);
  const fixture = projectFirestore();
  fixture.records.set('users/fixture-analyst', { uid: 'fixture-analyst' });
  const capsulePath = 'users/fixture-analyst/capsules/example-advisory';
  fixture.records.set(capsulePath, sanitizeCapsule({ capsuleId: 'example-advisory', ownerUid: 'fixture-analyst', version: 1, label: dossier.title, summary: dossier.sources[0].text, coreRefs: { documentCoreIds: ['EA-D1'], sourceCoreIds: ['EA-D1'] } }));
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  let loseCreationResponse = true;
  let failBeforeCreation = true;
  const unknownWrites: string[] = [];
  await context.route('**/*', async (route) => {
    const req = route.request(); const url = new URL(req.url());
    if (url.origin !== origin.origin) return route.abort('blockedbyclient');
    if (!url.pathname.startsWith('/api/')) return ['GET', 'HEAD'].includes(req.method()) ? route.continue() : route.abort('blockedbyclient');
    try {
      if (url.pathname === '/api/projects' && req.method() === 'GET') return route.fulfill({ json: { projects: await listProjects('fixture-analyst', { db: fixture.db }) } });
      if (url.pathname === '/api/projects' && req.method() === 'POST') {
        if (failBeforeCreation) { failBeforeCreation = false; return route.abort('failed'); }
        const project = await createProject('fixture-analyst', req.postDataJSON(), { db: fixture.db });
        if (loseCreationResponse) { loseCreationResponse = false; return route.abort('failed'); }
        return route.fulfill({ json: { project, persisted: true } });
      }
      if (url.pathname.startsWith('/api/projects/')) {
        const id = url.pathname.split('/').at(-1)!;
        if (req.method() === 'GET') { const project = await getProject('fixture-analyst', id, { db: fixture.db }); return route.fulfill({ status: project ? 200 : 404, json: project ? { project } : { error: 'Project unavailable.' } }); }
        if (req.method() === 'PATCH') return route.fulfill({ json: { project: await mutateProject('fixture-analyst', id, req.postDataJSON(), { db: fixture.db }), persisted: true } });
      }
      if (req.method() === 'GET') {
        if (url.pathname === '/api/auth/session') return route.fulfill({ json: { authenticated: true, user: { id: 'fixture-analyst', email: 'fixture@example.invalid', name: 'Synthetic fixture analyst', isDemo: false } } });
        return route.fulfill({ json: { profile: null, situations: [], items: [], conversations: [], capsules: [] } });
      }
      unknownWrites.push(`${req.method()} ${url.pathname}`);
      return route.fulfill({ status: 501, json: { error: 'Unexpected mutation blocked by fixture.' } });
    } catch (error) {
      return route.fulfill({ status: error instanceof ProjectError ? error.status : 400, json: { error: (error as Error).message } });
    }
  });
  const cookie = { name: 'tacitus-auth-session', value: `${encodeURIComponent(JSON.stringify({ token: 'local-routing-fixture', onboarded: true, onboardingComplete: true, onboardingSkipped: true }))}.local-fixture-signature`, url: origin.origin, httpOnly: true, sameSite: 'Lax' as const };
  await context.addCookies([cookie]);
  await page.goto(`${origin.origin}/app/projects`);
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  for (const [label, value] of [['Project title', dossier.scope.title], ['Research question', dossier.scope.question], ['Intended use', dossier.scope.purpose], ['Audience', dossier.scope.audience], ['Jurisdiction / scope', dossier.scope.jurisdiction], ['Analytical cutoff', dossier.scope.asOfDate], ['Organization mandate', dossier.scope.mandate], ['Approved working conventions', dossier.scope.conventions]]) await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByRole('button', { name: 'Create private project', exact: true }).click();
  await expect(page.getByTestId('project-workspace').getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Research question')).toHaveValue(dossier.scope.question);
  expect(await listProjects('fixture-analyst', { db: fixture.db })).toHaveLength(0);
  await page.getByLabel('Project title').fill('Edited after an interrupted creation');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await expect(page.getByLabel('Project title')).toHaveValue(dossier.scope.title);
  await page.getByRole('button', { name: 'Create private project', exact: true }).click();
  await expect(page.getByTestId('project-workspace').getByRole('alert')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await expect(page.getByLabel('Research question')).toHaveValue(dossier.scope.question);
  await page.getByRole('button', { name: 'Create private project', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved project_' })).toBeVisible();
  expect((await listProjects('fixture-analyst', { db: fixture.db }))).toHaveLength(1);
  const projectId = new URL(page.url()).searchParams.get('projectId')!;
  await page.getByLabel('Saved capsule ID', { exact: true }).fill('example-advisory');
  await page.getByRole('button', { name: 'Attach selected revision' }).click();
  await expect(page.getByText(`${dossier.title} · v1 · situation · Private`, { exact: true })).toBeVisible();
  await page.getByLabel('Work item title').fill('Qualified reporting-rule brief');
  await page.getByLabel('Bounded instruction').fill('Funding remains undecided. The pilot is optional; July is considered, without adoption.');
  await page.getByRole('button', { name: 'Save draft work item' }).click();
  await expect(page.getByText('Qualified reporting-rule brief · draft · brief', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Qualified reporting-rule brief · draft · brief', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Analytical cutoff')).toHaveValue('2026-01-15');
  await page.getByLabel('Research question').fill('Human correction retained across a stale write');
  const prior = await getProject('fixture-analyst', projectId, { db: fixture.db });
  await mutateProject('fixture-analyst', projectId, { action: 'scope', expectedRevision: prior!.revision, operationId: 'concurrent-correction', scope: { ...dossier.scope, audience: 'Concurrent saved audience' } }, { db: fixture.db });
  await page.getByRole('button', { name: 'Save scope', exact: true }).click();
  await expect(page.getByTestId('project-workspace').getByRole('alert')).toContainText('changed elsewhere');
  await expect(page.getByLabel('Research question')).toHaveValue('Human correction retained across a stale write');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reload saved project' }).click();
  await expect(page.getByLabel('Research question')).toHaveValue('Human correction retained across a stale write');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved project' }).click();
  await expect(page.getByLabel('Audience', { exact: true })).toHaveValue('Concurrent saved audience');
  await page.getByLabel('Work item title').fill('Unsaved assignment');
  await page.getByLabel('Bounded instruction').fill('Do not discard this without a decision');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reload saved project' }).click();
  await expect(page.getByLabel('Bounded instruction')).toHaveValue('Do not discard this without a decision');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved project' }).click();
  await expect(page.getByLabel('Bounded instruction')).toHaveValue('');
  await page.getByLabel('Bounded instruction').fill('Recover me after history navigation');
  await page.getByRole('heading', { name: 'Projects', exact: true }).focus();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.keyboard.press('/');
  await expect(page).toHaveURL(/\/app\/projects/);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt: 'Inspect the saved question' } })));
  await expect(page).toHaveURL(/\/app\/projects/);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/projects/);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  await expect(page).toHaveURL(/\/app\?thread=/, { timeout: 60_000 });
  await page.goBack();
  await expect(page.getByLabel('Bounded instruction')).toHaveValue('Recover me after history navigation');
  await expect(page.getByText('Recovered an unsaved assignment from this browser. Save to persist it on the server.')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reload saved project' }).click();
  await expect(page.getByLabel('Bounded instruction')).toHaveValue('');
  fixture.records.set(capsulePath, { ...(fixture.records.get(capsulePath) as object), summary: dossier.sources[2].text });
  await page.getByRole('button', { name: 'Reload saved project' }).click();
  await expect(page.getByTestId('project-workspace').getByRole('alert')).toContainText('Snapshot changed');
  await expect(page.getByRole('button', { name: 'Save draft work item' })).toBeDisabled();
  const welcomeDismiss = page.getByRole('button', { name: 'Dismiss welcome', exact: true });
  if (await welcomeDismiss.isVisible()) await welcomeDismiss.click();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    await page.locator('#workspace-main').evaluate((element) => { element.scrollTop = 0; });
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeInViewport();
    await page.screenshot({ path: `output/projects/walkthrough/project-${width}.png` });
    await page.getByRole('heading', { name: 'Selected context', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/projects/walkthrough/context-${width}.png` });
  }
  await page.getByText('Captured scope and context', { exact: true }).click();
  await page.getByText('Qualified reporting-rule brief · draft · brief', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/projects/walkthrough/work-1440.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  await page.locator('#workspace-main').evaluate((element) => { element.scrollTop = 0; });
  await page.screenshot({ path: 'output/projects/walkthrough/project-200-percent.png' });
  await page.getByRole('heading', { name: 'Selected context', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/projects/walkthrough/context-200-percent.png' });
  await page.getByRole('button', { name: 'New project', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Project title')).toHaveValue('');
  await expect(page.getByText('Qualified reporting-rule brief · draft · brief', { exact: true })).toHaveCount(0);
  await context.clearCookies();
  await context.addCookies([cookie]);
  await page.goto(`${origin.origin}/app/projects?projectId=${projectId}`);
  await expect(page.getByText('Qualified reporting-rule brief · draft · brief', { exact: true })).toBeVisible();
  expect(unknownWrites).toEqual([]);
  expect(browserErrors).toEqual([]);
});
