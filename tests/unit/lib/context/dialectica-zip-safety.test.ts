import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { parseDialecticaCapsuleZip } from '@/lib/context/dialectica-capsule-import';

function fixture() {
  const zip = new JSZip();
  for (const name of ['mimetype', 'manifest.json', 'claims.jsonl', 'evidence/sources.jsonl', 'episodes.json', 'runtime.json', 'graph.jsonld', 'agent_context.md', 'operations.md'])
    zip.file(name, readFileSync(join(process.cwd(), 'tests/fixtures/dialectica-capsule', name)));
  return zip;
}
describe('DIALECTICA ZIP transport boundaries', () => {
  it('accepts the canonical fixture including safe directory entries', async () => {
    const bytes = await fixture().generateAsync({ type: 'uint8array' });
    expect((await parseDialecticaCapsuleZip(bytes)).manifest.spec_version).toBe('3.0');
  });
  it.each(['../escape.json', '/absolute.json', 'C:\\escape.json', 'a/../alias.json', 'evidence\\alias.json', 'MANIFEST.JSON'])('rejects raw unsafe or aliased path %s', async name => {
    const zip = fixture(); zip.file(name, '{}', { createFolders: false });
    await expect(parseDialecticaCapsuleZip(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/unsafe|duplicate|path/i);
  });
  it('rejects symlinks before reading package parts', async () => {
    const zip = fixture(); zip.file('link', 'manifest.json', { unixPermissions: 0o120777 });
    await expect(parseDialecticaCapsuleZip(await zip.generateAsync({ type: 'uint8array', platform: 'UNIX' }))).rejects.toThrow(/unsafe/i);
  });
  it('rejects a compressed expansion bomb', async () => {
    const zip = fixture(); zip.file('extra.json', 'x'.repeat(2 * 1024 * 1024 + 1));
    await expect(parseDialecticaCapsuleZip(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }))).rejects.toThrow(/budget|limit/i);
  });
});
