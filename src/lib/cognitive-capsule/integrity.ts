import { createHash } from 'node:crypto';
import { CognitiveCapsuleSchema } from './schema';
import type { CognitiveCapsule } from './types';

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}
export function contentDigest(value: unknown): string { return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`; }
export function capsuleDigest(capsule: CognitiveCapsule): string { return contentDigest(CognitiveCapsuleSchema.parse(capsule)); }
export function semanticDiff(before: CognitiveCapsule, after: CognitiveCapsule) {
  const rows = (c: CognitiveCapsule) => [...c.nodes.map((r) => ({ kind: r.type, record: r })), ...c.statements.map((r) => ({ kind: 'statement', record: r })),
    ...c.evidence.map((r) => ({ kind: 'evidence', record: r })), ...c.knowledge.map((r) => ({ kind: r.kind, record: r }))];
  const old = new Map(rows(before).map((r) => [r.record.id, r])); const next = new Map(rows(after).map((r) => [r.record.id, r]));
  const summary = (r: ReturnType<typeof rows>[number]) => ({ id: r.record.id, kind: r.kind });
  return {
    added: [...next.values()].filter((r) => !old.has(r.record.id)).map(summary),
    changed: [...next.values()].filter((r) => old.has(r.record.id) && canonicalJson(old.get(r.record.id)?.record) !== canonicalJson(r.record)).map(summary),
    removed: [...old.values()].filter((r) => !next.has(r.record.id)).map(summary),
    superseded: [...next.values()].filter((r) => 'reviewState' in r.record && r.record.reviewState === 'superseded' && (old.get(r.record.id)?.record as { reviewState?: string })?.reviewState !== 'superseded').map(summary),
    beforeDigest: capsuleDigest(before), afterDigest: capsuleDigest(after),
  };
}
