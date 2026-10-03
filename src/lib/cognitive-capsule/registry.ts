import { lstat, mkdir, readFile, rename, rmdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CognitiveCapsuleSchema } from './schema';
import { bytesDigest, packCapsule, readCapsulePackage } from './package';
import { canonicalJson } from './integrity';
import type { CognitiveCapsule } from './types';
import { validateRegistryDependencies } from './registry-validation';

const identity = /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/;
const EntrySchema = z.object({ name: z.string(), version: z.string().regex(/^\d+\.\d+\.\d+$/), digest: z.string().regex(/^sha256:[a-f0-9]{64}$/), capsuleDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/), dependencies: CognitiveCapsuleSchema.shape.dependencies, rights: CognitiveCapsuleSchema.shape.rights, installed: z.boolean().default(false), deprecated: z.string().max(2000).optional() }).strict();
const IndexSchema = z.object({ format: z.literal('tacitus-private-registry/1'), entries: z.array(EntrySchema).max(10000) }).strict();
export type RegistryEntry = z.infer<typeof EntrySchema>;
export type RegistryWriteOptions = { allowWrite?: boolean };
function authorize(options: RegistryWriteOptions) { if (options.allowWrite !== true) throw new Error('Registry mutations require --allow-write.'); }
function assertIdentity(name: string) {
  if (!identity.test(name) || name.split('/').some((s) => s === '.' || s === '..' || s.endsWith('.') || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s))) throw new Error('Invalid capsule registry identity. Use publisher/name.');
}
/** Private local files only. No network, credential storage, licensing server or commerce. */
export class LocalCapsuleRegistry {
  readonly root: string;
  constructor(root: string) { this.root = resolve(root); if (dirname(this.root) === this.root) throw new Error('Registry root must not be a filesystem root.'); }
  private async safe(path: string): Promise<string> {
    const full = resolve(this.root, path); const rel = relative(this.root, full);
    if (rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) throw new Error('Unsafe registry target.');
    // Check every existing ancestor, including ancestors of the configured root.
    let cursor = full;
    while (true) {
      try { if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Registry targets cannot traverse symlinks.'); }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
      const parent = dirname(cursor); if (parent === cursor) break; cursor = parent;
    }
    return full;
  }
  private async index(): Promise<z.infer<typeof IndexSchema>> {
    try {
      const target = await this.safe('registry.json');
      if ((await lstat(target)).size > 16 * 1024 * 1024) throw new Error('Registry manifest exceeds byte budget.');
      const content = await readFile(target, 'utf8');
      if (Buffer.byteLength(content) > 16 * 1024 * 1024) throw new Error('Registry manifest exceeds byte budget.');
      const result = IndexSchema.parse(JSON.parse(content));
      const keys = new Set<string>();
      for (const e of result.entries) { assertIdentity(e.name); const key = `${e.name}@${e.version}`; if (keys.has(key)) throw new Error('Duplicate registry version.'); keys.add(key); }
      return result;
    } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { format: 'tacitus-private-registry/1', entries: [] }; throw e; }
  }
  async list(): Promise<RegistryEntry[]> { return structuredClone((await this.index()).entries); }
  private async object(entry: RegistryEntry): Promise<{ bytes: Uint8Array; capsule: CognitiveCapsule }> {
    const target = await this.safe(`objects/${entry.digest.slice(7)}.capsule`);
    if ((await lstat(target)).size > 16 * 1024 * 1024) throw new Error('Registry object exceeds byte budget.');
    const bytes = await readFile(target);
    if (bytesDigest(bytes) !== entry.digest) throw new Error('Registry object digest mismatch.');
    const { capsule, manifest } = await readCapsulePackage(bytes);
    if (capsule.capsuleId !== entry.name || capsule.version !== entry.version || manifest.capsuleDigest !== entry.capsuleDigest) throw new Error('Registry object identity mismatch.');
    if (canonicalJson(capsule.dependencies) !== canonicalJson(entry.dependencies) || canonicalJson(capsule.rights) !== canonicalJson(entry.rights)) throw new Error('Registry object rights or dependency lock mismatch.');
    return { bytes, capsule };
  }
  private async dependencies(c: CognitiveCapsule, entries: RegistryEntry[], _seen = new Set<string>()): Promise<void> {
    await validateRegistryDependencies(c, async (dependency) => {
      const entry = entries.find((record) => record.name === dependency.name && record.version === dependency.version && record.digest === dependency.digest);
      if (!entry || entry.deprecated) throw new Error(`Unresolved or deprecated exact dependency lock: ${dependency.name}@${dependency.version}`);
      return { entry, capsule: (await this.object(entry)).capsule };
    });
  }
  private async mutate<T>(options: RegistryWriteOptions, action: (index: z.infer<typeof IndexSchema>) => Promise<T>): Promise<T> {
    authorize(options); await mkdir(await this.safe('.'), { recursive: true, mode: 0o700 });
    const lock = await this.safe('.write-lock'); await mkdir(lock, { mode: 0o700 });
    try {
      const index = await this.index(); const result = await action(index);
      const temporary = await this.safe(`.registry-${randomUUID()}.json`);
      const content = JSON.stringify(index, null, 2);
      if (Buffer.byteLength(content) > 16 * 1024 * 1024) throw new Error('Registry manifest exceeds byte budget.');
      await writeFile(temporary, content, { flag: 'wx', mode: 0o600 });
      await rename(temporary, await this.safe('registry.json')); return result;
    } finally { await rmdir(lock); }
  }
  async publish(bytes: Uint8Array, options: RegistryWriteOptions = {}): Promise<RegistryEntry> {
    authorize(options); const { capsule, manifest } = await readCapsulePackage(bytes); assertIdentity(capsule.capsuleId);
    return this.mutate(options, async (index) => {
      const digest = bytesDigest(bytes); const existing = index.entries.find((e) => e.name === capsule.capsuleId && e.version === capsule.version);
      if (existing) { if (existing.digest !== digest) throw new Error('Published capsule versions are immutable.'); await this.object(existing); return structuredClone(existing); }
      await this.dependencies(capsule, index.entries, new Set([`${capsule.capsuleId}@${capsule.version}`]));
      await mkdir(await this.safe('objects'), { recursive: true, mode: 0o700 });
      const target = await this.safe(`objects/${digest.slice(7)}.capsule`);
      try { await writeFile(target, bytes, { flag: 'wx', mode: 0o600 }); }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; if (bytesDigest(await readFile(target)) !== digest) throw new Error('Existing content-addressed object is corrupt.'); }
      const entry: RegistryEntry = { name: capsule.capsuleId, version: capsule.version, digest, capsuleDigest: manifest.capsuleDigest, dependencies: capsule.dependencies, rights: capsule.rights, installed: false };
      index.entries.push(entry); return structuredClone(entry);
    });
  }
  async inspect(name: string, version: string): Promise<CognitiveCapsule> {
    assertIdentity(name); const entry = (await this.index()).entries.find((e) => e.name === name && e.version === version);
    if (!entry) throw new Error('Capsule version is not present in the local registry.'); return (await this.object(entry)).capsule;
  }
  /** Read exact historical bytes, including deprecated versions, without mutating installation state. */
  async pull(name: string, version: string): Promise<{ entry: RegistryEntry; bytes: Uint8Array }> {
    assertIdentity(name); const entry = (await this.index()).entries.find((e) => e.name === name && e.version === version);
    if (!entry) throw new Error('Capsule version is not present in the local registry.');
    const { bytes } = await this.object(entry); return { entry: structuredClone(entry), bytes: Uint8Array.from(bytes) };
  }
  async dependencyImpact(name: string, version: string): Promise<{ target: RegistryEntry; directDependents: RegistryEntry[]; transitiveDependents: RegistryEntry[] }> {
    assertIdentity(name); const entries = (await this.index()).entries;
    const target = entries.find((e) => e.name === name && e.version === version);
    if (!target) throw new Error('Capsule version is not present in the local registry.'); await this.object(target);
    const key = (entry: Pick<RegistryEntry, 'name' | 'version' | 'digest'>) => `${entry.name}@${entry.version}#${entry.digest}`;
    const reverse = new Map<string, RegistryEntry[]>();
    for (const entry of entries) for (const dep of entry.dependencies) { const k = key(dep); reverse.set(k, [...(reverse.get(k) ?? []), entry]); }
    const direct = reverse.get(key(target)) ?? []; const visited = new Set<string>([key(target)]); const pending = [...direct]; const affected: RegistryEntry[] = [];
    while (pending.length) { const entry = pending.shift()!; const k = key(entry); if (visited.has(k)) continue; visited.add(k); await this.object(entry); affected.push(entry); pending.push(...(reverse.get(k) ?? [])); }
    const sort = (a: RegistryEntry, b: RegistryEntry) => key(a).localeCompare(key(b));
    return structuredClone({ target, directDependents: [...direct].sort(sort), transitiveDependents: affected.sort(sort) });
  }
  async install(name: string, version: string, options: RegistryWriteOptions = {}): Promise<RegistryEntry> {
    assertIdentity(name); return this.mutate(options, async (index) => {
      const entry = index.entries.find((e) => e.name === name && e.version === version);
      if (!entry) throw new Error('Unknown registry capsule version.'); if (entry.deprecated) throw new Error('Capsule version is deprecated.');
      const { capsule } = await this.object(entry); await this.dependencies(capsule, index.entries, new Set([`${name}@${version}`]));
      entry.installed = true;
      const visited = new Set<string>(); const pending = [...capsule.dependencies];
      while (pending.length) { const d = pending.pop()!; if (visited.has(d.digest)) continue; visited.add(d.digest); const e = index.entries.find((e) => e.name === d.name && e.version === d.version && e.digest === d.digest)!; e.installed = true; pending.push(...e.dependencies); }
      return structuredClone(entry);
    });
  }
  async fork(name: string, version: string, newName: string, options: RegistryWriteOptions = {}): Promise<CognitiveCapsule> {
    authorize(options); assertIdentity(newName); if (newName === name) throw new Error('Fork requires a distinct identity.');
    const capsule = await this.inspect(name, version);
    if (capsule.rights.mode === 'licensed' || capsule.rights.mode === 'organization') throw new Error('Fork requires an explicit rights grant; restricted licenses cannot be inferred.');
    capsule.capsuleId = newName; capsule.version = '0.1.0'; await packCapsule(capsule); return capsule;
  }
  async deprecate(name: string, version: string, reason: string, options: RegistryWriteOptions = {}): Promise<RegistryEntry> {
    assertIdentity(name); if (!reason.trim() || reason.length > 2000) throw new Error('Deprecation requires a reason.');
    return this.mutate(options, async (index) => { const entry = index.entries.find((e) => e.name === name && e.version === version); if (!entry) throw new Error('Unknown registry capsule version.'); entry.deprecated = reason; return structuredClone(entry); });
  }
}
