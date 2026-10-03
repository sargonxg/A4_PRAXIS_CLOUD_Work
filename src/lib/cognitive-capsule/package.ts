import { createHash, createPrivateKey, createPublicKey, KeyObject, sign, verify } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import JSZip from 'jszip';
import { z } from 'zod';
import { CognitiveCapsuleSchema, COGNITIVE_SCHEMA_VERSION } from './schema';
import { CognitiveGraph } from './graph';
import { canonicalJson, capsuleDigest } from './integrity';
import type { CognitiveCapsule } from './types';

export const CAPSULE_MIMETYPE = 'application/vnd.tacitus.cognitive-capsule+zip';
export const PACKAGE_LIMITS = { maxArchiveBytes: 16 * 1024 * 1024, maxTotalBytes: 64 * 1024 * 1024, maxFileBytes: 8 * 1024 * 1024, maxFiles: 128, maxExpansionRatio: 1000 };
export type PackageLimits = Partial<typeof PACKAGE_LIMITS>;
const digestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const ManifestSchema = z.object({
  format: z.literal('tacitus-native-capsule/1'), schemaVersion: z.literal(COGNITIVE_SCHEMA_VERSION),
  capsuleId: z.string().min(1).max(240), version: z.string().regex(/^\d+\.\d+\.\d+$/), capsuleDigest: digestSchema,
  files: z.record(z.string(), z.object({ digest: digestSchema, bytes: z.number().int().nonnegative() }).strict()),
}).strict();
export type CapsuleManifest = z.infer<typeof ManifestSchema>;
export function bytesDigest(bytes: Uint8Array): string { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }

const AttestationPayloadSchema = z.object({
  format: z.literal('tacitus-capsule-attestation/1'), algorithm: z.literal('Ed25519'),
  kind: z.enum(['author', 'review', 'evaluation', 'publication']), issuedAt: z.iso.datetime({ offset: true }),
  signer: z.object({ keyId: z.string().min(1).max(240), actorId: z.string().min(1).max(240) }).strict(),
  subject: z.object({ artifactDigest: digestSchema, capsuleDigest: digestSchema, schemaVersion: z.literal(COGNITIVE_SCHEMA_VERSION), capsuleId: z.string().min(1).max(240), version: z.string().regex(/^\d+\.\d+\.\d+$/) }).strict(),
}).strict();
export const CapsuleAttestationSchema = AttestationPayloadSchema.extend({ signature: z.string().regex(/^[a-zA-Z0-9_-]{86}$/) }).strict();
export type CapsuleAttestation = z.infer<typeof CapsuleAttestationSchema>;
export type TrustedCapsuleKeys = Record<string, { actorId: string; publicKey: KeyObject | string }>;
export type AttestationOptions = { privateKey: KeyObject | string; keyId: string; actorId: string; kind: CapsuleAttestation['kind']; issuedAt: string };

/** Detached signature: caller supplies its own key and signer identity; package bytes remain immutable. */
export async function attestCapsulePackage(bytes: Uint8Array, options: AttestationOptions): Promise<CapsuleAttestation> {
  const { capsule, manifest } = await readCapsulePackage(bytes);
  const key = options.privateKey instanceof KeyObject ? options.privateKey : createPrivateKey(options.privateKey);
  if (key.type !== 'private' || key.asymmetricKeyType !== 'ed25519') throw new Error('Attestations require an Ed25519 private key.');
  const payload = AttestationPayloadSchema.parse({
    format: 'tacitus-capsule-attestation/1', algorithm: 'Ed25519', kind: options.kind, issuedAt: options.issuedAt,
    signer: { keyId: options.keyId, actorId: options.actorId },
    subject: { artifactDigest: bytesDigest(bytes), capsuleDigest: manifest.capsuleDigest, schemaVersion: capsule.schemaVersion, capsuleId: capsule.capsuleId, version: capsule.version },
  });
  return CapsuleAttestationSchema.parse({ ...payload, signature: sign(null, Buffer.from(canonicalJson(payload), 'utf8'), key).toString('base64url') });
}

