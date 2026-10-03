import JSZip from 'jszip';
import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import { capsuleDigest } from '@/lib/cognitive-capsule/integrity';
import { attestCapsulePackage, packCapsule, readCapsulePackage, verifyCapsuleAttestation } from '@/lib/cognitive-capsule/package';

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
  it('bounds real decompression even when a malicious ZIP understates its size', async () => {
    const archive = await new JSZip().file('payload.txt', 'a'.repeat(200_000)).generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    for (let i = 0; i < archive.length - 46; i++) if (archive.readUInt32LE(i) === 0x02014b50) { archive.writeUInt32LE(10, i + 24); break; }
    await expect(readCapsulePackage(archive)).rejects.toThrow();
  });
  it('rejects a rehashed typed-record projection that disagrees with its canonical graph', async () => {
    const zip = await JSZip.loadAsync(await packCapsule(createCognitiveCapsule('tacitus/example')));
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('string'));
    zip.file('governance/rights.json', '{"mode":"open","license":"CC0"}', { createFolders: false });
    const value = Buffer.from('{"mode":"open","license":"CC0"}');
    const { bytesDigest } = await import('@/lib/cognitive-capsule/package');
    manifest.files['governance/rights.json'] = { bytes: value.length, digest: bytesDigest(value) };
    zip.file('manifest.json', JSON.stringify(manifest));
    await expect(readCapsulePackage(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/disagree/);
  });
});

describe('detached Ed25519 artifact attestations', () => {
  it('verifies exact immutable bytes and caller-supplied identity mapping without changing the package', async () => {
    const key = generateKeyPairSync('ed25519');
    const bytes = await packCapsule(createCognitiveCapsule('local/signed', '1.0.0')); const before = Buffer.from(bytes);
    const attestation = await attestCapsulePackage(bytes, { privateKey: key.privateKey, keyId: 'reviewer-key', actorId: 'expert-1', kind: 'review', issuedAt: '2026-10-03T12:00:00Z' });
    const result = await verifyCapsuleAttestation(bytes, attestation, { 'reviewer-key': { actorId: 'expert-1', publicKey: key.publicKey } });
    expect(result).toMatchObject({ verified: true, trustedKeyMapping: 'caller-supplied', kind: 'review', actorId: 'expert-1' });
    expect(Buffer.from(bytes)).toEqual(before);
  });
  it('rejects untrusted identity, wrong key, tampered digest and changed bytes', async () => {
    const key = generateKeyPairSync('ed25519'); const other = generateKeyPairSync('ed25519');
    const bytes = await packCapsule(createCognitiveCapsule('local/signed', '1.0.0'));
    const attestation = await attestCapsulePackage(bytes, { privateKey: key.privateKey, keyId: 'author-key', actorId: 'author-1', kind: 'author', issuedAt: '2026-10-03T12:00:00Z' });
    await expect(verifyCapsuleAttestation(bytes, attestation, {})).rejects.toThrow(/trust|key/);
    await expect(verifyCapsuleAttestation(bytes, attestation, { 'author-key': { actorId: 'impostor', publicKey: key.publicKey } })).rejects.toThrow(/identity|actor/);
    await expect(verifyCapsuleAttestation(bytes, attestation, { 'author-key': { actorId: 'author-1', publicKey: other.publicKey } })).rejects.toThrow(/signature/);
    await expect(verifyCapsuleAttestation(bytes, { ...attestation, subject: { ...attestation.subject, capsuleDigest: 'sha256:' + '0'.repeat(64) } }, { 'author-key': { actorId: 'author-1', publicKey: key.publicKey } })).rejects.toThrow(/digest|subject/);
    const changed = await packCapsule(createCognitiveCapsule('local/signed', '1.0.1'));
    await expect(verifyCapsuleAttestation(changed, attestation, { 'author-key': { actorId: 'author-1', publicKey: key.publicKey } })).rejects.toThrow(/digest|subject/);
  });
  it('rejects unsupported algorithms and keys', async () => {
    const key = generateKeyPairSync('ed25519'); const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 });
    const bytes = await packCapsule(createCognitiveCapsule('local/signed'));
    const options = { privateKey: key.privateKey, keyId: 'author-key', actorId: 'author-1', kind: 'author' as const, issuedAt: '2026-10-03T12:00:00Z' };
    await expect(attestCapsulePackage(bytes, { ...options, privateKey: rsa.privateKey })).rejects.toThrow(/Ed25519/);
    const attestation = await attestCapsulePackage(bytes, options);
    await expect(verifyCapsuleAttestation(bytes, { ...attestation, algorithm: 'RSA' }, { 'author-key': { actorId: 'author-1', publicKey: key.publicKey } })).rejects.toThrow();
  });
});
