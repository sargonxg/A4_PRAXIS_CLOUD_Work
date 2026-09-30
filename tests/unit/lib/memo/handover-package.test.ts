import { describe, expect, it } from 'vitest';
import { createHandoverPlan, assertHandoverPreview, buildHandoverIntegrityManifest,
  verifyHandoverIntegrity, sha256, type HandoverInput } from '@/lib/memo/handover-package';
import { memoOutputBodyHash } from '@/lib/memo/output-review';

function input(patch: Partial<HandoverInput> = {}): HandoverInput {
  return { ownerUid: 'owner', memoId: 'memo-1', memoVersionId: 'v1', title: 'Policy handover',
    body: 'A reviewed statement.\r\nA caveat.', capsuleId: 'cap-1', capsuleVersion: 2,
    capsule: { ownerUid: 'owner', capsuleId: 'cap-1', version: 2, schemaVersion: 3,
      label: 'Context', purpose: 'Review a decision', summary: 'One bounded situation.',
      privateNotes: 'DO_NOT_EXPORT_PRIVATE', coreRefs: { documentCoreIds: ['doc-owner-only'] },
      sourceRefs: [{ id: 'source-1', title: 'Public record', url: 'https://example.test/report?tracking=1#part',
        excerpt: 'DO_NOT_EXPORT_SOURCE_TEXT', token: 'DO_NOT_EXPORT_TOKEN' }],
      claimLedger: [{ id: 'claim-1', text: 'A recorded claim.', status: 'disputed', sourceReceiptIds: ['missing-receipt'] }],
      v3: { humanTacitKnowledge: { hiddenConstraints: ['DO_NOT_EXPORT_TACIT'] },
        reasoningScaffold: { publicMethod: ['Compare claims with originals.'], privateNotes: ['DO_NOT_EXPORT_REASONING'] },
        agentOperatingContract: { forbiddenActions: ['Publish without review.'], allowedActions: ['ACT_AUTHORITY_SECRET'], stopConditions: ['Insufficient evidence.'] } } },
    sourceReceipts: [{ id: 'receipt-1', title: 'Receipt', publisher: 'Publisher', originalPassageStatus: 'retrieved',
      originalPassage: { text: 'DO_NOT_EXPORT_PASSAGE' }, apiKey: 'DO_NOT_EXPORT_KEY' }],
    sourceReceiptIds: ['receipt-1', 'absent-receipt'], verifiedApproval: null, ...patch };
}

