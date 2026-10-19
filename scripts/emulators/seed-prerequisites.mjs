import assert from 'node:assert/strict';
import { resolveServerEmulators } from '../../src/lib/firebase/emulator-config.ts';
import { authenticateFirebaseCanary, expectAuthenticatedSession } from '../../tests/e2e/helpers/auth.ts';

export const goldenDraft = {
  action: 'save-builder-draft', capsuleId: 'golden-path-capsule',
  purpose: 'SYNTHETIC UNREVIEWED emulator-only treaty analysis fixture',
  systemFrame: 'Fictional local test material. Not verified evidence or accepted knowledge. Human review required.',
  domain: 'generic', frameworks: [], outputFormat: 'brief', propertyOrdering: [], documentIds: [],
};
export const goldenSourceNote = {
  id: 'treaty-source-1', type: 'source_note',
  title: 'SYNTHETIC UNREVIEWED emulator-only treaty source note',
  body: 'Fictional test-only source marker for treaty analysis. No actual treaty, verified receipt, canonical Source Core, or reviewed claim is represented. Original golden answer citations remain mocked.',
  tags: ['synthetic', 'unreviewed', 'emulator-only'], starred: false, pinned: false,
  links: { sourceIds: [], documentIds: [] },
};

/** Real authenticated API setup only, after the unchanged first-login suite. */
export async function seedGoldenPrerequisites(chromium, expectedUid) {
  assert.ok(resolveServerEmulators(process.env), 'Isolated emulator configuration is required');
  assert.equal(process.env.PLAYWRIGHT_BASE_URL, 'http://127.0.0.1:3000');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ proxy: { server: 'http://127.0.0.1:3139', bypass: '127.0.0.1,localhost' }, serviceWorkers: 'block' });
    await authenticateFirebaseCanary(page, process.env.PLAYWRIGHT_BASE_URL, '/app', { expectComposer: false });
    await expectAuthenticatedSession(page);
    const result = await page.evaluate(async ({ draft, note }) => {
      async function request(path, method = 'GET', payload) {
        const response = await fetch(path, { method, credentials: 'include',
          ...(payload ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) } : {}) });
        if (!response.ok) throw new Error(`Synthetic prerequisite API failed: ${method} ${path} ${response.status}`);
        return { status: response.status, payload: await response.json() };
      }
      const created = await request('/api/context/capsules', 'POST', draft);
      const written = await request(`/api/context/capsules/${draft.capsuleId}/notes`, 'POST', note);
      const capsule = await request(`/api/context/capsules/${draft.capsuleId}`);
      const notes = await request(`/api/context/capsules/${draft.capsuleId}/notes`);
      return { createStatus: created.status, noteStatus: written.status, capsule: capsule.payload.capsule,
        note: notes.payload.notes.find(item => item.id === note.id) };
    }, { draft: goldenDraft, note: goldenSourceNote });
    assert.equal(result.createStatus, 201);
    assert.equal(result.noteStatus, 201);
    assert.equal(result.capsule.capsuleId, goldenDraft.capsuleId);
    assert.equal(result.capsule.ownerUid, expectedUid);
    assert.equal(result.capsule.latestGateState, 'draft');
    assert.equal(result.capsule.readinessSummary.reviewRequired, true);
    assert.equal(result.capsule.access.visibility, 'private');
    assert.deepEqual(result.capsule.coreRefs.sourceCoreIds, []);
    assert.deepEqual(result.capsule.coreRefs.documentCoreIds, []);
    assert.equal(result.capsule.provenance.source, 'api');
    assert.equal(result.capsule.provenance.createdBy, expectedUid);
    assert.equal(result.note?.id, goldenSourceNote.id);
    assert.equal(result.note.ownerUid, expectedUid);
    assert.equal(result.note.createdBy, expectedUid);
    assert.equal(result.note.capsuleId, goldenDraft.capsuleId);
    assert.equal(result.note.type, 'source_note');
    assert.equal(result.note.body, goldenSourceNote.body);
    assert.deepEqual(result.note.tags, goldenSourceNote.tags);
    assert.deepEqual(result.note.links.sourceIds, []);
    assert.deepEqual(result.note.links.documentIds, []);
    return { capsuleId: goldenDraft.capsuleId, sourceNoteId: goldenSourceNote.id, ownerVerified: true,
      persistedGetVerified: true, privateDraft: true, humanReviewRequired: true, canonicalSourceAttachment: false,
      limitations: ['Manual fictional source note only. Golden answer citations, provider, export and boardroom paths remain mocked.'] };
  } finally { await browser.close(); }
}
