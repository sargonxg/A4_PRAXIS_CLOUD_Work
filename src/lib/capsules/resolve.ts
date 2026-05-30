import { createHash } from 'node:crypto';

import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';
import type { CapsuleImport, CapsuleRef, ContextCapsule } from '@/types/context-capsule';

export type CapsuleLoader = (ref: CapsuleRef) => Promise<ContextCapsule | null> | ContextCapsule | null;

export interface CapsuleResolutionStep {
  kind: 'extends' | 'import' | 'self';
  id: string;
  as?: string;
  pick?: string[];
  hash?: string;
  version?: string;
}

export type ResolvedContextCapsule = ContextCapsule & {
  resolutionTrace: CapsuleResolutionStep[];
};

export interface ResolveCapsuleOptions {
  loadCapsule?: CapsuleLoader;
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 12;

export async function resolveCapsule(
  ref: CapsuleRef,
  options: ResolveCapsuleOptions = {},
): Promise<ResolvedContextCapsule> {
  const loader = options.loadCapsule ?? loadCapsuleFromFirestore;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const seen = new Set<string>();
  return resolveCapsuleInternal(ref, { loader, maxDepth, seen, root: true });
}

export function computeCapsuleContentHash(capsule: ContextCapsule): string {
  const canonical = canonicalizeCapsuleContent(capsule);
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical)).digest('hex')}`;
}

export function canonicalizeCapsuleContent(capsule: ContextCapsule): unknown {
  return canonicalize(stripHashOnly(capsule));
}

async function resolveCapsuleInternal(
  ref: CapsuleRef,
  context: {
    loader: CapsuleLoader;
    maxDepth: number;
    seen: Set<string>;
    depth?: number;
    root: boolean;
  },
): Promise<ResolvedContextCapsule> {
  const depth = context.depth ?? 0;
  if (depth > context.maxDepth) {
    throw new Error(`Capsule resolution exceeded max depth ${context.maxDepth}`);
  }

  const raw = await context.loader(ref);
  if (!raw) {
    throw new Error(`Capsule not found: ${refToKey(ref)}`);
  }

  const capsule = parseCapsule(raw, ref);
  const seenKey = refToKey({ id: capsule.id, version: capsule.version, hash: ref.hash ?? capsule.contentHash });
  if (context.seen.has(seenKey)) {
    throw new Error(`Capsule composition cycle detected at ${seenKey}`);
  }
  context.seen.add(seenKey);

  let effective: ContextCapsule | null = null;
  let trace: CapsuleResolutionStep[] = [];

  if (capsule.extends) {
    const parent = await resolveCapsuleInternal(capsule.extends, {
      ...context,
      depth: depth + 1,
      root: false,
    });
    effective = stripResolutionTrace(parent);
    trace = parent.resolutionTrace.map((step) => (
      step.kind === 'self' ? { ...step, kind: 'extends' as const } : step
    ));
  }

  for (const capsuleImport of capsule.imports ?? []) {
    const imported = await resolveCapsuleInternal(capsuleImport.ref, {
      ...context,
      depth: depth + 1,
      root: false,
    });
    effective = mergeCapsules(
      effective,
      pickCapsuleFields(stripResolutionTrace(imported), capsuleImport),
      'deep-merge',
    );
    trace.push({
      kind: 'import',
      id: imported.id,
      as: capsuleImport.as,
      pick: capsuleImport.pick?.map(String),
      hash: imported.contentHash,
      version: imported.version,
    });
  }

  effective = mergeCapsules(effective, capsule, capsule.mergeStrategy);
  const parsed = ContextCapsuleSchema.parse({
    ...effective,
    contentHash: computeCapsuleContentHash(effective),
  }) as ContextCapsule;
  trace.push({
    kind: context.root ? 'self' : 'self',
    id: parsed.id,
    hash: parsed.contentHash,
    version: parsed.version,
  });

  context.seen.delete(seenKey);
  return { ...parsed, resolutionTrace: trace };
}

async function loadCapsuleFromFirestore(ref: CapsuleRef): Promise<ContextCapsule | null> {
  const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
  const db = getAdminDbOrThrow();
  const capsuleRef = db.collection('capsules').doc(ref.id);

  if (ref.hash) {
    const versionSnap = await capsuleRef.collection('versions').doc(ref.hash).get();
    return versionSnap.exists ? parseCapsule(versionSnap.data(), ref) : null;
  }

  if (ref.version) {
    const versions = await capsuleRef
      .collection('versions')
      .where('version', '==', ref.version)
      .limit(1)
      .get();
    const first = versions.docs[0];
    return first?.exists ? parseCapsule(first.data(), ref) : null;
  }

  const snap = await capsuleRef.get();
  return snap.exists ? parseCapsule(snap.data(), ref) : null;
}

function parseCapsule(raw: unknown, ref: CapsuleRef): ContextCapsule {
  const parsed = ContextCapsuleSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid capsule ${refToKey(ref)}: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
  }
  return parsed.data as ContextCapsule;
}

function refToKey(ref: CapsuleRef): string {
  return [ref.id, ref.version ? `v=${ref.version}` : '', ref.hash ? `h=${ref.hash}` : '']
    .filter(Boolean)
    .join('@');
}

function stripResolutionTrace(capsule: ResolvedContextCapsule): ContextCapsule {
  const { resolutionTrace: _resolutionTrace, ...rest } = capsule;
  return rest;
}

function pickCapsuleFields(capsule: ContextCapsule, capsuleImport: CapsuleImport): Partial<ContextCapsule> {
  if (!capsuleImport.pick || capsuleImport.pick.length === 0) return capsule;

  const selected: Partial<ContextCapsule> = {};
  for (const key of capsuleImport.pick) {
    if (key in capsule) {
      (selected as Record<string, unknown>)[key as string] = (capsule as unknown as Record<string, unknown>)[key as string];
    }
  }
  return selected;
}

function mergeCapsules(
  base: ContextCapsule | Partial<ContextCapsule> | null,
  overlay: ContextCapsule | Partial<ContextCapsule>,
  strategy: ContextCapsule['mergeStrategy'],
): ContextCapsule {
  if (!base) return overlay as ContextCapsule;

  if (strategy === 'override') {
    return { ...base, ...overlay } as ContextCapsule;
  }

  if (strategy === 'prototype') {
    return prototypeMerge(base, overlay) as ContextCapsule;
  }

  return deepMerge(base, overlay) as ContextCapsule;
}

function prototypeMerge(base: unknown, overlay: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay ?? base;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      merged[key] = value.length > 0 ? value : (base as Record<string, unknown>)[key];
      continue;
    }
    if (isPlainObject(value) && isPlainObject((base as Record<string, unknown>)[key])) {
      merged[key] = prototypeMerge((base as Record<string, unknown>)[key], value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) return unionArrays(base, overlay);
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value;
  }
  return merged;
}

function unionArrays(base: unknown[], overlay: unknown[]): unknown[] {
  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const item of [...base, ...overlay]) {
    const key = JSON.stringify(canonicalize(item));
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function stripHashOnly(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripHashOnly);
  if (!isPlainObject(value)) return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'contentHash' || key === 'resolutionTrace') continue;
    result[key] = stripHashOnly(child);
  }
  return result;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isPlainObject(value)) return value;

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) acc[key] = canonicalize(child);
      return acc;
    }, {});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