describe('experimental handover projection', () => {
  it('preserves an exact pinned version with meaningful unresolved dependencies and no raw private payloads', () => {
    const plan = createHandoverPlan(input());
    const exported = JSON.stringify(plan);
    expect(plan.preview.capsule).toMatchObject({ requestedVersion: 2, resolvedVersion: 2, status: 'pinned' });
    expect(plan.capsuleSnapshot).toMatchObject({ purpose: 'Review a decision', permissionTransfer: false, reviewRequiredOnImport: true });
    expect(plan.preview.unresolvedDependencies.map((item) => item.id)).toEqual(expect.arrayContaining(['doc-owner-only', 'missing-receipt', 'absent-receipt']));
    expect(exported).not.toContain('DO_NOT_EXPORT');
    expect(exported).not.toContain('ACT_AUTHORITY_SECRET');
    expect(exported).not.toContain('ownerUid');
    expect(plan.sources[0]).toMatchObject({ originalPassageIncluded: false, claimSupportVerified: false });
    expect((plan.capsuleSnapshot.sources as Array<{ url: string }>)[0].url).toBe('https://example.test/report');
  });

  it.each(['newer', 'missing', 'foreign', 'wrong-id', 'unversioned'])('fails closed for %s capsule context', (caseName) => {
    const fixture = input();
    if (caseName === 'missing') fixture.capsule = null;
    else if (caseName === 'unversioned') fixture.capsuleVersion = null;
    else fixture.capsule = { ...(fixture.capsule as object),
      ...(caseName === 'newer' ? { version: 3 } : caseName === 'foreign' ? { ownerUid: 'other' } : { capsuleId: 'other' }) };
    expect(() => createHandoverPlan(fixture)).toThrow(/exact owner-scoped capsule version/);
  });

  it('matches existing normalized-body review hashes and labels unreviewed/final-status work as draft', async () => {
    const fixture = input();
    const draft = createHandoverPlan(fixture);
    expect(draft.preview.bodyHash).toBe(await memoOutputBodyHash(fixture.body));
    expect(draft.preview.mode).toBe('draft');
    expect(draft.markdown).toContain('DRAFT — human review required');
    expect(draft.preview.review.intendedUse).toBeNull();
  });

  it('records review only for the exact body/version and reviewer, and preserves the intended-use limitation', () => {
    const fixture = input();
    fixture.verifiedApproval = { version: 1, memoId: 'memo-1', versionId: 'v1', reviewerUid: 'owner',
      bodyHash: sha256(fixture.body.replace(/\r\n/g, '\n').trim()), approvedAt: '2026-09-30T12:00:00.000Z',
      intendedUse: 'internal-analysis', limitations: 'Not suitable for external sharing.', attestation: 'server-verified' };
    const reviewed = createHandoverPlan(fixture);
    expect(reviewed.preview.mode).toBe('human-reviewed');
    expect(reviewed.markdown).toContain('Not suitable for external sharing.');
    expect(reviewed.markdown).not.toContain('Human review for: publication');
    expect(JSON.stringify(reviewed)).not.toContain('server-verified');
    expect(createHandoverPlan({ ...fixture, body: 'Changed body' }).preview.mode).toBe('draft');
    expect(createHandoverPlan({ ...fixture, memoVersionId: 'v2' }).preview.mode).toBe('draft');
    expect(createHandoverPlan({ ...fixture, verifiedApproval: { ...fixture.verifiedApproval, reviewerUid: 'other' } }).preview.mode).toBe('draft');
  });

  it('binds confirmation to exported sources and context, not just the body', () => {
    const first = createHandoverPlan(input());
    expect(createHandoverPlan(input()).preview.previewHash).toBe(first.preview.previewHash);
    assertHandoverPreview(first, first.preview.previewHash);
    const changed = createHandoverPlan(input({ sourceReceipts: [{ id: 'receipt-1', publisher: 'Different publisher' }] }));
    expect(() => assertHandoverPreview(changed, first.preview.previewHash)).toThrow(/changed/);
  });

  it('omits private receipts and credential-bearing or executable links; row limits are disclosed', () => {
    const plan = createHandoverPlan(input({ sourceReceipts: [
      { id: 'private', private: true, title: 'DO_NOT_EXPORT_PRIVATE' },
      { id: 'credential', url: 'https://example.test/file?X-Goog-Signature=secret' },
      { id: 'js', url: 'javascript:alert(1)' },
      ...Array.from({ length: 100 }, (_, index) => ({ id: `extra-${index}` })),
    ] }));
    expect(plan.sources).toHaveLength(99);
    expect(plan.sources.slice(0, 2).every((source) => source.url === null)).toBe(true);
    expect(plan.preview.omitted.join(' ')).toContain('3 additional rows');
    expect(plan.preview.omitted.join(' ')).toContain('marked private');
  });

  it('supports a truthful no-capsule handover without inventing reviewed context', () => {
    const plan = createHandoverPlan(input({ capsuleId: null, capsuleVersion: null, capsule: null }));
    expect(plan.preview.capsule.status).toBe('none');
    expect(plan.capsuleSnapshot.status).toBe('no-capsule');
    expect(plan.readme).toContain('not an RO-Crate conformance claim');
  });
});

describe('handover file integrity', () => {
  const preview = createHandoverPlan(input()).preview;
  const files = Object.fromEntries(preview.files.filter((name) => name !== 'integrity-manifest.json').map((name) => [name, `Payload: ${name}`]));
  const manifest = buildHandoverIntegrityManifest(preview, files, '2026-09-30T12:00:00.000Z');

  it('hashes every payload and clearly separates integrity from signatures and truth', () => {
    expect(verifyHandoverIntegrity(manifest, files)).toEqual({ valid: true, issues: [] });
    expect(manifest.contentSignature).toBe(false);
    expect(manifest.analyticalVerification).toBe(false);
    expect(manifest.files).toHaveLength(preview.files.length - 1);
    expect(manifest.files.some((file) => file.path === 'integrity-manifest.json')).toBe(false);
  });
  it('detects changed, missing and unlisted files', () => {
    expect(verifyHandoverIntegrity(manifest, { ...files, 'memo.md': 'Altered bytes' }).valid).toBe(false);
    const missing = { ...files }; delete missing['source-receipts.json'];
    expect(verifyHandoverIntegrity(manifest, missing).valid).toBe(false);
    expect(verifyHandoverIntegrity(manifest, { ...files, 'unexpected.json': '{}' }).valid).toBe(false);
  });
  it('rejects duplicate/traversal manifest paths and refuses incomplete payload construction', () => {
    expect(verifyHandoverIntegrity({ ...manifest, files: [...manifest.files, manifest.files[0]] }, files).valid).toBe(false);
    expect(verifyHandoverIntegrity({ ...manifest, files: [{ path: '../secret', sizeBytes: 0, sha256: sha256('') }] }, {}).valid).toBe(false);
    expect(() => buildHandoverIntegrityManifest(preview, {}, manifest.createdAt)).toThrow(/do not match/);
  });
  it('rejects malformed or incomplete manifests even when every listed file matches', () => {
    expect(verifyHandoverIntegrity(null, {}).valid).toBe(false);
    expect(verifyHandoverIntegrity({ ...manifest, files: [] }, {}).valid).toBe(false);
    expect(verifyHandoverIntegrity({ ...manifest, files: manifest.files.slice(1) }, files).valid).toBe(false);
    expect(verifyHandoverIntegrity({ ...manifest, files: manifest.files.map((file) => ({ ...file, sizeBytes: -1 })) }, files).valid).toBe(false);
  });
});
