import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import JSZip from 'jszip';
import dossier from '../fixtures/example-advisory-dossier.json';

// Genuine Auth/Firestore acceptance. No route mocks, local-storage auth or forged cookies.
test.skip(process.env.PRAXIS_LOCAL_EMULATORS !== 'true', 'Requires isolated demo-praxis-local emulators.');
const base = 'http://127.0.0.1:3020';
const authBase = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const syntheticPassword = 'Synthetic-Local-Only-2026!';
const output = 'output/followup/journey';
async function signIn(page: Page, email: string, target = '/app/projects') {
  await page.goto(`/login?${new URLSearchParams({ redirect: target })}`);
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(syntheticPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/onboarding' || url.pathname.startsWith('/app'), { timeout: 120000 });
  const session = await page.request.get('/api/auth/session');
  expect(session.status()).toBe(200); expect((await session.json()).user.email).toBe(email);
  const skip = await page.request.post('/api/onboarding/skip'); expect(skip.status()).toBe(200);
  await page.goto(target);
}
test('real local login, capsule/project save, correction, export, refresh, relogin and isolation', async ({ page, request }) => {
  mkdirSync(output, { recursive: true });
  const requestsWithContextInUrl: string[] = [];
  page.on('request', (req) => { if (req.url().includes('capsulePrompt=') || req.url().includes('prompt=') || req.url().includes(encodeURIComponent(dossier.scope.question))) requestsWithContextInUrl.push(req.url()); });
  const emailA = `synthetic-a-${randomUUID()}@example.test`;
  const emailB = `synthetic-b-${randomUUID()}@example.test`;
  const a = await request.post(`${authBase}/accounts:signUp?key=local-synthetic-api-key`, { data: { email: emailA, password: syntheticPassword, returnSecureToken: true } });
  const b = await request.post(`${authBase}/accounts:signUp?key=local-synthetic-api-key`, { data: { email: emailB, password: syntheticPassword, returnSecureToken: true } });
  expect(a.status()).toBe(200); expect(b.status()).toBe(200);
  const accountA = await a.json(); const accountB = await b.json();
  expect((await request.get(`${base}/api/projects`)).status()).toBe(401);
  expect((await request.post(`${base}/api/auth/session`, { headers: { origin: 'https://outsider.example' }, data: { token: accountA.idToken } })).status()).toBe(403);
  expect((await request.post(`${base}/api/auth/session`, { data: { token: 'invalid-local-token' } })).status()).toBe(401);

  await signIn(page, emailA);
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project title').fill(dossier.scope.title);
  await page.getByLabel('Research question').fill(dossier.scope.question);
  await page.getByLabel('Intended use', { exact: true }).fill(dossier.scope.purpose);
  await page.getByLabel('Audience', { exact: true }).fill(dossier.scope.audience);
  await page.getByLabel('Jurisdiction / scope').fill(dossier.scope.jurisdiction);
  await page.getByLabel('Analytical cutoff').fill(dossier.scope.asOfDate);
  await page.getByLabel('Organization mandate').fill(dossier.scope.mandate);
  await page.getByLabel('Approved working conventions').fill(dossier.scope.conventions);
  const createdResponse = page.waitForResponse((res) => res.url() === `${base}/api/projects` && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Create private project', exact: true }).click();
  const created = await (await createdResponse).json(); expect(created.persisted).toBe(true);
  const projectId = created.project.projectId;
  const projectPath = `/app/projects?projectId=${projectId}`;
  await expect(page.getByRole('button', { name: 'Save scope', exact: true })).toBeVisible();
  await page.goto('/app/capsules/builder');
  const purpose = 'Synthetic Example Advisory dossier: preserve undecided funding, optional pilot and proposed dates; no adoption.';
  await page.getByLabel('What should this capsule do?').fill(purpose);
  const capsuleResponse = page.waitForResponse((res) => res.url() === `${base}/api/context/capsules` && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const capsuleResult = await (await capsuleResponse).json();
  expect(capsuleResult.capsule.ownerUid).toBe(accountA.localId);
  const capsuleId = capsuleResult.capsule.capsuleId;
  await page.reload(); await expect(page.getByLabel('What should this capsule do?')).toHaveValue(purpose);
  await page.getByLabel('What should this capsule do?').fill(`${purpose} Audience: research director.`);
  const editResponse = page.waitForResponse((res) => res.url() === `${base}/api/context/capsules` && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  expect((await (await editResponse).json()).capsule.version).toBe(2);
  await page.goto(projectPath);
  await page.getByLabel('Saved capsule ID').fill(capsuleId);
  await page.getByLabel('Exact capsule version').fill('1');
  await page.getByRole('button', { name: 'Attach selected revision', exact: true }).click();
  await expect(page.getByText('Newer v2 exists. This project still uses v1.')).toBeVisible();
  await page.getByLabel('Work item title').fill('Synthetic policy brief assignment');
  await page.getByLabel('Bounded instruction').fill(dossier.scope.question);
  const workResponse = page.waitForResponse((res) => res.url().endsWith(`/api/projects/${projectId}`) && res.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save draft work item', exact: true }).click();
  const workResult = await (await workResponse).json(); expect(workResult.project.workItems).toHaveLength(1);
  const effectiveWork = workResult.project.workItems[0]; expect(effectiveWork.context[0].version).toBe(1);
  const replayWork = await page.request.patch(`/api/projects/${projectId}`, { data: (await workResponse).request().postDataJSON() });
  expect(replayWork.status()).toBe(200); expect((await replayWork.json()).project.workItems).toHaveLength(1);
  await page.reload(); await expect(page.getByText('Synthetic policy brief assignment · draft · brief')).toBeVisible();
  await expect(page.getByRole('button', { name: dossier.scope.title, exact: true })).toBeVisible();
  await page.screenshot({ path: `${output}/project-desktop.png`, fullPage: true });
  await page.getByLabel('Project title').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Research question')).toBeFocused();
  for (const [name, width, height] of [['mobile', 375, 812], ['tablet', 768, 1024]] as const) {
    await page.setViewportSize({ width, height });
    if (name === 'mobile') await expect.poll(async () => page.locator('[data-testid="praxis-one-page-app-shell"] > div[inert]').evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
    await expect(page.getByLabel('Project title')).toHaveValue(dossier.scope.title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `${output}/project-${name}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${output}/project-text-200.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

  // Supplied controlled artifact, explicitly not a model/extraction result.
  const body = '# Synthetic briefing\n\nFunding remains undecided. [EA-D1]\nThe pilot is optional and subject to funding. [EA-D1, EA-D15]\nJuly is considered in consultation; no start date has been adopted. [EA-D15]\nThe Example Industry Association requests a transition period. [EA-D8]\nOriginal language: O piloto poderá ser realizado, sujeito a financiamento. [EA-D15]';
  const memoInput = { caseId: projectId, templateId: 'policy-memo', title: dossier.title, graphSnapshotId: `capsule:${capsuleId}:v1`, expectedVersionId: null, operationId: randomUUID(),
    capsuleId, capsuleVersion: 1, sourceReceiptIds: dossier.sources.map((s) => s.id),
    sourceReceipts: dossier.sources.map((s) => ({ sourceReceiptId: s.id, sourceVersion: s.version, language: s.language, rights: s.rights, publishedDate: s.publicationDate, contentHash: createHash('sha256').update(s.text).digest('hex'), passage: { quote: s.text, charStart: 0, charEnd: s.text.length, paragraphRef: s.id } })),
    blocks: [{ id: 'memo-body', type: 'paragraph', content: body, citations: [{ nodeIds: [], sourceReceiptIds: dossier.sources.map((s) => s.id), surface: 'footnote' }], metadata: { fixtureVersion: dossier.schemaVersion, execution: 'supplied-controlled-text' } }] };
  const saves = await Promise.all([page.request.post('/api/memos', { data: memoInput }), page.request.post('/api/memos', { data: memoInput })]);
  for (const save of saves) expect(save.status()).toBe(200);
  const memo = await saves[0].json(); expect(memo.versions).toHaveLength(1); const memoId = memo.memo.id;
  await page.goto(`/app?panel=memo&memoId=${memoId}`);
  await expect(page.getByLabel('Memo artifact editor')).toHaveValue(body);
  const corrected = `${body}\n\nAnalyst correction: July remains a proposed option, not an adopted effective date.`;
  await page.getByLabel('Memo artifact editor').fill(corrected);
  const correctedResponse = page.waitForResponse((res) => res.url() === `${base}/api/memos` && res.request().method() === 'POST');
  await page.getByTestId('memo-artifact-overlay').getByRole('button', { name: 'Save draft', exact: true }).click();
  const correctedRecord = await (await correctedResponse).json(); expect(correctedRecord.versions).toHaveLength(2);
  const stale = await page.request.post('/api/memos', { data: { ...memoInput, expectedVersionId: memo.memo.currentVersionId, operationId: randomUUID() } }); expect(stale.status()).toBe(409);
  await page.reload(); await expect(page.getByLabel('Memo artifact editor')).toHaveValue(corrected);
  await page.screenshot({ path: `${output}/corrected-memo.png` });
  const stored = await page.request.get(`/api/memos/${memoId}`); expect(stored.status()).toBe(200);
  const storedRecord = await stored.json(); expect(JSON.stringify(storedRecord)).toContain('Funding remains undecided.'); expect(JSON.stringify(storedRecord)).toContain('sujeito a financiamento');
  // Actual review API uses the authenticated synthetic analyst's identity and exact saved hash.
  await page.getByLabel('Limitations and caveats').fill('Synthetic fixture; controlled text supplied by test, not model evaluation.');
  await page.getByLabel('I reviewed the original sources and their relevance.').check();
  await page.getByLabel('I reviewed the assumptions and unsupported claims.').check();
  await page.getByLabel('I reviewed the limitations for the selected intended use.').check();
  const reviewResponse = page.waitForResponse((res) => res.url().endsWith(`/api/memos/${memoId}/review`) && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Approve saved version', exact: true }).click();
  const reviewed = await reviewResponse;
  expect(reviewed.status()).toBe(200);
  const versionId = correctedRecord.memo.currentVersionId;
  for (const format of ['md', 'docx']) {
    const exported = await page.request.get(`/api/memos/${memoId}/export?${new URLSearchParams({ versionId, format })}`); expect(exported.status()).toBe(200);
    const bytes = await exported.body(); writeFileSync(`${output}/synthetic-reviewed.${format}`, bytes);
    const text = format === 'md' ? bytes.toString('utf8') : await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(text).toContain('Funding remains undecided.'); expect(text).toContain('sujeito a financiamento'); expect(text).toContain(versionId);
    expect(text).toContain('Evidence appendix');
    for (const source of dossier.sources) {
      expect(text).toContain(source.text);
      expect(text).toContain(createHash('sha256').update(source.text).digest('hex'));
      expect(text).toContain(`characters 0–${source.text.length}`);
    }
  }
  await page.goto(projectPath); await page.getByRole('button', { name: 'Sign out', exact: true }).first().click();
  await signIn(page, emailA, projectPath);
  await expect(page.getByLabel('Project title')).toHaveValue(dossier.scope.title);
  await expect(page.getByText('Synthetic policy brief assignment · draft · brief')).toBeVisible();
  await page.goto(`/app?panel=memo&memoId=${memoId}`); await expect(page.getByLabel('Memo artifact editor')).toHaveValue(corrected);
  await page.goto(projectPath); await page.getByRole('button', { name: 'Sign out', exact: true }).first().click();
  await signIn(page, emailB);
  expect((await page.request.get(`/api/projects/${projectId}`)).status()).toBe(404);
  expect((await page.request.get(`/api/context/capsules/${capsuleId}`)).status()).toBe(404);
  expect((await page.request.get(`/api/memos/${memoId}`)).status()).toBe(404);
  // Retry only ECONNRESET on this idempotent read through a local dev restart.
  // HTTP responses, including an unauthorized 200, are never retried or hidden.
  expect((await page.request.get(`/api/memos/${memoId}/export?${new URLSearchParams({ versionId, format: 'docx' })}`, { maxRetries: 3 })).status()).toBe(404);
  expect(JSON.stringify(await (await page.request.get('/api/projects')).json())).not.toContain(dossier.scope.title);
  const denied = await request.get(`http://127.0.0.1:8080/v1/projects/demo-praxis-local/databases/(default)/documents/users/${accountA.localId}`, { headers: { authorization: `Bearer ${accountB.idToken}` } }); expect(denied.status()).toBe(403);
  const adminApp = initializeApp({ projectId: 'demo-praxis-local' }, `local-proof-${randomUUID()}`);
  await getAuth(adminApp).updateUser(accountB.localId, { disabled: true });
  expect((await page.request.get('/api/projects')).status()).toBe(401);
  expect((await page.request.post('/api/ai/chat', { data: { messages: [] } })).status()).toBe(503);
  expect(requestsWithContextInUrl).toEqual([]);
  writeFileSync(`${output}/receipt.json`, JSON.stringify({ evidenceDate: new Date().toISOString(), fixtureHash: createHash('sha256').update(readFileSync('tests/fixtures/example-advisory-dossier.json')).digest('hex'), environment: 'Auth + Firestore emulators, demo-praxis-local', projectId, capsuleId, pinnedVersion: 1, latestCapsuleVersion: 2, workItemId: effectiveWork.workItemId, memoId, versionId, ownerUid: accountA.localId, reviewActor: emailA, modelExecution: 'not run', sourceExtraction: 'not run; purpose-only capsule', projectDispatch: 'not connected', auth: 'real Firebase SDK login and signed session endpoint', artifacts: 'supplied controlled synthetic text; corrected via UI', export: 'actual Markdown and DOCX; byte/XML validation, visual document QA pending' }, null, 2));
});

test('public question survives cancelled login and browser history without URL text', async ({ page }) => {
  const question = 'Synthetic cancelled-login question: funding remains undecided.';
  const urls: string[] = [];
  page.on('request', (req) => urls.push(req.url()));
  await page.goto('/');
  const input = page.getByLabel('Ask PRAXIS', { exact: true }).first();
  await input.fill(question);
  await input.press('Enter');
  await page.waitForURL((url) => url.pathname === '/login');
  expect(decodeURIComponent(page.url())).not.toContain(question);
  await page.goBack();
  await expect(page.getByLabel('Ask PRAXIS', { exact: true }).first()).toHaveValue(question);
  await page.reload();
  await expect(page.getByLabel('Ask PRAXIS', { exact: true }).first()).toHaveValue(question);
  await page.goForward();
  expect(urls.some((url) => decodeURIComponent(url).includes(question))).toBe(false);
});
