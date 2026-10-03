import { describe, expect, it, vi } from 'vitest';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import { validateRegistryDependencies } from '@/lib/cognitive-capsule/registry-validation';
import type { CognitiveCapsule } from '@/lib/cognitive-capsule/types';

const digest = `sha256:${'1'.repeat(64)}`;
const lock = (name: string) => ({ name, version: '1.0.0', digest });

describe('shared exact registry dependency validation', () => {
  it('checks every rights edge even when a shared artifact is cached', async () => {
    const root = createCognitiveCapsule('expert/root', '1.0.0');
    const privateBranch = createCognitiveCapsule('expert/private', '1.0.0');
    const openBranch = createCognitiveCapsule('expert/open', '1.0.0'); openBranch.rights = { mode: 'open' };
    const shared = createCognitiveCapsule('expert/shared', '1.0.0');
    root.dependencies = [lock(privateBranch.capsuleId), lock(openBranch.capsuleId)];
    privateBranch.dependencies = openBranch.dependencies = [lock(shared.capsuleId)];
    const capsules = new Map([privateBranch, openBranch, shared].map((capsule) => [capsule.capsuleId, capsule]));
    const resolve = vi.fn(async (dependency: CognitiveCapsule['dependencies'][number]) => ({ entry: dependency, capsule: capsules.get(dependency.name)! }));
    await expect(validateRegistryDependencies(root, resolve)).rejects.toThrow(/rights/i);
    expect(resolve.mock.calls.filter(([dependency]) => dependency.name === shared.capsuleId)).toHaveLength(1);
  });

  it('rejects cycles, substituted immutable bytes, deprecation and traversal over budget', async () => {
    const root = createCognitiveCapsule('expert/root', '1.0.0');
    const child = createCognitiveCapsule('expert/child', '1.0.0'); root.dependencies = [lock(child.capsuleId)];
    child.dependencies = [lock(root.capsuleId)];
    await expect(validateRegistryDependencies(root, async (entry) => ({ entry, capsule: child }))).rejects.toThrow(/cyclic/i);
    child.dependencies = [];
    await expect(validateRegistryDependencies(root, async (entry) => ({ entry: { ...entry, digest: `sha256:${'2'.repeat(64)}` }, capsule: child }))).rejects.toThrow(/exact dependency/i);
    await expect(validateRegistryDependencies(root, async (entry) => ({ entry: { ...entry, deprecated: 'Superseded' }, capsule: child }))).rejects.toThrow(/deprecated/i);
    await expect(validateRegistryDependencies(root, async (entry) => ({ entry, capsule: child }), { maxNodes: 0 })).rejects.toThrow(/budget/i);
  });
});
