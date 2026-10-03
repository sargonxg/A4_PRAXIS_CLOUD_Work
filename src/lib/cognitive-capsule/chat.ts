import { CognitiveCapsuleSchema } from './schema';
import { CognitiveGraph } from './graph';
import type { CognitiveCapsule, Knowledge } from './types';

export const CAPSULE_INSPECTION_COMMANDS = ['Explain this capsule', 'What would a novice miss?', 'Show unresolved contradictions', 'Show unsupported heuristics', 'Which rules have exceptions?', 'Which knowledge came from documents?', 'Show stale rules', 'Which terms are sensitive?', 'Show source spans', 'What changed?'] as const;
export type CapsuleInspectionRow = { id: string; title: string; text: string; refs: string[] };
export type CapsuleInspectionReply = { method: 'deterministic-inspection'; summary: string; rows: CapsuleInspectionRow[]; total: number; truncated: boolean; capsuleVersion: string };
function mentionsId(query: string, id: string): boolean {
  const escaped = id.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9._:-])${escaped}(?=$|[^a-z0-9._:-])`).test(query);
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
function detail(k: Knowledge): string {
  switch (k.kind) {
    case 'distinction': return `${k.conceptA} ≠ ${k.conceptB}. ${k.explanation}`;
    case 'languageRule': return `${k.expression}: ${k.meaning}. Do not infer: ${k.nonImplications.join('; ') || 'none recorded'}.`;
    case 'heuristic': return `${k.interpretation} Conditions: ${JSON.stringify(k.when)}. Exceptions: ${JSON.stringify(k.exceptions)}.`;
    case 'pattern': case 'case': return k.interpretation;
    case 'question': return k.question;
    case 'procedure': return k.purpose;
    case 'revisionTrigger': return k.action;
    case 'exception': return k.explanation;
    default: return k.description;
  }
}
/** Architecture inspection is a deterministic view of stored records, never a generated factual answer. */
export function inspectCognitiveCapsule(value: CognitiveCapsule, query: string, options: { prior?: CognitiveCapsule; asOf?: string } = {}): CapsuleInspectionReply {
  const capsule = CognitiveCapsuleSchema.parse(value); const graph = new CognitiveGraph(capsule);
  const normalized = query.trim().toLowerCase().slice(0, 1000); const asOf = Date.parse(options.asOf ?? new Date().toISOString());
  if (!Number.isFinite(asOf)) throw new Error('Use a valid inspection date.');
  const knowledgeRows = (items: Knowledge[]): CapsuleInspectionRow[] => items.map(k => ({ id: k.id, title: `${k.label} · ${k.kind} · ${k.reviewState}`, text: `${detail(k)} Origin: ${k.provenance.generatedBy.type} ${k.provenance.generatedBy.id}.`, refs: [...k.provenance.sourceRefs, ...k.provenance.derivedFrom] }));
  const evidenceRows = (ids?: string[]): CapsuleInspectionRow[] => capsule.evidence.filter(s => !ids || ids.includes(s.id) || ids.includes(s.sourceId)).map(s => ({ id: s.id, title: `${s.sourceId} · ${s.sourceVersion} · ${s.anchorStatus}`, text: `${s.quote}${s.page ? ` (page ${s.page})` : ''}${s.start !== undefined ? ` (offsets ${s.start}–${s.end})` : ''}`, refs: [s.sourceId] }));
  let summary = ''; let rows: CapsuleInspectionRow[] = [];
  if (/changed|compare|since v/.test(normalized)) {
    if (!options.prior) summary = 'The requested historical semantic baseline is unavailable in this view. No version changes can be inferred.';
    else {
      const prior = CognitiveCapsuleSchema.parse(options.prior);
      if (prior.capsuleId !== capsule.capsuleId) throw new Error('Version comparison requires the same capsule.');
      const requestedVersion = normalized.match(/(?:since|compare(?: with)?)\s+v?(\d+(?:\.\d+\.\d+)?)/)?.[1];
      if (requestedVersion && requestedVersion !== prior.version) summary = `The requested baseline ${requestedVersion} is unavailable. The available semantic baseline is ${prior.version}.`;
      else {
        const records = (c: CognitiveCapsule) => [...c.nodes, ...c.statements, ...c.knowledge, ...c.evidence];
        const before = new Map(records(prior).map(r => [r.id, r])); const after = new Map(records(capsule).map(r => [r.id, r]));
        for (const [id, record] of after) if (!before.has(id) || stable(before.get(id)) !== stable(record)) rows.push({ id, title: `${before.has(id) ? 'Changed' : 'Added'} ${id}`, text: 'label' in record ? record.label : 'quote' in record ? record.quote : record.predicate, refs: [] });
        for (const id of before.keys()) if (!after.has(id)) rows.push({ id, title: `Removed ${id}`, text: 'Absent from the current semantic snapshot.', refs: [] });
        summary = `Stored semantic differences from ${prior.version} to ${capsule.version}.`;
      }
    }
  } else if (/why.*(?:edge|statement)|^(?:edge|statement)\s/.test(normalized)) {
    const target = capsule.statements.find(s => mentionsId(normalized, s.id));
    if (!target) summary = 'Name an existing statement ID to inspect why an edge exists.';
    else {
      const refs = Array.from(new Set([...target.sourceRefs, ...target.provenance.sourceRefs, ...(target.wordingRef ? [target.wordingRef] : [])]));
      rows = [{ id: target.id, title: `${target.subject} → ${target.predicate} → ${'node' in target.object ? target.object.node : String(target.object.literal)}`, text: `Stored ${target.layer} statement; ${target.polarity}; ${target.modality ?? 'no modality recorded'}; ${target.reviewState}. Origin: ${target.provenance.generatedBy.type} ${target.provenance.generatedBy.id}. Conditions: ${JSON.stringify(target.conditions)}. Exceptions: ${JSON.stringify(target.exceptions)}.`, refs }, ...evidenceRows(refs)];
      summary = 'This explanation reports the stored edge, its provenance and evidence. It does not establish that the edge is true.';
    }
  } else if (/contradict|conflict/.test(normalized)) {
    const pairs = new Set<string>();
    for (const s of capsule.statements.filter(s => !['rejected', 'superseded'].includes(s.reviewState))) for (const conflict of graph.findContradictions(s.id).filter(r => !['rejected', 'superseded'].includes(r.reviewState))) {
      const id = [s.id, conflict.id].sort().join(' ↔ '); if (pairs.has(id)) continue; pairs.add(id);
      rows.push({ id, title: `Contradiction candidate: ${id}`, text: 'An explicit contradiction relation or opposite polarity is stored. Check scope, modality and time before treating it as a substantive conflict.', refs: Array.from(new Set([...s.sourceRefs, ...conflict.sourceRefs])) });
    }
    summary = `${rows.length} unresolved structural contradiction candidates. This is not a semantic proof of inconsistency.`;
  } else if (/unsupported|without evidence/.test(normalized)) {
    rows = knowledgeRows(capsule.knowledge.filter(k => (!/heuristic/.test(normalized) || k.kind === 'heuristic') && (!k.provenance.sourceRefs.length || k.provenance.sourceRefs.some(id => !capsule.evidence.some(s => s.id === id && s.anchorStatus !== 'unresolved')))));
    summary = 'These items lack resolved documentary anchors. Expert recollection is not documentary evidence; absence of an anchor does not prove a rule false.';
  } else if (/stale|expired/.test(normalized)) {
    rows = knowledgeRows(capsule.knowledge.filter(k => k.validUntil && Date.parse(k.validUntil) < asOf));
    summary = 'Items whose recorded validity has expired. Items without validity dates cannot be classified as current or stale here.';
  } else if (/exception/.test(normalized)) {
    const rules = new Set(capsule.knowledge.filter(k => k.kind === 'exception').flatMap(k => k.ruleRefs));
    rows = knowledgeRows(capsule.knowledge.filter(k => rules.has(k.id) || k.kind === 'exception' || (k.kind === 'heuristic' && k.exceptions.length > 0)));
    summary = 'Stored rule exceptions and exception records; applicability still requires the relevant conditions.';
  } else if (/from documents|documentary/.test(normalized)) {
    rows = knowledgeRows(capsule.knowledge.filter(k => k.provenance.sourceRefs.length > 0));
    summary = 'Knowledge linked to document evidence. The named generator remains visible; document links do not make a model proposal human confirmed.';
  } else if (/from|origin|expert/.test(normalized) && /(?:from|origin)/.test(normalized)) {
    const actor = normalized.match(/from\s+(?:expert\s+)?["']?(.+?)["']?\??$/)?.[1]?.trim();
    rows = knowledgeRows(capsule.knowledge.filter(k => !actor || k.provenance.generatedBy.id.toLowerCase() === actor || k.provenance.reviewedBy?.id.toLowerCase() === actor));
    summary = 'Authorship and reviewer provenance recorded in this capsule.';
  } else if (/term|sensitive|language/.test(normalized)) {
    rows = knowledgeRows(capsule.knowledge.filter(k => k.kind === 'languageRule' || k.kind === 'distinction'));
    summary = 'Stored language rules and distinctions that require care in wording.';
  } else if (/source|span|evidence/.test(normalized)) {
    const selected = capsule.evidence.filter(s => mentionsId(normalized, s.id) || mentionsId(normalized, s.sourceId));
    rows = evidenceRows(selected.length ? selected.map(s => s.id) : undefined); summary = 'Stored source excerpts and anchor locations.';
  } else if (/novice|strongest|expert knowledge/.test(normalized)) {
    rows = knowledgeRows(capsule.knowledge.filter(k => k.reviewState === 'accepted' && ['distinction', 'heuristic', 'cue', 'redFlag', 'languageRule'].includes(k.kind)));
    summary = 'Human-accepted distinctions and practice knowledge. These are not ranked by measured effectiveness.';
  } else {
    summary = `Capsule ${capsule.capsuleId} · semantic ${capsule.version}: ${capsule.nodes.length} nodes, ${capsule.statements.length} statements, ${capsule.evidence.length} evidence spans and ${capsule.knowledge.length} expertise records. Deterministic inspection supports origins, exceptions, unsupported heuristics, stale rules, contradictions, source spans, edge IDs and available semantic baselines.`;
    rows = knowledgeRows(capsule.knowledge);
  }
  return { method: 'deterministic-inspection', summary, rows: rows.slice(0, 30).map(r => ({ ...r, text: r.text.slice(0, 6000), refs: r.refs.slice(0, 60) })), total: rows.length, truncated: rows.length > 30, capsuleVersion: capsule.version };
}
