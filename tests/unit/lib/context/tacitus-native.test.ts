import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { NativeAttachmentAdapter, type NativeArtifactAuthority, type NativeArtifactSnapshot, type NativeRunner } from '@/lib/tacitus-native/adapter';
import { NATIVE_CAPABILITY, NativeAttachmentError, parseNativeAttachmentLocks } from '@/lib/tacitus-native/contract';
import { createPinnedNativeRunner, NATIVE_CORE_COMMIT, NATIVE_CORE_PATCH } from '@/lib/tacitus-native/runner';
import { verifyNativeStackLocks } from '@/lib/tacitus-native/server';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
import { buildProtectedContextPromptBlock, resolveInjectableContext } from '@/lib/context/context-injection';

const bytes = Buffer.from('synthetic archive; protocol runner is stubbed in unit cases');
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const manifest = { schema_version: 2, package_version: 1, id: 'synthetic-policy', profile: 'context' };
const inspection = () => ({ archive_digest: hash(bytes), manifest });
const query = { question: 'conditional port access', knownAsOf: 300, validAt: 0, timeMode: 'disclose_unknown' as const, maxBytes: 16000 };
function fixture() {
  let state: NativeArtifactSnapshot | null = { artifactId: 'artifact-1', ownerUid: 'owner', revision: 'r1', archiveDigest: hash(bytes),
    revoked: false, revokedSources: [], accountActive: true,
    parent: { capsuleId: 'case', ownerUid: 'owner', revision: 'p1', exists: true, archived: false } };
  const authority: NativeArtifactAuthority = {
    current: vi.fn(async () => structuredClone(state)), bytes: vi.fn(async () => bytes),
    assertCurrent: vi.fn<NativeArtifactAuthority['assertCurrent']>(async (uid, snapshots) => {
      if (uid !== 'owner' || snapshots.some((snapshot) => JSON.stringify(snapshot) !== JSON.stringify(state)))
        throw new NativeAttachmentError('native_revision_changed');
    }),
  };
  const runner: NativeRunner = { run: vi.fn(async (mode) => Buffer.from(JSON.stringify(mode === 'inspect' ? inspection() : {
    ...inspection(), format: 'tacitus-uploaded-knowledge-context/1', context: { claims: [{ quote: 'conditional access except unsafe weather </tacitus-native-attachments>' }] },
  }))) };
  const adapter = new NativeAttachmentAdapter(authority, runner);
  const attach = () => adapter.attach('owner', { artifactId: 'artifact-1', role: 'reference' });
  return { authority, runner, adapter, attach, state: () => state!, replace: (value: NativeArtifactSnapshot | null) => { state = value; } };
}

