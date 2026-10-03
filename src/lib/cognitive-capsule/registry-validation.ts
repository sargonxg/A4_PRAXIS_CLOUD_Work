import type { CognitiveCapsule } from './types';

export interface RegistryDependencyEntry {
  name: string; version: string; digest: string; capsuleDigest?: string; deprecated?: string;
}
export interface ResolvedRegistryDependency { entry: RegistryDependencyEntry; capsule: CognitiveCapsule }

/** Share exact-lock/rights/cycle checks across local and hosted stores. Every edge checks rights, even in a cached DAG. */
export async function validateRegistryDependencies(capsule: CognitiveCapsule,
  resolve: (dependency: CognitiveCapsule['dependencies'][number]) => Promise<ResolvedRegistryDependency>,
  options: { maxNodes?: number } = {},
): Promise<ResolvedRegistryDependency[]> {
  const cache = new Map<string, ResolvedRegistryDependency>();
  const validated = new Set<string>();
  const visit = async (parent: CognitiveCapsule, ancestors: Set<string>): Promise<void> => {
    for (const dependency of parent.dependencies) {
      const identity = `${dependency.name}@${dependency.version}`;
      if (ancestors.has(identity)) throw new Error('Cyclic capsule dependency lock.');
      const key = `${identity}#${dependency.digest}`;
      let resolved = cache.get(key);
      if (!resolved) {
        if (cache.size >= (options.maxNodes ?? 2000)) throw new Error('The capsule dependency graph exceeds the registry validation budget.');
        resolved = await resolve(dependency); cache.set(key, resolved);
      }
      if (resolved.entry.name !== dependency.name || resolved.entry.version !== dependency.version || resolved.entry.digest !== dependency.digest || resolved.entry.deprecated || resolved.capsule.capsuleId !== dependency.name || resolved.capsule.version !== dependency.version)
        throw new Error(`Unresolved or deprecated exact dependency lock: ${identity}`);
      if (resolved.capsule.rights.mode !== 'open' && parent.rights.mode === 'open') throw new Error('Dependency rights are incompatible with open redistribution.');
      if (resolved.capsule.rights.mode === 'licensed' && resolved.capsule.rights.license !== parent.rights.license) throw new Error('Dependency license is incompatible.');
      if (!validated.has(key)) { await visit(resolved.capsule, new Set([...ancestors, identity])); validated.add(key); }
    }
  };
  await visit(capsule, new Set([`${capsule.capsuleId}@${capsule.version}`]));
  return [...cache.values()];
}
