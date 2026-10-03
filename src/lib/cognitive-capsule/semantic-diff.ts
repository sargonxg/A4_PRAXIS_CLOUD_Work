import { canonicalJson, capsuleDigest } from './integrity';
import type { CognitiveCapsule } from './types';

export interface CognitiveDiffRow {
  id: string; label: string; group: 'nodes' | 'statements' | 'knowledge' | 'evidence' | 'dependencies' | 'policy';
  state: 'added' | 'removed' | 'changed'; before: unknown; after: unknown;
}
/** Compare canonical records, including review, guards, dates, sources and rationale. */
export function diffCognitiveCapsules(before?: CognitiveCapsule, after?: CognitiveCapsule) {
  const rows: CognitiveDiffRow[] = [];
  for (const group of ['nodes', 'statements', 'knowledge', 'evidence'] as const) {
    const old = new Map((before?.[group] ?? []).map(r => [r.id, r]));
    const next = new Map((after?.[group] ?? []).map(r => [r.id, r]));
    for (const id of [...new Set([...old.keys(), ...next.keys()])].sort()) {
      const a = old.get(id); const b = next.get(id);
      if (canonicalJson(a ?? null) === canonicalJson(b ?? null)) continue;
      const record = b ?? a!;
      rows.push({ id, group, label: 'label' in record ? record.label : 'quote' in record ? `Evidence ${id}` : `${record.subject} ${record.predicate}`,
        state: !a ? 'added' : !b ? 'removed' : 'changed', before: a ?? null, after: b ?? null });
    }
  }
  for (const [id, group] of [['dependencies', 'dependencies'], ['rights', 'policy'], ['profile', 'policy']] as const) {
    const a = before?.[id] ?? null; const b = after?.[id] ?? null;
    if (canonicalJson(a) !== canonicalJson(b)) rows.push({ id, group, label: id, state: 'changed', before: a, after: b });
  }
  return { beforeDigest: before ? capsuleDigest(before) : null, afterDigest: after ? capsuleDigest(after) : null, rows };
}
