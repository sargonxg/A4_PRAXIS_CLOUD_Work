import { beforeEach, describe, expect, it, vi } from 'vitest';
import { memoOutputBodyHash } from '@/lib/memo/output-review';
import { signMemoHumanApproval } from '@/lib/memo/human-review-server';
import { recordMemoContextSnapshot } from '@/lib/memo/context-snapshot';
import JSZip from 'jszip';
import { createHash } from 'node:crypto';
import advisory from '../../fixtures/example-advisory-dossier.json';

const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/memo-service', () => ({ loadMemoById: mocks.load,
  primaryMemoBody: (blocks: Array<{ content: string }>) => blocks[0]?.content ?? '' }));
import { GET } from '@/app/api/memos/[id]/export/route';

const user = { uid: 'owner', name: 'Owner', email: 'owner@example.test', isDemo: false };
const context = { params: Promise.resolve({ id: 'memo-1' }) };
const invoke = (query = 'format=md&versionId=v1', principal = user) =>
  (GET as unknown as (req: Request, user: typeof principal, ctx: typeof context) => Promise<Response>)(
    new Request(`https://praxis.example.test/api/memos/memo-1/export?${query}`), principal, context);

describe('saved reviewed memo export', () => {
  beforeEach(async () => {
    const approval = signMemoHumanApproval({ memoId: 'memo-1', versionId: 'v1', reviewerUid: 'owner',
      bodyHash: await memoOutputBodyHash('Reviewed body'), approvedAt: '2026-09-30T12:00:00Z',
      intendedUse: 'internal-analysis', limitations: 'No field interviews.' });
    mocks.load.mockReset().mockResolvedValue({ memo: { id: 'memo-1', title: 'Policy memo', currentVersionId: 'v1', humanApproval: approval },
      versions: [{ id: 'v1', blocks: [{ content: 'Reviewed body' }] }] });
  });
  it('exports the saved body with precise internal-use scope and limitations', async () => {
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const text = await response.text();
    expect(text).toContain('Human review for: Internal analysis');
    expect(text).toContain('No field interviews.');
    expect(text).toContain('Reviewed body');
    expect(text).not.toContain('Human review for: Publication');
  });
  it.each(['forged', 'changed-body', 'wrong-reviewer', 'stale-version'])('blocks %s approval', async (caseName) => {
    const record = await mocks.load();
    if (caseName === 'forged') record.memo.humanApproval.attestation = 'client-written';
    if (caseName === 'changed-body') record.versions[0].blocks[0].content = 'New body';
    if (caseName === 'wrong-reviewer') record.memo.humanApproval = signMemoHumanApproval({ ...record.memo.humanApproval, reviewerUid: 'other' });
    if (caseName === 'stale-version') record.memo.currentVersionId = 'v2';
    expect((await invoke()).status).toBe(409);
  });
  it('requires an explicit saved version and rejects unsupported formats', async () => {
    expect((await invoke('format=md')).status).toBe(400);
    expect((await invoke('format=html&versionId=v1')).status).toBe(400);
  });
  it('does not export demo or missing records', async () => {
    expect((await invoke(undefined, { ...user, isDemo: true })).status).toBe(403);
    mocks.load.mockResolvedValue(null);
    expect((await invoke()).status).toBe(404);
  });
  it('produces a real Word package for the approved saved version', async () => {
    const response = await invoke('format=docx&versionId=v1');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('wordprocessingml');
    expect(Array.from(new Uint8Array(await response.arrayBuffer()).slice(0, 2))).toEqual([80, 75]);
  });
  it.each(['md', 'docx'])('exports exact saved source anchors and rights in %s without using mutable envelope receipts', async (format) => {
    const record = await mocks.load();
    const quote = advisory.sources[2].text;
    const contentHash = createHash('sha256').update(quote).digest('hex');
    record.versions[0].contextSnapshot = recordMemoContextSnapshot({ capsuleId: 'cap-1', capsuleVersion: 1,
      sourceReceiptIds: ['EA-D15', 'restricted', 'missing'], sourceReceipts: [
        { sourceReceiptId: 'EA-D15', sourceVersion: 2, contentHash, language: 'pt', publishedDate: '2026-01-15',
          rights: 'Synthetic fixture; redistributable', passage: { quote, charStart: 0, charEnd: quote.length, paragraphRef: 'original-1' } },
        { sourceReceiptId: 'restricted', rights: 'Synthetic fixture; redistributable', title: 'Reference-only example', url: 'https://example.test/report?id=42',
          passage: { quote: 'Reference-only source content must not be redistributed.', sectionRef: 'section-2' } },
      ] }, null, false);
    record.memo.sourceReceipts = [{ sourceReceiptId: 'EA-D15', sourceVersion: 99, passage: { quote: 'Newer mutable source says funding is secured.' } }];
    const response = await invoke(`format=${format}&versionId=v1`);
    expect(response.status).toBe(200);
    const bytes = await response.arrayBuffer();
    const text = format === 'md' ? Buffer.from(bytes).toString('utf8') : await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(text).toContain('Evidence appendix');
    expect(text).toContain(quote);
    expect(text).toContain(contentHash);
    expect(text).toContain('https://example.test/report?id=42');
    expect(text).toContain('Reference-only example');
    expect(text).toContain('section-2');
    expect(text).toContain(`characters 0–${quote.length}`);
    expect(text).toContain('no unique stored source receipt');
    expect(text).toContain('recipient needs separate authorized source access');
    expect(text).not.toContain('Reference-only source content must not be redistributed.');
    expect(text).not.toContain('funding is secured');
  });
  it.each(['javascript:alert(1)', 'data:text/plain,private', 'https://user:secret@example.test/report', 'https://example.test/report?token=secret', 'https://example.test/report#access_token=secret'])('withholds unsafe or credential-bearing locator %s', async (url) => {
    const record = await mocks.load();
    record.versions[0].contextSnapshot = recordMemoContextSnapshot({ sourceReceiptIds: ['source-1'],
      sourceReceipts: [{ sourceReceiptId: 'source-1', url }] }, null, false);
    const text = await (await invoke()).text();
    expect(text).not.toContain(url);
    expect(text).toContain('missing or redacted');
  });
  it.each(['quote', 'hash', 'offset', 'version'])('refuses a forged synthetic source %s even with the approved source ID and rights label', async (field) => {
    const record = await mocks.load();
    const source = advisory.sources[0];
    const receipt = { sourceReceiptId: source.id, sourceVersion: source.version,
      contentHash: createHash('sha256').update(source.text).digest('hex'), rights: source.rights,
      passage: { quote: source.text, charStart: 0, charEnd: source.text.length } };
    if (field === 'quote') receipt.passage.quote = 'A restricted private quotation must be withheld.';
    if (field === 'hash') receipt.contentHash = 'wrong-hash';
    if (field === 'offset') receipt.passage.charEnd -= 1;
    if (field === 'version') receipt.sourceVersion = 99;
    record.versions[0].contextSnapshot = recordMemoContextSnapshot({ sourceReceiptIds: [source.id], sourceReceipts: [receipt] }, null, false);
    const text = await (await invoke()).text();
    expect(text).not.toContain(receipt.passage.quote);
    expect(text).toContain('Reference only: source text omitted.');
  });
  it.each(['md', 'docx'])('withholds oversized locators explicitly in %s instead of silently truncating them', async (format) => {
    const record = await mocks.load();
    const url = `https://example.test/${'source'.repeat(190)}`;
    record.versions[0].contextSnapshot = recordMemoContextSnapshot({ sourceReceiptIds: ['long-source'],
      sourceReceipts: [{ sourceReceiptId: 'long-source', url }] }, null, false);
    const response = await invoke(`format=${format}&versionId=v1`);
    expect(response.status).toBe(200);
    const bytes = await response.arrayBuffer();
    const text = format === 'md' ? Buffer.from(bytes).toString('utf8') : await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(text).not.toContain('https://example.test/');
    expect(text).toContain('Source URL: missing or redacted; obtain authorized access separately.');
  });
});
