import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { readImportZip } from '@/lib/package-zip';

async function archive(compression: 'STORE' | 'DEFLATE' = 'STORE') {
  const zip = new JSZip(); zip.file('folder/a.json', 'original content');
  return zip.generateAsync({ type: 'uint8array', compression });
}
function central(bytes: Uint8Array): number {
  const data = Buffer.from(bytes); return data.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
}
describe('browser-compatible ZIP transport', () => {
  it.each(['STORE', 'DEFLATE'] as const)('verifies bounded %s files with safe directories', async method => {
    const zip = await readImportZip(await archive(method));
    expect(await zip.file('folder/a.json')?.async('string')).toBe('original content');
  });
  it('rejects CRC corruption instead of accepting otherwise readable bytes', async () => {
    const zip = new JSZip(); zip.file('a.json', 'original content', { createFolders: false });
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const offset = central(bytes); const data = new DataView(bytes.buffer);
    data.setUint32(offset + 16, data.getUint32(offset + 16, true) ^ 1, true);
    await expect(readImportZip(bytes)).rejects.toThrow(/CRC/i);
  });
  it('stops a forged declared size before accumulating the expanded payload', async () => {
    const zip = new JSZip(); zip.file('a.json', 'x'.repeat(4096), { createFolders: false });
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const data = new DataView(bytes.buffer), offset = central(bytes);
    data.setUint32(offset + 24, 1, true); data.setUint32(22, 1, true);
    await expect(readImportZip(bytes)).rejects.toThrow(/size|budget|length/i);
  });
  it('rejects duplicate raw names before JSZip can overwrite a record', async () => {
    const zip = new JSZip(); zip.file('a.json', 'one'); zip.file('b.json', 'two');
    const bytes = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
    let offset = bytes.indexOf('b.json');
    while (offset >= 0) { bytes.write('a.json', offset, 'utf8'); offset = bytes.indexOf('b.json', offset + 6); }
    await expect(readImportZip(bytes)).rejects.toThrow(/duplicate|alias/i);
  });
  it('enforces total bytes and entry count before decompression', async () => {
    const zip = new JSZip(); zip.file('a', '1234567'); zip.file('b', '1234567');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    await expect(readImportZip(bytes, { totalBytes: 10 })).rejects.toThrow(/budget/i);
    await expect(readImportZip(bytes, { files: 1 })).rejects.toThrow(/limit/i);
  });
  it.each(['../a', '/a', 'a\\b', 'C:/a', 'CON', 'a/../b'])('rejects unsafe path %s', async name => {
    const zip = new JSZip(); zip.file(name, 'content', { createFolders: false });
    await expect(readImportZip(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/unsafe/i);
  });
});