/** Cryptographic success authenticates only the caller's explicit key-to-actor mapping, not factual or review quality. */
export async function verifyCapsuleAttestation(bytes: Uint8Array, value: unknown, trustedKeys: TrustedCapsuleKeys) {
  const attestation = CapsuleAttestationSchema.parse(value);
  const trusted = Object.hasOwn(trustedKeys, attestation.signer.keyId) ? trustedKeys[attestation.signer.keyId] : undefined;
  if (!trusted) throw new Error('Attestation signer key has no caller-supplied trust mapping.');
  if (trusted.actorId !== attestation.signer.actorId) throw new Error('Attestation actor identity does not match the trusted key mapping.');
  const key = trusted.publicKey instanceof KeyObject ? trusted.publicKey : createPublicKey(trusted.publicKey);
  if (key.type !== 'public' || key.asymmetricKeyType !== 'ed25519') throw new Error('Attestation verification requires an Ed25519 public key.');
  const { capsule, manifest } = await readCapsulePackage(bytes);
  const subject = { artifactDigest: bytesDigest(bytes), capsuleDigest: manifest.capsuleDigest, schemaVersion: capsule.schemaVersion, capsuleId: capsule.capsuleId, version: capsule.version };
  if (canonicalJson(subject) !== canonicalJson(attestation.subject)) throw new Error('Attestation subject digest, schema or immutable version mismatch.');
  const { signature, ...payload } = attestation; const signatureBytes = Buffer.from(signature, 'base64url');
  if (signatureBytes.toString('base64url') !== signature || !verify(null, Buffer.from(canonicalJson(payload), 'utf8'), key, signatureBytes)) throw new Error('Invalid Ed25519 attestation signature.');
  return { verified: true as const, trustedKeyMapping: 'caller-supplied' as const, kind: attestation.kind, actorId: trusted.actorId, keyId: attestation.signer.keyId, subject, issuedAt: attestation.issuedAt };
}

export function assertCapsuleRights(c: CognitiveCapsule): void {
  if ((c.rights.mode === 'licensed' || c.rights.mode === 'open') && !c.rights.license)
    throw new Error('Open and licensed capsules require an explicit license in rights.');
}
function jsonl(values: unknown[]) { return values.map(canonicalJson).join('\n') + (values.length ? '\n' : ''); }
/** Original documents are deliberately absent: packaging has no document input. */
function canonicalFiles(c: CognitiveCapsule): Record<string, string> {
  const k = (kinds: string[]) => jsonl(c.knowledge.filter((v) => kinds.includes(v.kind)));
  return {
    mimetype: CAPSULE_MIMETYPE,
    'graph.jsonld': canonicalJson(new CognitiveGraph(c).toJsonLd()),
    'statements.jsonl': jsonl(c.statements),
    'evidence/sources.jsonl': jsonl([...new Map(c.evidence.map((s) => [canonicalJson([s.sourceId, s.sourceVersion]), { sourceId: s.sourceId, sourceVersion: s.sourceVersion }])).values()]),
    'evidence/spans.jsonl': jsonl(c.evidence),
    'expertise/cues.jsonl': k(['cue']), 'expertise/patterns.jsonl': k(['pattern']),
    'expertise/heuristics.jsonl': k(['heuristic']), 'expertise/distinctions.jsonl': k(['distinction']),
    'expertise/exceptions.jsonl': k(['exception']), 'expertise/red_flags.jsonl': k(['redFlag']),
    'expertise/questions.jsonl': k(['question']), 'expertise/unknowns.jsonl': k(['unknown']),
    'expertise/revision_triggers.jsonl': k(['revisionTrigger']),
    'language/language_rules.jsonl': k(['languageRule']), 'methods/procedures.jsonl': k(['procedure']),
    'cases/cases.jsonl': k(['case']), 'governance/rights.json': canonicalJson(c.rights),
    'governance/review.json': canonicalJson([...c.nodes, ...c.statements, ...c.knowledge].map(({ id, reviewState }) => ({ id, reviewState }))),
    'governance/provenance.json': canonicalJson([...c.nodes, ...c.statements, ...c.knowledge].map(({ id, provenance }) => ({ id, provenance }))),
    'runtime/context_profiles.json': canonicalJson({ profile: c.profile, dependencies: c.dependencies }),
    'runtime/agent_contract.json': canonicalJson({ mode: 'review-only', canonicalPromotion: 'PRAXIS-review', originalDocumentsIncluded: false }),
    'evals/results.json': canonicalJson({ kind: 'structural', issues: new CognitiveGraph(c).validate(), modelAblation: false }),
    'README.md': 'TACITUS cognitive capsule. Typed records and JSON-LD are canonical. Structural validation does not establish factual truth. Original source documents are excluded.\n',
  };
}