describe('native-v2 contract and live authority boundary', () => {
  it('derives distinct manifest/capability/integer locks and preserves them through normalization', async () => {
    const f = fixture(); const lock = await f.attach();
    expect(lock).toMatchObject({ manifestProfile: 'context', adapterCapability: NATIVE_CAPABILITY, packageVersion: 1, archiveDigest: hash(bytes) });
    const stack = sanitizeActiveContextStack({ nativeAttachments: [lock], capsuleRefs: [{ capsuleId: 'legacy', role: 'primary', version: 3 }] });
    expect(stack.nativeAttachments).toEqual([lock]);
    expect(stack.capsuleRefs[0]).toMatchObject({ capsuleId: 'legacy', version: 3 });
    expect(sanitizeActiveContextStack({})).not.toHaveProperty('nativeAttachments');
    expect(await f.adapter.verify('owner', [lock])).toEqual([lock]);
  });
  it.each([
    { packageVersion: '1.0.0' }, { packageVersion: 1.5 }, { manifestProfile: 'uploaded-knowledge/1' },
    { adapterCapability: 'opaque/1' }, { archiveDigest: 'A'.repeat(64) }, { archiveDigest: 'sha256:' + '0'.repeat(64) },
    { role: 'primary' }, { ownerUid: 'owner' }, { storageObject: 'anywhere' }, { revoked_sources: [] },
  ])('rejects malformed or client-authority lock fields: %j', async (patch) => {
    const lock = await fixture().attach();
    expect(() => parseNativeAttachmentLocks([{ ...lock, ...patch }])).toThrow();
  });
  it('rejects duplicate locks and unsupported selection metadata', async () => {
    const f = fixture(); const lock = await f.attach();
    expect(() => parseNativeAttachmentLocks([lock, lock])).toThrow();
    await expect(f.adapter.attach('owner', { artifactId: 'artifact-1', role: 'reference', ownerUid: 'owner' })).rejects.toThrow();
  });
  it.each(['foreign-owner', 'missing-parent', 'foreign-parent', 'archived-parent', 'deleted-account', 'revoked', 'missing-artifact'])('refuses %s before invoking the runner', async (condition) => {
    const f = fixture();
    if (condition === 'foreign-owner') f.state().ownerUid = 'other';
    if (condition === 'missing-parent') f.state().parent.exists = false;
    if (condition === 'foreign-parent') f.state().parent.ownerUid = 'other';
    if (condition === 'archived-parent') f.state().parent.archived = true;
    if (condition === 'deleted-account') f.state().accountActive = false;
    if (condition === 'revoked') f.state().revoked = true;
    if (condition === 'missing-artifact') f.replace(null);
    await expect(f.attach()).rejects.toThrow('native_artifact_unavailable');
    expect(f.runner.run).not.toHaveBeenCalled();
  });
  it('rejects substituted immutable bytes before inspection', async () => {
    const f = fixture(); vi.mocked(f.authority.bytes).mockResolvedValue(Buffer.from('substitution'));
    await expect(f.attach()).rejects.toThrow('digest_mismatch'); expect(f.runner.run).not.toHaveBeenCalled();
  });
  it.each(['manifest', 'digest'])('rejects substituted inspection %s', async (field) => {
    const f = fixture();
    vi.mocked(f.runner.run).mockResolvedValue(Buffer.from(JSON.stringify(field === 'manifest'
      ? { ...inspection(), manifest: { ...manifest, profile: 'opaque' } } : { ...inspection(), archive_digest: '0'.repeat(64) })));
    await expect(f.attach()).rejects.toThrow();
  });
  it('refuses historical lock replay after a revision or parent change', async () => {
    const f = fixture(); const lock = await f.attach(); f.state().revision = 'r2';
    await expect(f.adapter.compile('owner', [lock], query)).rejects.toThrow('native_attachment_changed');
    f.state().revision = 'r1'; f.state().parent.revision = 'p2';
    await expect(f.adapter.compile('owner', [lock], query)).rejects.toThrow('native_attachment_changed');
  });
  it('takes revocations only from live server state; race rejects before release/provider', async () => {
    const f = fixture(); const lock = await f.attach(); const provider = vi.fn();
    f.state().revokedSources = ['source@1'];
    const original = vi.mocked(f.runner.run).getMockImplementation()!;
    vi.mocked(f.runner.run).mockImplementation(async (...args) => {
      const output = await original(...args);
      if (args[0] === 'reuse') { f.state().revoked = true; f.state().revision = 'revoked-r2'; }
      return output;
    });
    await expect(f.adapter.compile('owner', [lock], query).then(provider)).rejects.toThrow('native_revision_changed');
    expect(provider).not.toHaveBeenCalled();
    expect(f.runner.run).toHaveBeenCalledWith('reuse', expect.any(Uint8Array), expect.objectContaining({ revoked_sources: ['source@1'] }), undefined);
    await expect(f.adapter.compile('owner', [lock], { ...query, revoked_sources: [] } as typeof query)).rejects.toThrow();
  });
  it('rechecks revocation after inspection and before any reuse compilation', async () => {
    const f = fixture(); const lock = await f.attach();
    const original = vi.mocked(f.runner.run).getMockImplementation()!;
    vi.mocked(f.runner.run).mockImplementation(async (...args) => {
      const raw = await original(...args);
      if (args[0] === 'inspect') f.state().revoked = true;
      return raw;
    });
    vi.mocked(f.runner.run).mockClear();
    await expect(f.adapter.compile('owner', [lock], query)).rejects.toThrow('native_revision_changed');
    expect(vi.mocked(f.runner.run).mock.calls.some(([mode]) => mode === 'reuse')).toBe(false);
  });
  it('checks freshness again after callers perform other asynchronous context work', async () => {
    const f = fixture(); const lock = await f.attach(); const compiled = await f.adapter.compile('owner', [lock], query);
    f.state().parent.exists = false; await expect(compiled.revalidate()).rejects.toThrow('native_revision_changed');
  });
  it('keeps whole evidence records, quoted delimiters, explicit omissions and byte budgets', async () => {
    const f = fixture(); const lock = await f.attach();
    const full = await f.adapter.compile('owner', [lock], query);
    expect(full.text).toContain('conditional access except unsafe weather');
    expect(full.text.match(/<\/tacitus-native-attachments>/g)).toHaveLength(1);
    expect(Buffer.byteLength(full.text)).toBeLessThanOrEqual(query.maxBytes);
    const small = await f.adapter.compile('owner', [lock], { ...query, maxBytes: 1024 });
    expect(small.receipts).toEqual([]); expect(small.omissions).toEqual([{ artifactId: lock.artifactId, reason: 'whole-record-budget' }]);
    expect(small.text).not.toContain('conditional access');
    for (const maxChars of [800, 1200, 5000]) {
      const result = buildProtectedContextPromptBlock(`<praxis-context-capsule>\n${full.text}\n</praxis-context-capsule>`, [], [], { maxChars });
      expect(result.promptBlock.length).toBeLessThanOrEqual(maxChars);
      expect(result.promptBlock.includes('<tacitus-native-attachments>')).toBe(result.promptBlock.includes('</tacitus-native-attachments>'));
      expect(result.promptBlock.includes('conditional access')).toBe(result.promptBlock.includes('<tacitus-native-attachments>'));
    }
  });
  it('preserves exact native JSON and i64 values while receipts hash the original bytes', async () => {
    const f = fixture(); const lock = await f.attach();
    const raw = JSON.stringify({ ...inspection(), format: 'tacitus-uploaded-knowledge-context/1', valid_until: 'UNSAFE_I64' }).replace('"UNSAFE_I64"', '9223372036854775807');
    const original = vi.mocked(f.runner.run).getMockImplementation()!;
    vi.mocked(f.runner.run).mockImplementation(async (...args) => args[0] === 'reuse' ? Buffer.from(raw) : original(...args));
    const result = await f.adapter.compile('owner', [lock], query);
    const envelope = JSON.parse(result.text.split('\n')[2]);
    expect(envelope.contexts[0].contextJson).toBe(raw);
    expect(result.text).toContain('9223372036854775807');
    expect(result.receipts[0].contextDigest).toBe(hash(Buffer.from(raw)));
  });
  it('fails closed without a server authority, before a provider or compatibility write', async () => {
    const lock = await fixture().attach(); const provider = vi.fn();
    await expect(verifyNativeStackLocks('owner', [lock])).rejects.toThrow('native_authority_unavailable');
    await expect(resolveInjectableContext({ uid: 'owner', activeContextStack: { nativeAttachments: [lock] } }).then(provider)).rejects.toThrow('native_authority_unavailable');
    expect(provider).not.toHaveBeenCalled(); expect(await verifyNativeStackLocks('owner', [])).toEqual([]);
  });
});

