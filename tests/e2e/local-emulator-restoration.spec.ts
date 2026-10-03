import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import dossier from '../fixtures/example-advisory-dossier.json';

// Opt-in check of an existing disk snapshot. No new accounts, projects or memos.
// Run only AFTER an emulator export, stop and import; never call this interchange.
test('reopens exact saved work after emulator disk restoration', async ({ page }) => {
  test.skip(process.env.PRAXIS_LOCAL_EMULATORS !== 'true' || process.env.PRAXIS_LOCAL_RESTORE !== 'true', 'Requires an imported isolated emulator snapshot.');
  const output = 'output/followup/journey';
  const receipt = JSON.parse(readFileSync(`${output}/receipt.json`, 'utf8')) as {
    projectId: string; capsuleId: string; pinnedVersion: number; latestCapsuleVersion: number;
    workItemId: string; memoId: string; versionId: string; ownerUid: string; reviewActor: string; fixtureHash: string;
  };
  const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
  expect(receipt.fixtureHash).toBe(hash(readFileSync('tests/fixtures/example-advisory-dossier.json')));
  // Refuse a receipt that could request a non-synthetic account.
  expect(receipt.reviewActor).toMatch(/^synthetic-a-[a-f0-9-]+@example\.test$/);
  const projectPath = `/app/projects?${new URLSearchParams({ projectId: receipt.projectId })}`;
  await page.goto(`/login?${new URLSearchParams({ redirect: projectPath })}`);
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled();
  await page.getByLabel('Email', { exact: true }).fill(receipt.reviewActor);
  await page.getByLabel('Password', { exact: true }).fill('Synthetic-Local-Only-2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/app/projects', { timeout: 120000 });
  const session = await page.request.get('/api/auth/session');
  expect(session.status()).toBe(200);
  expect((await session.json()).user.id).toBe(receipt.ownerUid);
  await expect(page.getByLabel('Project title')).toHaveValue(dossier.scope.title);
  await expect(page.getByLabel('Research question')).toHaveValue(dossier.scope.question);
  await expect(page.getByText('Newer v2 exists. This project still uses v1.')).toBeVisible();
  const response = await page.request.get(`/api/projects/${receipt.projectId}`);
  expect(response.status()).toBe(200);
  const project = (await response.json()).project;
  expect(project.workItems).toHaveLength(1);
  expect(project.workItems[0].workItemId).toBe(receipt.workItemId);
  expect(project.workItems[0].context[0]).toMatchObject({ capsuleId: receipt.capsuleId, version: receipt.pinnedVersion });
  await page.goto(`/app?${new URLSearchParams({ panel: 'memo', memoId: receipt.memoId })}`);
  const editor = page.getByLabel('Memo artifact editor');
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue(/Analyst correction: July remains a proposed option, not an adopted effective date\./);
  const memoResponse = await page.request.get(`/api/memos/${receipt.memoId}`);
  expect(memoResponse.status()).toBe(200);
  const record = await memoResponse.json();
  expect(record.memo.currentVersionId).toBe(receipt.versionId);
  expect(record.versions).toHaveLength(2);
  const version = record.versions.find((entry: { id: string }) => entry.id === receipt.versionId);
  expect(version.contextSnapshot).toMatchObject({ capsuleId: receipt.capsuleId, capsuleVersion: receipt.pinnedVersion });
  for (const source of dossier.sources) {
    expect(version.contextSnapshot.sourceReceipts).toContainEqual(expect.objectContaining({
      sourceReceiptId: source.id, sourceVersion: source.version, contentHash: hash(source.text),
      passage: expect.objectContaining({ quote: source.text, charStart: 0, charEnd: source.text.length }),
    }));
  }
  const exportHashes: Record<string, string> = {};
  for (const format of ['md', 'docx']) {
    const exported = await page.request.get(`/api/memos/${receipt.memoId}/export?${new URLSearchParams({ versionId: receipt.versionId, format })}`);
    expect(exported.status()).toBe(200); // Includes revalidation of exact-version human approval.
    const bytes = await exported.body();
    const text = format === 'md' ? bytes.toString('utf8') : await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(text).toContain('Funding remains undecided.');
    expect(text).toContain('The pilot is optional and subject to funding.');
    expect(text).toContain('Analyst correction: July remains a proposed option, not an adopted effective date.');
    for (const source of dossier.sources) { expect(text).toContain(source.text); expect(text).toContain(hash(source.text)); }
    if (format === 'md') expect(text).toBe(readFileSync(`${output}/synthetic-reviewed.md`, 'utf8'));
    exportHashes[format] = hash(bytes);
    writeFileSync(`${output}/restored-reviewed.${format}`, bytes);
  }
  await page.screenshot({ path: `${output}/restored-memo.png` });
  writeFileSync(`${output}/restoration-receipt.json`, JSON.stringify({ evidenceDate: new Date().toISOString(),
    environment: 'demo-praxis-local; exported emulators stopped and imported before this test',
    projectId: receipt.projectId, capsuleId: receipt.capsuleId, memoId: receipt.memoId, versionId: receipt.versionId,
    priorReceiptHash: hash(readFileSync(`${output}/receipt.json`)), fixtureHash: receipt.fixtureHash,
    result: 'same persisted records and exact Markdown restored', exportHashes,
    modelExecution: 'not run', portability: 'not tested; operational emulator snapshot restoration only',
  }, null, 2));
});