export async function packCapsule(value: unknown): Promise<Uint8Array> {
  const c = CognitiveCapsuleSchema.parse(value); assertCapsuleRights(c);
  const issues = new CognitiveGraph(c).validate();
  if (issues.length) throw new Error(`Capsule graph validation failed: ${issues.map((i) => i.code).join(', ')}`);
  const files = canonicalFiles(c);
  const manifest: CapsuleManifest = { format: 'tacitus-native-capsule/1', schemaVersion: c.schemaVersion, capsuleId: c.capsuleId, version: c.version, capsuleDigest: capsuleDigest(c), files: {} };
  const zip = new JSZip();
  for (const [path, value] of Object.entries(files)) {
    const bytes = Buffer.from(value, 'utf8'); manifest.files[path] = { digest: bytesDigest(bytes), bytes: bytes.length };
    zip.file(path, bytes, { date: new Date('1980-01-01T00:00:00Z'), createFolders: false, compression: 'STORE' });
  }
  zip.file('manifest.json', canonicalJson(manifest), { date: new Date('1980-01-01T00:00:00Z'), createFolders: false, compression: 'STORE' });
  const bytes = await zip.generateAsync({ type: 'uint8array', platform: 'UNIX' });
  // Apply the same limits to writers and readers.
  await readCapsulePackage(bytes);
  return bytes;
}

export function assertSafePackagePath(path: string): void {
  if (!/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(path)
    || path.split('/').some((s) => s === '.' || s === '..' || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s) || /[. ]$/.test(s)))
    throw new Error(`Unsafe capsule path: ${path}`);
}
/** Inspect declared sizes before JSZip can allocate decompression buffers. ZIP64 is intentionally unsupported. */
function preflightZip(bytes: Uint8Array, overrides: PackageLimits): string[] {
  const limits = { ...PACKAGE_LIMITS, ...overrides };
  if (Object.values(limits).some((v) => !Number.isSafeInteger(v) || v <= 0)) throw new Error('Invalid package budget.');
  if (bytes.length > limits.maxArchiveBytes) throw new Error('Archive byte limit exceeded.');
  const b = Buffer.from(bytes); let end = -1;
  for (let p = b.length - 22; p >= Math.max(0, b.length - 65557); p--) {
    if (b.readUInt32LE(p) === 0x06054b50 && p + 22 + b.readUInt16LE(p + 20) === b.length) { end = p; break; }
  }
  if (end < 0) throw new Error('Invalid ZIP end record.');
  const count = b.readUInt16LE(end + 10); const centralSize = b.readUInt32LE(end + 12); let p = b.readUInt32LE(end + 16);
  if (b.readUInt16LE(end + 4) || b.readUInt16LE(end + 6) || count !== b.readUInt16LE(end + 8) || count === 65535 || p === 0xffffffff)
    throw new Error('Multi-disk and ZIP64 archives are unsupported.');
  if (count > limits.maxFiles || p + centralSize !== end) throw new Error('ZIP directory limit or bounds violation.');
  const centralStart = p; const names: string[] = []; const ranges: Array<[number, number]> = []; let total = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > end || b.readUInt32LE(p) !== 0x02014b50) throw new Error('Invalid ZIP directory.');
    const flags = b.readUInt16LE(p + 8), method = b.readUInt16LE(p + 10);
    const compressed = b.readUInt32LE(p + 20), size = b.readUInt32LE(p + 24);
    const nameLength = b.readUInt16LE(p + 28), extraLength = b.readUInt16LE(p + 30), commentLength = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42); const next = p + 46 + nameLength + extraLength + commentLength;
    if (next > end || flags & 1 || ![0, 8].includes(method) || b.readUInt16LE(p + 34) !== 0 || ((b.readUInt32LE(p + 38) >>> 16) & 0xf000) === 0xa000)
      throw new Error('Unsupported or unsafe ZIP entry.');
    const name = b.subarray(p + 46, p + 46 + nameLength).toString('utf8'); assertSafePackagePath(name);
    if (names.includes(name) || names.some((v) => v.toLowerCase() === name.toLowerCase())) throw new Error('Duplicate ZIP path.');
    names.push(name); total += size;
    if (size > limits.maxFileBytes || total > limits.maxTotalBytes || (size > 0 && size / Math.max(compressed, 1) > limits.maxExpansionRatio)) throw new Error('Decompressed byte budget exceeded.');
    if (local + 30 > centralStart || b.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid ZIP local header.');
    const localNameLength = b.readUInt16LE(local + 26), localExtra = b.readUInt16LE(local + 28);
    const dataStart = local + 30 + localNameLength + localExtra;
    if (dataStart + compressed > centralStart || b.readUInt16LE(local + 6) !== flags || b.readUInt16LE(local + 8) !== method
      || b.subarray(local + 30, local + 30 + localNameLength).toString('utf8') !== name) throw new Error('ZIP local and central headers disagree.');
    // Do not trust a forged central uncompressed size before JSZip's CRC pass.
    const payload = b.subarray(dataStart, dataStart + compressed);
    const actual = method === 0 ? payload : inflateRawSync(payload, { maxOutputLength: Math.max(size, 1) });
    if (actual.length !== size) throw new Error('ZIP declared size mismatch.');
    ranges.push([local, dataStart + compressed]); p = next;
  }
  if (p !== end) throw new Error('Unexpected ZIP directory bytes.');
  ranges.sort((a, b) => a[0] - b[0]);
  if (ranges.some((r, i) => i > 0 && r[0] < ranges[i - 1][1])) throw new Error('Overlapping ZIP entries.');
  return names;
}

