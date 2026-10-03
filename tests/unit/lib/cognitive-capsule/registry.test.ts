import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import { packCapsule } from '@/lib/cognitive-capsule/package';
import { LocalCapsuleRegistry } from '@/lib/cognitive-capsule/registry';

const roots: string[] = [];
async function registry() { const root = await mkdtemp(join(tmpdir(), 'praxis-registry-')); roots.push(root); return new LocalCapsuleRegistry(root); }
afterEach(async () => { await Promise.all(roots.splice(0).map((p) => rm(p, { recursive: true, force: true }))); });
describe('private local content addressed registry', () => {
  it('pulls exact immutable bytes and reports direct/transitive dependency impact without writes', async () => {
    const r = await registry(); const c = createCognitiveCapsule('local/base', '1.0.0'); const bytes = await packCapsule(c);
    const base = await r.publish(bytes, { allowWrite: true });
    const middle = createCognitiveCapsule('local/middle', '1.0.0'); middle.dependencies = [{ name: base.name, version: base.version, digest: base.digest }];
    const mid = await r.publish(await packCapsule(middle), { allowWrite: true });
    const top = createCognitiveCapsule('local/top', '1.0.0'); top.dependencies = [{ name: mid.name, version: mid.version, digest: mid.digest }];
    await r.publish(await packCapsule(top), { allowWrite: true });
    await r.publish(await packCapsule(createCognitiveCapsule('local/base', '2.0.0')), { allowWrite: true });
    const before = await r.list(); const pulled = await r.pull('local/base', '1.0.0');
    expect(pulled.bytes).toEqual(bytes); expect(pulled.entry.digest).toBe(base.digest);
    const impact = await r.dependencyImpact('local/base', '1.0.0');
    expect(impact.directDependents.map((e) => e.name)).toEqual(['local/middle']);
    expect(impact.transitiveDependents.map((e) => e.name).sort()).toEqual(['local/middle', 'local/top']);
    expect((await r.dependencyImpact('local/base', '2.0.0')).transitiveDependents).toEqual([]);
    expect(await r.list()).toEqual(before);
  });
  it('requires explicit writes and keeps published versions immutable', async () => {
    const r = await registry(); const c = createCognitiveCapsule('tacitus/example', '1.0.0'); const bytes = await packCapsule(c);
    await expect(r.publish(bytes)).rejects.toThrow(/allow-write/);
    const entry = await r.publish(bytes, { allowWrite: true });
    expect(entry.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect((await r.list()).length).toBe(1);
    c.profile = 'language';
    await expect(r.publish(await packCapsule(c), { allowWrite: true })).rejects.toThrow(/immutable/);
    await r.deprecate('tacitus/example', '1.0.0', 'Replaced', { allowWrite: true });
    await expect(r.install('tacitus/example', '1.0.0', { allowWrite: true })).rejects.toThrow(/deprecated/);
  });
  it('resolves exact dependency bytes and refuses absent or mismatched locks', async () => {
    const r = await registry(); const dep = await r.publish(await packCapsule(createCognitiveCapsule('tacitus/base', '1.0.0')), { allowWrite: true });
    const c = createCognitiveCapsule('tacitus/example', '1.0.0');
    c.dependencies = [{ name: 'tacitus/base', version: '1.0.0', digest: 'sha256:' + '0'.repeat(64) }];
    await expect(r.publish(await packCapsule(c), { allowWrite: true })).rejects.toThrow(/dependency|lock/);
    c.dependencies[0].digest = dep.digest;
    await r.publish(await packCapsule(c), { allowWrite: true });
    const installed = await r.install(c.capsuleId, c.version, { allowWrite: true });
    expect(installed.dependencies).toEqual(c.dependencies);
  });
  it('forks under a new identity without silently changing publication or restricted rights', async () => {
    const r = await registry(); const c = createCognitiveCapsule('tacitus/example', '1.0.0');
    await r.publish(await packCapsule(c), { allowWrite: true });
    const fork = await r.fork(c.capsuleId, c.version, 'local/fork', { allowWrite: true });
    expect(fork.capsuleId).toBe('local/fork'); expect(fork.version).toBe('0.1.0');
    expect((await r.list()).length).toBe(1);
    await expect(r.fork(c.capsuleId, c.version, '../escape', { allowWrite: true })).rejects.toThrow(/identity/);
  });
  it('rejects incompatible redistribution rights and symlink registry targets', async () => {
    const r = await registry();
    const dep = await r.publish(await packCapsule(createCognitiveCapsule('local/private', '1.0.0')), { allowWrite: true });
    const open = createCognitiveCapsule('local/open', '1.0.0'); open.rights = { mode: 'open', license: 'CC0' };
    open.dependencies = [{ name: dep.name, version: dep.version, digest: dep.digest }];
    await expect(r.publish(await packCapsule(open), { allowWrite: true })).rejects.toThrow(/rights/);
    const parent = await mkdtemp(join(tmpdir(), 'praxis-link-')); roots.push(parent);
    await symlink(r.root, join(parent, 'alias'), 'junction');
    await expect(new LocalCapsuleRegistry(join(parent, 'alias')).publish(await packCapsule(createCognitiveCapsule('local/test')), { allowWrite: true })).rejects.toThrow(/symlink/);
  });
});
