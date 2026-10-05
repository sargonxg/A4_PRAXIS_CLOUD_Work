import { test, expect, request as playwrightRequest, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials, canaryCredentialSkipReason } from './helpers/auth';
import type { SignalDesk } from '../../src/lib/signal/schema';

// Chromium needs the same managed egress path as Node; local app requests stay local.
if (process.env.HTTPS_PROXY) test.use({ proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } });

const created: Array<{ uid: string; id: string }> = [];
const localUpstream = process.env.SIGNAL_LOCAL_UPSTREAM;
const browserOrigin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const prefix = `SIGNAL synthetic acceptance ${Date.now()}`;
const sourceText = 'The minister did not adopt the proposal. A public consultation will begin next month.';
const quote = 'The minister did not adopt the proposal.';
const fixtureUrl = `https://example.org/signal-synthetic/${Date.now()}`;
async function saved(page: Page, click: () => Promise<void>) {
  const response = page.waitForResponse(r => r.url().endsWith('/api/signal') && r.request().method() === 'POST');
  await click();
  const result = await response;
  expect(result.status(), 'Actual authenticated SIGNAL mutation status').toBeLessThan(300);
  const body = await result.json();
  if (result.request().postDataJSON()?.action === 'create' && body.desk) created.push({ uid: body.desk.ownerUid, id: body.desk.id });
  await expect(page.getByRole('status').filter({ hasText: /^Saved\.$/ })).toBeVisible({ timeout: 30000 });
  return body.desk as SignalDesk;
}
async function api(page: Page, body: Record<string, unknown>) {
  return page.evaluate(async values => {
    const response = await fetch('/api/signal', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    return { status: response.status, body: await response.json() };
  }, body);
}

async function forwardAppOrigin(page: Page, forwardingFailures: Array<{ method: string; path: string; reason: string }> = []) {
  if (localUpstream) {
    // Serve the local app under its already-authorized web origin. Firebase requests
    // remain real HTTPS requests and retain their actual production-origin referrer.
    const host = new URL(browserOrigin).host;
    await page.route(`https://${host}/**`, async route => {
      const incoming = route.request();
      const original = new URL(incoming.url());
      const target = new URL(`${original.pathname}${original.search}`, localUpstream);
      try {
        const response = await page.request.fetch(target.toString(), {
          method: incoming.method(), headers: { ...await incoming.allHeaders(), 'connection': 'close', 'x-forwarded-host': host, 'x-forwarded-proto': 'https' },
          ...(incoming.postDataBuffer() ? { data: incoming.postDataBuffer()! } : {}),
          maxRedirects: 0,
          // Retry only idempotent reads after the local proxy's reset idle socket.
          maxRetries: incoming.method() === 'GET' ? 2 : 0,
        });
        await route.fulfill({ response });
      } catch (error) {
        await route.abort().catch(() => {});
        // An abandoned background request must fail naturally in the browser, not
        // throw globally after test teardown. Never propagate APIRequest headers.
        const message = error instanceof Error ? error.message : '';
        forwardingFailures.push({ method: incoming.method(), path: original.pathname, reason: page.isClosed() ? 'page-closed' : message.includes('ECONNRESET') ? 'connection-reset' : message.includes('Timeout') ? 'timeout' : 'transport-error' });
      }
    });
  }
}

let cleanupCookieHeader = '';
test.afterAll(async () => {
  if (!created.length) return;
  const client = await playwrightRequest.newContext({ baseURL: localUpstream ?? browserOrigin, extraHTTPHeaders: { Cookie: cleanupCookieHeader } });
  try {
    for (const item of created) {
      const current = await client.get(`/api/signal?deskId=${item.id}`);
      if (current.status() === 404) continue;
      expect(current.status(), 'Cleanup reads only this test-created desk').toBe(200);
      const detail = await current.json();
      const deleted = await client.delete(`/api/signal?deskId=${item.id}&expectedVersion=${detail.desk.version}`);
      expect(deleted.status(), 'Owned cleanup uses the audited deletion API').toBeLessThan(300);
    }
  } catch (error) { if (error instanceof Error && error.message.startsWith('apiRequestContext.')) throw new Error('Local cleanup transport failed; saved test IDs remain available for scoped cleanup.'); throw error; } finally { await client.dispose(); }
});

test('SIGNAL protects the API without a signed-in session', async ({ request }) => {
  const response = await request.get(localUpstream ? `${localUpstream}/api/signal` : '/api/signal');
  expect(response.status()).toBe(401);
});

test('More navigation opens the actual authenticated SIGNAL root', async ({ page }) => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
  test.setTimeout(90000);
  await forwardAppOrigin(page);
  await authenticateFirebaseCanary(page, undefined, '/app', { expectComposer: false });
  await page.getByRole('complementary', { name: 'PRAXIS navigation' }).getByRole('button', { name: 'More', exact: true }).click();
  const signalLink = page.getByRole('navigation', { name: 'More workspace tools' }).getByRole('link', { name: 'SIGNAL', exact: true });
  await expect(signalLink).toHaveAttribute('href', '/signal');
  await signalLink.click();
  await expect(page.getByTestId('signal-world-explorer')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Evidence & briefs', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'SIGNAL', exact: true })).toBeVisible({ timeout: 30000 });
});

test('authenticated synthetic desk: capture, exact denial, review, capsule, approval, correction and portable exports', async ({ page }) => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
  test.setTimeout(240000);
  let firebaseIdToken = '';
  // Keep the actual browser-issued token in memory only for the client-rules check.
  page.on('request', incoming => {
    if (new URL(incoming.url()).pathname === '/api/auth/session' && incoming.method() === 'POST') {
      try { const body = incoming.postDataJSON(); if (typeof body?.token === 'string') firebaseIdToken = body.token; } catch { /* Requests without JSON have no identity token. */ }
    }
  });
  const consoleErrors: string[] = [];
  const consoleCounts: Record<string, number> = {};
  const consoleCategories: Record<string, number> = {};
  page.on('console', message => {
    const type = message.type(); consoleCounts[type] = (consoleCounts[type] ?? 0) + 1;
    if (type !== 'error' && type !== 'warning') return;
    const raw = message.text(); const status = raw.match(/status (?:of )?(\d{3})/i)?.[1];
    const category = status ? `http-${status}` : raw.includes('permission-denied') || raw.includes('Missing or insufficient permissions') ? 'permission-denied' : raw.includes('Firestore') ? 'firestore' : raw.includes('auth/') ? 'authentication' : 'unclassified';
    let sourcePath = 'unknown'; try { sourcePath = new URL(message.location().url).pathname; } catch { /* No source location supplied. */ }
    const key = `${type}:${category}:${sourcePath}`; consoleCategories[key] = (consoleCategories[key] ?? 0) + 1;
  });
  const networkErrors: string[] = [];
  const forwardingFailures: Array<{ method: string; path: string; reason: string }> = [];
  page.on('requestfailed', request => networkErrors.push(`${new URL(request.url()).hostname}: ${request.failure()?.errorText}`));
  page.on('pageerror', error => consoleErrors.push(error.message));
  await forwardAppOrigin(page, forwardingFailures);
  try { await authenticateFirebaseCanary(page, undefined, '/app', { expectComposer: false }); } catch (error) { console.log('Authentication network failure summary:', networkErrors); throw error; }
  cleanupCookieHeader = (await page.context().cookies(browserOrigin)).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  await page.goto('/signal');
  await expect(page.getByTestId('signal-world-explorer')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Evidence & briefs', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'SIGNAL', exact: true })).toBeVisible({ timeout: 30000 });
  const createAction = page.getByRole('button', { name: 'Create desk', exact: true }).first();
  await expect(createAction).toBeEnabled({ timeout: 30000 });
  const primaryContrast = await createAction.evaluate(element => {
    const canvas = document.createElement('canvas'); const context = canvas.getContext('2d')!;
    const rgb = (color: string) => { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3); };
    const luminance = (values: number[]) => values.map(value => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
    const style = getComputedStyle(element); const foreground = luminance(rgb(style.color)); const background = luminance(rgb(style.backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(primaryContrast, 'Primary CTA text must be readable against its actual painted background').toBeGreaterThanOrEqual(4.5);
  await createAction.click();
  await page.getByLabel('Desk name', { exact: true }).fill(`${prefix} Brazil`);
  await page.getByLabel('Audience', { exact: true }).fill('Synthetic acceptance reviewer');
  await page.getByLabel('Decision question', { exact: true }).fill('Did the fictional minister adopt the proposal, or only open consultation?');
  await page.getByLabel('Find countries', { exact: true }).fill('Brazil');
  await page.getByLabel('Brazil', { exact: true }).check();
  await page.getByLabel('Desk languages', { exact: true }).fill('en, pt');
  let desk = await saved(page, () => page.getByRole('button', { name: 'Create desk', exact: true }).last().click());
  expect(desk.scope.countries).toEqual(['BR']);
  expect(desk.languages).toEqual(['en', 'pt']);
  expect(Boolean(firebaseIdToken), 'Capture the real signed-in browser token without persisting it').toBe(true);
  const directClientStatus = await page.evaluate(async ({ uid, deskId, token }) => {
    try {
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/praxisbytacitus/databases/(default)/documents/users/${encodeURIComponent(uid)}/signalDesks/${encodeURIComponent(deskId)}`, { headers: { Authorization: `Bearer ${token}` } });
      return response.status;
    } catch { return 0; }
  }, { uid: desk.ownerUid, deskId: desk.id, token: firebaseIdToken });
  expect(directClientStatus, 'Actual deployed rules forbid even the owner from bypassing SIGNAL server review').toBe(403);

  await page.getByRole('tab', { name: 'Coverage', exact: true }).click();
  await page.getByLabel('Source title', { exact: true }).fill('Synthetic original minister statement');
  await page.getByLabel('Original source URL', { exact: true }).fill(fixtureUrl);
  await page.getByLabel('Original source text', { exact: true }).fill(sourceText);
  await page.getByLabel('Capture rights basis', { exact: true }).fill('Own synthetic acceptance fixture; redistribution permitted');
  await page.getByLabel('This text may be redistributed in exports', { exact: true }).check();
  await page.getByLabel('This is a synthetic demonstration source', { exact: true }).check();
  desk = await saved(page, () => page.getByRole('button', { name: 'Capture source revision', exact: true }).click());
  expect(desk.sources[0].synthetic).toBe(true);
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await page.getByLabel('Attributed proposition', { exact: true }).fill('The minister explicitly denied adopting the proposal.');
  await page.getByLabel('Exact original quotation', { exact: true }).fill(quote);
  await page.getByLabel('Speaker / attributed actor', { exact: true }).fill('Fictional minister');
  await page.getByLabel('Polarity (affirmed, denied, qualified)', { exact: true }).selectOption('negative');
  await page.getByLabel('Modality (proposed, conditional, asserted)', { exact: true }).selectOption('denied');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save proposal for review', exact: true }).click());
  expect(desk.claims[0].quote).toBe(quote);
  expect(desk.claims[0].polarity).toBe('negative');
  await expect(page.locator('mark')).toHaveText(quote);
  await page.getByLabel('Review rationale', { exact: true }).fill('Exact denial is supported; consultation is not adoption. This remains a source reading, not independently verified event truth.');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save review receipt', exact: true }).click());
  expect(desk.claims[0].status).toBe('accepted');
  await page.getByRole('tab', { name: 'Context', exact: true }).click();
  desk = await saved(page, () => page.getByRole('button', { name: 'Build or attach context capsule', exact: true }).click());
  expect(desk.capsuleId).toMatch(/^signal-/);
  const inspectContext = page.getByRole('link', { name: 'Inspect attached context capsule', exact: true });
  const capsuleInspectorHref = `/app/capsules?starter=${encodeURIComponent(desk.capsuleId!)}&lane=inspect`;
  await expect(inspectContext).toHaveAttribute('href', capsuleInspectorHref);
  await inspectContext.click();
  await expect(page).toHaveURL(`${browserOrigin}${capsuleInspectorHref}`);
  const inspector = page.getByTestId('capsule-inspection-experience');
  await expect(inspector.getByRole('heading', { level: 2, name: desk.name, exact: true })).toBeVisible({ timeout: 30000 });
  await inspector.getByText('Technical capsule contract', { exact: true }).click();
  await expect(inspector.locator('pre').filter({ hasText: desk.capsuleId! })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'SIGNAL', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('heading', { level: 2, name: desk.name, exact: true })).toBeVisible();
  // Context changes reopen the old proposal; pin a renewed exact source reading to the new context.
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await page.getByLabel('Attributed proposition', { exact: true }).fill('The minister explicitly denied adopting the proposal.');
  await page.getByLabel('Exact original quotation', { exact: true }).fill(quote);
  await page.getByLabel('Speaker / attributed actor', { exact: true }).fill('Fictional minister');
  await page.getByLabel('Polarity (affirmed, denied, qualified)', { exact: true }).selectOption('negative');
  await page.getByLabel('Modality (proposed, conditional, asserted)', { exact: true }).selectOption('denied');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save proposal for review', exact: true }).click());
  await page.getByLabel('Review rationale', { exact: true }).fill('Renewed reading against attached context preserves exact denial and qualification.');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save review receipt', exact: true }).click());
  await page.getByRole('tab', { name: 'Overview', exact: true }).click();
  await page.getByLabel('Assessment conclusion', { exact: true }).fill('The synthetic statement denies adoption and supports only a prospective consultation interpretation.');
  await page.getByLabel('Assessment change reason', { exact: true }).fill('Initial assessment based on the reviewed exact denial, without manufacturing adoption from consultation.');
  await page.getByLabel('Assessment uncertainty', { exact: true }).fill('Synthetic statement only; event truth and later policy action are not independently established.');
  await page.getByLabel('Assessment invalidators', { exact: true }).fill('A later dated statement explicitly confirming adoption.');
  await page.getByLabel('assessment alternatives', { exact: true }).fill('A separate unpublished policy decision could differ from the source wording.');
  await page.getByLabel('The minister explicitly denied adopting the proposal.', { exact: true }).check();
  desk = await saved(page, () => page.getByRole('button', { name: 'Propose assessment', exact: true }).click());
  await page.getByLabel('assessment review rationale', { exact: true }).fill('Exact denial and consultation distinction are supported within the synthetic source reading limits.');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save assessment review', exact: true }).click());
  expect(desk.assessments?.[0].status).toBe('accepted');
  await page.getByRole('tab', { name: 'Briefs', exact: true }).click();
  desk = await saved(page, () => page.getByRole('button', { name: 'Draft brief from reviewed evidence', exact: true }).click());
  expect(desk.briefs[0].text).toContain('denied');
  await page.getByLabel('Brief approval rationale', { exact: true }).fill('Approved synthetic test reading with denial preserved and source limits explicit.');
  desk = await saved(page, () => page.getByRole('button', { name: 'Approve exact brief and manifest', exact: true }).click());
  const pinned = structuredClone(desk.briefs[0]);
  expect(pinned.status).toBe('approved');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export pinned Markdown', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  const evidence = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence manifest', exact: true }).click();
  expect((await evidence).suggestedFilename()).toMatch(/\.json$/);
  await mkdir('output/signal', { recursive: true });
  await page.screenshot({ path: 'output/signal/approved-brief-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: /Approved brief/, exact: false })).toBeVisible();
  await page.screenshot({ path: 'output/signal/approved-brief-mobile.png', fullPage: true, animations: 'disabled' });
  const overflow = await page.evaluate(() => { const panel = document.querySelector('[role=tabpanel]'); const card = panel?.querySelector('section'); return document.documentElement.scrollWidth > window.innerWidth || Boolean(card && card.getBoundingClientRect().right > window.innerWidth + 1); });
  expect(overflow, 'Mobile page must not overflow horizontally').toBe(false);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Export pinned Markdown', exact: true })).toBeVisible({ timeout: 30000 });
  const persisted = await page.evaluate(async id => (await (await fetch(`/api/signal?deskId=${id}`)).json()).desk as SignalDesk, desk.id);
  expect(persisted.briefs[0].digest).toBe(pinned.digest);
  const conflict = await api(page, { action: 'watch', deskId: desk.id, expectedVersion: 1, watched: false });
  expect(conflict.status).toBe(409);
  const spoof = await api(page, { action: 'create', name: 'Forbidden owner injection', question: 'Who owns this?', audience: 'test', scope: { kind: 'country', countries: ['JP'], label: 'Japan' }, languages: ['en'], windowDays: 7, ownerUid: 'another-user' });
  expect(spoof.status).toBe(422);
  await page.getByRole('tab', { name: 'Coverage', exact: true }).click();
  await page.getByLabel('Source title', { exact: true }).fill('Synthetic corrected minister statement');
  await page.getByLabel('Original source URL', { exact: true }).fill(fixtureUrl);
  const correctionText = 'Correction: the minister has now adopted the proposal after consultation.';
  await page.getByLabel('Original source text', { exact: true }).fill(correctionText);
  await page.getByLabel('Capture rights basis', { exact: true }).fill('Own synthetic acceptance fixture; redistribution permitted');
  await page.getByLabel('This text may be redistributed in exports', { exact: true }).check();
  await page.getByLabel('This is a synthetic demonstration source', { exact: true }).check();
  desk = await saved(page, () => page.getByRole('button', { name: 'Capture source revision', exact: true }).click());
  expect(desk.sources).toHaveLength(2);
  expect(desk.claims[0].stale).toBe(true);
  expect(desk.briefs[0].stale).toBe(true);
  expect(desk.briefs[0].digest).toBe(pinned.digest);
  expect(desk.briefs[0].text).toBe(pinned.text);
  expect(desk.contextStale).toBe(true);
  await expect(page.getByRole('alert').filter({ hasText: 'Context is stale' })).toBeVisible();
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await page.getByLabel('Inspect source revision', { exact: true }).selectOption(desk.sources[1].id);
  await expect(page.getByRole('button', { name: 'Analyze original text', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save proposal for review', exact: true })).toBeDisabled();
  const beforeBlocked = structuredClone({ version: desk.version, usage: desk.usage, runs: desk.runs });
  const blockedAnalysis = await page.evaluate(async values => {
    const response = await fetch('/api/ai/signal', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    return { status: response.status, body: await response.json() };
  }, { deskId: desk.id, expectedVersion: desk.version, sourceRevisionId: desk.sources[1].id });
  expect(blockedAnalysis.status, 'Stale context rejects analysis before any analysis allowance or provider operation').toBe(409);
  const afterBlocked = await page.evaluate(async id => (await (await fetch(`/api/signal?deskId=${id}`)).json()).desk as SignalDesk, desk.id);
  expect({ version: afterBlocked.version, usage: afterBlocked.usage, runs: afterBlocked.runs }).toEqual(beforeBlocked);
  await page.getByRole('tab', { name: 'Overview', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Context is stale' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Propose assessment', exact: true })).toBeDisabled();
  await page.getByRole('tab', { name: 'Briefs', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Draft brief from reviewed evidence', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Edit as new draft', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export pinned Markdown', exact: true })).toBeEnabled();
  desk = await saved(page, () => page.getByRole('button', { name: 'Rebuild context', exact: true }).click());
  expect(desk.contextStale).toBe(false);
  await expect(page.getByRole('alert').filter({ hasText: 'Context is stale' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await page.getByLabel('Inspect source revision', { exact: true }).selectOption(desk.sources[1].id);
  await page.getByLabel('Attributed proposition', { exact: true }).fill('The corrected synthetic statement explicitly reports adoption after consultation.');
  await page.getByLabel('Exact original quotation', { exact: true }).fill(correctionText);
  await page.getByLabel('Speaker / attributed actor', { exact: true }).fill('Fictional minister');
  await page.getByLabel('Polarity (affirmed, denied, qualified)', { exact: true }).selectOption('affirmative');
  await page.getByLabel('Modality (proposed, conditional, asserted)', { exact: true }).selectOption('asserted');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save proposal for review', exact: true }).click());
  await page.getByLabel('Review rationale', { exact: true }).fill('Fresh exact correction is reviewed against the rebuilt context; the historical denial remains pinned separately.');
  desk = await saved(page, () => page.getByRole('button', { name: 'Save review receipt', exact: true }).click());
  expect(desk.claims.at(-1)?.status).toBe('accepted');
  expect(desk.contextStale).toBe(false);
  expect(desk.briefs[0].digest).toBe(pinned.digest);
  expect(desk.briefs[0].text).toBe(pinned.text);
  for (const [name, kind, countries] of [['Japan', 'country', ['JP']], ['Brazil Sudan theatre', 'theatre', ['BR', 'SD']]] as const) {
    const result = await api(page, { action: 'create', name: `${prefix} ${name}`, question: 'What has changed in this explicitly synthetic test mandate?', audience: 'Synthetic acceptance reviewer', scope: { kind, countries, label: name }, languages: ['en'], windowDays: 7 });
    expect(result.status).toBe(201);
    created.push({ uid: result.body.desk.ownerUid, id: result.body.desk.id });
    await page.goto(`/signal?desk=${result.body.desk.id}&view=Overview`);
    await expect(page.getByRole('heading', { level: 2, name: `${prefix} ${name}`, exact: true })).toBeVisible({ timeout: 30000 });
    await page.reload();
    await expect(page.getByRole('heading', { level: 2, name: `${prefix} ${name}`, exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Discovery mode: no sources captured/)).toBeVisible();
  }
  await page.goto(`/signal?desk=${desk.id}&revision=1&view=Evidence`);
  await expect(page.getByRole('status').filter({ hasText: 'This link points to an earlier desk revision' })).toBeVisible({ timeout: 30000 });
  const consoleSummary = JSON.stringify({ consoleCounts, consoleCategories, primaryCtaContrast: primaryContrast, runtimeExceptionCount: consoleErrors.length, networkFailureHosts: networkErrors, forwardingFailures }, null, 2);
  await writeFile('output/signal/browser-console-summary.json', consoleSummary);
  await test.info().attach('browser-console-summary', { body: consoleSummary, contentType: 'application/json' });
  expect(consoleErrors, 'No browser runtime exceptions').toEqual([]);
});