export async function readCapsulePackage(bytes: Uint8Array, limits: PackageLimits = {}): Promise<{ capsule: CognitiveCapsule; manifest: CapsuleManifest; files: Record<string, Uint8Array> }> {
  const names = preflightZip(bytes, limits);
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) throw new Error('Missing capsule manifest.');
  const manifest = ManifestSchema.parse(JSON.parse(await manifestEntry.async('string')));
  const declared = Object.keys(manifest.files); declared.forEach(assertSafePackagePath);
  if (names.length !== declared.length + 1 || declared.includes('manifest.json') || names.some((n) => n !== 'manifest.json' && !declared.includes(n)))
    throw new Error('Unexpected or undeclared package files.');
  const files: Record<string, Uint8Array> = {};
  for (const path of declared) {
    const entry = zip.file(path); if (!entry) throw new Error('Missing declared file.');
    const value = await entry.async('uint8array'); const expected = manifest.files[path];
    if (value.length !== expected.bytes || bytesDigest(value) !== expected.digest) throw new Error(`File digest or size mismatch: ${path}`);
    files[path] = value;
  }
  const decode = (path: string) => { if (!files[path]) throw new Error(`Missing required file: ${path}`); return Buffer.from(files[path]).toString('utf8'); };
  if (decode('mimetype') !== CAPSULE_MIMETYPE) throw new Error('Invalid capsule mimetype.');
  const capsule = CognitiveGraph.fromJsonLd(JSON.parse(decode('graph.jsonld'))).toCapsule(); assertCapsuleRights(capsule);
  if (capsuleDigest(capsule) !== manifest.capsuleDigest || capsule.capsuleId !== manifest.capsuleId || capsule.version !== manifest.version) throw new Error('Capsule semantic digest or identity mismatch.');
  const expectedFiles = canonicalFiles(capsule);
  if (Object.keys(expectedFiles).length !== declared.length || Object.entries(expectedFiles).some(([path, value]) => decode(path) !== value)) throw new Error('Canonical records disagree with graph or unsupported package contents.');
  if (new CognitiveGraph(capsule).validate().length) throw new Error('Capsule graph validation failed.');
  return { capsule, manifest, files };
}
