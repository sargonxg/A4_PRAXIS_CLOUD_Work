import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import { capsuleDigest } from '@/lib/cognitive-capsule/integrity';
import { packCapsule, readCapsulePackage } from '@/lib/cognitive-capsule/package';

describe('native cognitive capsule package', () => {
  it('round trips exact semantic records and deterministic immutable bytes', async () => {
    const c = createCognitiveCapsule('tacitus/example', '1.0.0');
    const bytes = await packCapsule(c);
    const result = await readCapsulePackage(bytes);
    expect(result.capsule).toEqual(c);
    expect(result.manifest.capsuleDigest).toBe(capsuleDigest(c));
    expect(await packCapsule(c)).toEqual(bytes);
    expect(Object.keys(result.files)).toContain('graph.jsonld');
    expect(Object.keys(result.files)).toContain('governance/rights.json');
    expect(Object.keys(result.files).some((f) => f.startsWith('documents/'))).toBe(false);
  });
  it('rejects byte corruption, undeclared files and traversal before extraction', async () => {
    const bytes = await packCapsule(createCognitiveCapsule('tacitus/example'));
    const tampered = await JSZip.loadAsync(bytes);
    tampered.file('statements.jsonl', 'tampered');
    await expect(readCapsulePackage(await tampered.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/digest|hash|size/i);
    const extra = await JSZip.loadAsync(bytes);
    extra.file('extra.txt', 'unexpected');
    await expect(readCapsulePackage(await extra.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/undeclared|unexpected/i);
    const unsafe = new JSZip().file('../outside.txt', 'unsafe');
    await expect(readCapsulePackage(await unsafe.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/unsafe|path/i);
  });
  it('enforces compressed and decompressed budgets and rights', async () => {
    const bytes = await packCapsule(createCognitiveCapsule('tacitus/example'));
    await expect(readCapsulePackage(bytes, { maxArchiveBytes: 100 })).rejects.toThrow(/limit|budget/i);
    await expect(readCapsulePackage(bytes, { maxTotalBytes: 100 })).rejects.toThrow(/limit|budget/i);
    const c = createCognitiveCapsule('tacitus/example');
    c.rights = { mode: 'licensed' };
    await expect(packCapsule(c)).rejects.toThrow(/license|rights/i);
  });
});