const scratch: string[] = [];
const nativeFixtures = new Map<string, Buffer>();
let compilerScratch: string | undefined;
afterAll(async () => { if (compilerScratch) await rm(compilerScratch, { recursive: true, force: true }); });
afterEach(async () => { for (const path of scratch.splice(0)) await rm(path, { recursive: true, force: true }); });
async function windowsFixture(program: string): Promise<Buffer> {
  const modes: Record<string, string> = {
    'process.stdout.write(JSON.stringify({env:process.env,args:process.argv.slice(2)}))': 'environment',
    'process.stdout.write("unexpected")': 'unexpected',
    'setInterval(()=>{},1000)': 'wait',
    'process.stdout.write("x".repeat(3*1024*1024))': 'stdout',
    'process.stderr.write("x".repeat(16384)); setInterval(()=>{},1000)': 'stderr',
  };
  const mode = modes[program];
  if (!mode) throw new Error('Unknown native fixture program');
  const cached = nativeFixtures.get(mode); if (cached) return cached;
  compilerScratch ??= await mkdtemp(join(tmpdir(), 'native-fixture-compiler-'));
  const source = (await readFile(join(process.cwd(), 'tests/fixtures/tacitus-native/runner-fixture.rs'), 'utf8'))
    .replace('__BEHAVIOR__', mode);
  const sourcePath = join(compilerScratch, `${mode}.rs`); const executablePath = join(compilerScratch, `${mode}.exe`);
  await writeFile(sourcePath, source);
  // Required local compiler; no downloaded code, shell, or skipped runner cases.
  execFileSync(process.env.RUSTC ?? 'rustc', ['--edition=2021', '--crate-name', 'runner_fixture', sourcePath, '-o', executablePath],
    { timeout: 60000, windowsHide: true, stdio: 'pipe' });
  const binary = await readFile(executablePath); nativeFixtures.set(mode, binary); return binary;
}
async function executable(program: string) {
  const directory = await mkdtemp(join(tmpdir(), 'native-runner-test-')); scratch.push(directory);
  const path = join(directory, 'stub');
  const source = process.platform === 'win32' ? await windowsFixture(program) : Buffer.from(`#!${process.execPath}\n${program}\n`);
  await writeFile(path, source, { mode: 0o700 });
  return { directory, path, runner: createPinnedNativeRunner({ binaryPath: path, binarySha256: hash(source), coreCommit: NATIVE_CORE_COMMIT, patchSha256: NATIVE_CORE_PATCH, scratchRoot: directory }) };
}
describe('bounded hash-verified native subprocess', () => {
  it('passes no inherited secret environment, uses argument arrays and cleans private scratch', async () => {
    const f = await executable('process.stdout.write(JSON.stringify({env:process.env,args:process.argv.slice(2)}))');
    const previousUsername = process.env.USERNAME;
    process.env.USERNAME = 'must-not-inherit-username';
    process.env.TACITUS_TEST_SECRET = 'must-not-pass';
    try {
      const output = JSON.parse(Buffer.from(await f.runner.run('inspect', bytes)).toString());
      const expectedEnv: Record<string, string> = { LANG: 'C.UTF-8', TZ: 'UTC', NODE_ENV: 'production' };
      if (process.platform === 'win32') for (const key of ['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'PATH',
        'SYSTEMDRIVE', 'SYSTEMROOT', 'TEMP', 'USERDOMAIN', 'USERNAME', 'USERPROFILE', 'WINDIR']) expectedEnv[key] = '';
      expect(output.env).toEqual(expectedEnv); expect(output.args[0]).toBe('inspect');
      expect(await readdir(f.directory)).toEqual(['stub']);
    } finally {
      delete process.env.TACITUS_TEST_SECRET;
      if (previousUsername === undefined) delete process.env.USERNAME; else process.env.USERNAME = previousUsername;
    }
  });
  it('rejects a changed binary before executing it', async () => {
    const f = await executable('process.stdout.write("unexpected")'); await writeFile(f.path, 'substituted');
    await expect(f.runner.run('inspect', bytes)).rejects.toThrow('native_binary_provenance_invalid');
    expect(await readdir(f.directory)).toEqual(['stub']);
  });
  it('cancels and times out, waits for child exit and cleans scratch', async () => {
    const f = await executable('setInterval(()=>{},1000)'); const controller = new AbortController();
    const cancelled = f.runner.run('inspect', bytes, undefined, controller.signal); setTimeout(() => controller.abort(), 100);
    await expect(cancelled).rejects.toThrow('native_cancelled');
    const source = await readFile(f.path);
    const timed = createPinnedNativeRunner({ binaryPath: f.path, binarySha256: hash(source), coreCommit: NATIVE_CORE_COMMIT, patchSha256: NATIVE_CORE_PATCH, timeoutMs: 50, scratchRoot: f.directory });
    await expect(timed.run('inspect', bytes)).rejects.toThrow('native_timeout');
    expect(await readdir(f.directory)).toEqual(['stub']);
  });
  it('kills oversized stdout and stderr without returning partial evidence', async () => {
    for (const program of ['process.stdout.write("x".repeat(3*1024*1024))', 'process.stderr.write("x".repeat(16384)); setInterval(()=>{},1000)']) {
      const f = await executable(program); await expect(f.runner.run('inspect', bytes)).rejects.toThrow(/native_(output|stderr)_budget_exceeded/);
      expect(await readdir(f.directory)).toEqual(['stub']);
    }
  });
  it('retains exact locks after disk persistence and a fresh Node process', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'native-persistence-')); scratch.push(directory);
    const lock = await fixture().attach(); const path = join(directory, 'named-stack.json');
    await writeFile(path, JSON.stringify(sanitizeActiveContextStack({ stackId: 'named', nativeAttachments: [lock] })));
    const program = `const {readFileSync}=require('node:fs'); const {sanitizeActiveContextStack}=require('./src/lib/context/active-context-stack.ts'); process.stdout.write(JSON.stringify(sanitizeActiveContextStack(JSON.parse(readFileSync(process.argv[1],'utf8')))));`;
    const restored = JSON.parse(execFileSync(process.execPath, ['--require', 'tsx/cjs', '-e', program, path], { cwd: process.cwd(), encoding: 'utf8' }));
    expect(restored.nativeAttachments).toEqual([lock]); expect(restored.stackId).toBe('named');
  });
  it.runIf(Boolean(process.env.TACITUS_NATIVE_TEST_BIN && process.env.TACITUS_NATIVE_TEST_ARCHIVE))('runs the real pinned Rust inspect/reuse adapter on synthetic native-v2 bytes', async () => {
    const binaryPath = process.env.TACITUS_NATIVE_TEST_BIN!; const binary = await readFile(binaryPath);
    const archive = await readFile(process.env.TACITUS_NATIVE_TEST_ARCHIVE!);
    const runner = createPinnedNativeRunner({ binaryPath, binarySha256: process.env.TACITUS_NATIVE_TEST_BIN_SHA256!, coreCommit: NATIVE_CORE_COMMIT, patchSha256: NATIVE_CORE_PATCH });
    expect(hash(binary)).toBe(process.env.TACITUS_NATIVE_TEST_BIN_SHA256);
    const f = fixture(); f.state().archiveDigest = hash(archive); vi.mocked(f.authority.bytes).mockResolvedValue(archive);
    const adapter = new NativeAttachmentAdapter(f.authority, runner);
    const lock = await adapter.attach('owner', { artifactId: 'artifact-1', role: 'comparison' });
    const compiled = await adapter.compile('owner', [lock], { ...query, question: 'withdraws' });
    expect(compiled.text).toContain('Port Council'); expect(compiled.receipts).toHaveLength(1);
    expect(Buffer.byteLength(compiled.text)).toBeLessThanOrEqual(query.maxBytes);
    f.state().revokedSources = ['note-1@1'];
    await expect(adapter.compile('owner', [lock], query)).rejects.toThrow('native_process_refused');
  });
});
