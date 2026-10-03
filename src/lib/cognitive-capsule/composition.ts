import { CognitiveCapsuleSchema } from './schema';
import { CognitiveGraph } from './graph';
import { canonicalJson, capsuleDigest, contentDigest } from './integrity';
import type { CognitiveCapsule, Condition, Knowledge, KnowledgeProvenance, ProvenanceActor, ReviewState } from './types';

export interface CompositionParentLock {
  sourceIndex: number; capsuleId: string; version: string; digest: string; rights: CognitiveCapsule['rights'];
}
export interface CompositionConflict {
  kind: 'semantic-id-collision' | 'entity-overlap' | 'opposing-statements' | 'divergent-rules';
  recordIds: string[]; sourceIndexes: number[]; message: string;
}
export interface CompositionRecordOrigin {
  id: string; sourceIndex: number; originalId: string; originalReviewState?: ReviewState;
  reviewedBy?: ProvenanceActor; reviewedAt?: string; reviewDecision?: string; reviewNote?: string;
}
export interface CognitiveComposition {
  capsule: CognitiveCapsule; parentLocks: CompositionParentLock[];
  conflicts: CompositionConflict[]; recordOrigins: CompositionRecordOrigin[];
}

type SemanticRecord = CognitiveCapsule['nodes'][number] | CognitiveCapsule['statements'][number] | CognitiveCapsule['evidence'][number] | Knowledge;
type IndexedRecord = { record: SemanticRecord; sourceIndex: number; targetId: string };
const recordsOf = (c: CognitiveCapsule): SemanticRecord[] => [...c.nodes, ...c.statements, ...c.evidence, ...c.knowledge];
const normalize = (v: string) => v.trim().toLocaleLowerCase('en');

/** Prefixing is reversible through recordOrigins even when a long source ID requires hashing. */
function scopedId(prefix: string, original: string): string {
  const readable = `${prefix}:${original}`;
  return readable.length <= 240 ? readable : `${prefix.slice(0, 150)}:${contentDigest(readable).slice(7)}`;
}

/** Compose owned private/open sources without asserting entity equivalence or approving their contents. */
export function composeCognitiveCapsules(sources: CognitiveCapsule[], input: {
  capsuleId: string; version?: string; profile?: CognitiveCapsule['profile']; maxBytes?: number;
}): CognitiveComposition {
  if (sources.length < 2 || sources.length > 10) throw new Error('Composition requires between two and ten source capsules.');
  const maxBytes = input.maxBytes ?? 500_000;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > 500_000) throw new Error('Composition byte budget must be between 1 and 500000.');
  const parents = sources.map((s) => CognitiveCapsuleSchema.parse(s));
  const capsule = CognitiveCapsuleSchema.parse({ schemaVersion: 'cognitive-capsule/vNext', capsuleId: input.capsuleId,
    version: input.version ?? '0.1.0', profile: input.profile ?? 'situation', rights: { mode: 'private' } });
  const parentLocks: CompositionParentLock[] = [];
  const recordOrigins: CompositionRecordOrigin[] = [];
  const indexed: IndexedRecord[] = [];
  const dependencies = new Map<string, CognitiveCapsule['dependencies'][number]>();

  parents.forEach((parent, sourceIndex) => {
    if (['organization', 'licensed'].includes(parent.rights.mode)) throw new Error('Composition requires an explicit rights grant for organization or licensed capsules.');
    if (parent.rights.mode === 'open' && !parent.rights.license) throw new Error('Open composition sources require an explicit license.');
    const sourceIssues = new CognitiveGraph(parent).validate();
    if (sourceIssues.length) throw new Error(`Source capsule ${sourceIndex + 1} has unresolved references: ${sourceIssues.map((i) => i.code).join(', ')}.`);
    const digest = capsuleDigest(parent);
    parentLocks.push({ sourceIndex, capsuleId: parent.capsuleId, version: parent.version, digest, rights: structuredClone(parent.rights) });
    for (const dep of parent.dependencies) {
      const key = canonicalJson([dep.name, dep.version]); const previous = dependencies.get(key);
      if (previous && previous.digest !== dep.digest) throw new Error(`Conflicting exact dependency digest: ${dep.name}@${dep.version}.`);
      dependencies.set(key, structuredClone(dep));
    }
    const prefix = `p${sourceIndex + 1}`;
    const mapping = new Map(recordsOf(parent).map((r) => [r.id, scopedId(prefix, r.id)]));
    const reference = (id: string): string => {
      const target = mapping.get(id);
      if (!target) throw new Error(`Unresolved composition reference in source ${sourceIndex + 1}: ${id}.`);
      return target;
    };
    const references = (ids: string[]) => ids.map(reference);
    const conditions = (values: Condition[]) => values.map((c) => ({ ...c, key: c.kind === 'context' ? c.key : reference(c.key) }));
    const provenance = (value: KnowledgeProvenance, originalId: string): KnowledgeProvenance => {
      const { reviewedBy: _by, reviewedAt: _at, ...authored } = value;
      const inherited = [...new Set(value.derivedFrom.map((ref) => mapping.get(ref) ?? ref))];
      if (inherited.length < 200) inherited.push(`urn:tacitus:parent:${digest.slice(7)}:${contentDigest(originalId).slice(7)}`);
      return { ...authored, sourceRefs: references(value.sourceRefs), derivedFrom: inherited };
    };
    const remember = <T extends SemanticRecord>(original: T, result: T): T => {
      const origin: CompositionRecordOrigin = { id: result.id, sourceIndex, originalId: original.id };
      if ('reviewState' in original) {
        origin.originalReviewState = original.reviewState;
        if (original.provenance.reviewedBy) origin.reviewedBy = structuredClone(original.provenance.reviewedBy);
        if (original.provenance.reviewedAt) origin.reviewedAt = original.provenance.reviewedAt;
      }
      if ('reviewDecision' in original && original.reviewDecision) origin.reviewDecision = original.reviewDecision;
      if ('reviewNote' in original && original.reviewNote) origin.reviewNote = original.reviewNote;
      recordOrigins.push(origin); indexed.push({ record: original, sourceIndex, targetId: result.id }); return result;
    };
    capsule.nodes.push(...parent.nodes.map((n) => remember(n, { ...n, id: reference(n.id), reviewState: 'proposed', provenance: provenance(n.provenance, n.id) })));
    capsule.evidence.push(...parent.evidence.map((e) => remember(e, { ...e, id: reference(e.id) })));
    capsule.statements.push(...parent.statements.map((s) => remember(s, {
      ...s, id: reference(s.id), subject: reference(s.subject), object: 'node' in s.object ? { node: reference(s.object.node) } : s.object,
      conditions: conditions(s.conditions), exceptions: conditions(s.exceptions),
      assertedBy: s.assertedBy ? reference(s.assertedBy) : undefined, addressedTo: references(s.addressedTo), audience: references(s.audience),
      wordingRef: s.wordingRef ? reference(s.wordingRef) : undefined, sourceRefs: references(s.sourceRefs),
      rationaleRef: s.rationaleRef ? reference(s.rationaleRef) : undefined, annotations: references(s.annotations),
      reviewState: 'proposed', provenance: provenance(s.provenance, s.id),
    })));
    for (const original of parent.knowledge) {
      const k = structuredClone(original);
      k.id = reference(k.id); k.reviewState = 'proposed'; delete k.reviewDecision; delete k.reviewNote;
      k.provenance = provenance(k.provenance, original.id);
      switch (k.kind) {
        case 'cue': k.suggests = references(k.suggests); k.examples = references(k.examples); k.onlyWhen = conditions(k.onlyWhen); k.falsePositiveConditions = conditions(k.falsePositiveConditions); break;
        case 'pattern': k.expectedCues = conditions(k.expectedCues); k.optionalCues = conditions(k.optionalCues); k.disconfirmingCues = conditions(k.disconfirmingCues); k.failureConditions = conditions(k.failureConditions); break;
        case 'heuristic': k.when = conditions(k.when); k.exceptions = conditions(k.exceptions); k.attendTo = references(k.attendTo); k.cases = references(k.cases); break;
        case 'exception': k.ruleRefs = references(k.ruleRefs); k.when = conditions(k.when); break;
        case 'redFlag': k.onlyWhen = conditions(k.onlyWhen); break;
        case 'question': k.resolves = references(k.resolves); break;
        case 'languageRule': k.examples = references(k.examples); break;
        case 'revisionTrigger': k.when = conditions(k.when); k.affectedIds = references(k.affectedIds); break;
        case 'case': k.cues = references(k.cues); break;
        case 'distinction': k.expertRefs = k.expertRefs.map((ref) => mapping.get(ref) ?? ref); break;
        case 'procedure': {
          const steps = new Map(k.steps.map((step) => [step.id, scopedId(`${k.id}:step`, step.id)]));
          if (steps.size !== k.steps.length) throw new Error('Composition source has duplicate procedure step IDs.');
          const stepReference = (ref: string) => {
            const target = steps.get(ref); if (!target) throw new Error(`Unresolved procedure step: ${ref}.`); return target;
          };
          const resourceReference = (ref: string) => mapping.get(ref) ?? steps.get(ref) ?? reference(ref);
          k.steps = k.steps.map((step) => ({ ...step, id: stepReference(step.id), requires: step.requires.map(resourceReference), produces: step.produces.map(resourceReference),
            precedes: step.precedes.map(stepReference), branches: conditions(step.branches), stopIf: conditions(step.stopIf), escalateIf: conditions(step.escalateIf) }));
          k.stopConditions = conditions(k.stopConditions); k.escalationConditions = conditions(k.escalationConditions); break;
        }
      }
      capsule.knowledge.push(remember(original, k));
    }
  });
  capsule.dependencies = [...dependencies.values()];
  const result = CognitiveCapsuleSchema.parse(capsule);
  const issues = new CognitiveGraph(result).validate();
  if (issues.length) throw new Error(`Composed graph has unresolved references: ${issues.map((i) => i.code).join(', ')}.`);
  if (Buffer.byteLength(JSON.stringify(result), 'utf8') > maxBytes) throw new Error('Composed capsule exceeds its byte budget. Split the composition.');
  return { capsule: result, parentLocks, conflicts: compositionConflicts(parents, indexed), recordOrigins };
}

/** Reports are candidates for human inspection, never automatic identity resolution or truth judgments. */
function compositionConflicts(parents: CognitiveCapsule[], indexed: IndexedRecord[]): CompositionConflict[] {
  const conflicts: CompositionConflict[] = [];
  const grouped = (key: (r: IndexedRecord) => string | undefined): Map<string, IndexedRecord[]> => {
    const buckets = new Map<string, IndexedRecord[]>();
    for (const row of indexed) { const id = key(row); if (id !== undefined) buckets.set(id, [...(buckets.get(id) ?? []), row]); }
    return buckets;
  };
  const add = (kind: CompositionConflict['kind'], rows: IndexedRecord[], message: string) => conflicts.push({ kind,
    recordIds: rows.map((r) => r.targetId), sourceIndexes: [...new Set(rows.map((r) => r.sourceIndex))], message });
  for (const rows of grouped((r) => r.record.id).values()) if (new Set(rows.map((r) => r.sourceIndex)).size > 1)
    add('semantic-id-collision', rows, 'Source semantic IDs overlap. Their records remain separate; no identity equivalence was inferred.');
  for (const rows of grouped((r) => 'type' in r.record ? canonicalJson([r.record.type, normalize(r.record.label)]) : undefined).values()) if (new Set(rows.map((r) => r.sourceIndex)).size > 1)
    add('entity-overlap', rows, 'Entities have matching type and label. Human review must determine whether they refer to the same entity.');
  const nodeKey = (sourceIndex: number, id: string) => {
    const node = parents[sourceIndex].nodes.find((n) => n.id === id);
    return node ? canonicalJson([node.type, normalize(node.label)]) : `statement:${id}`;
  };
  const conditionKeys = (sourceIndex: number, values: Condition[]) => values.map((c) => ({ ...c,
    key: c.kind === 'node' ? nodeKey(sourceIndex, c.key) : c.key })).sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b), 'en'));
  for (const rows of grouped((r) => 'subject' in r.record ? canonicalJson([nodeKey(r.sourceIndex, r.record.subject), r.record.predicate,
    'node' in r.record.object ? nodeKey(r.sourceIndex, r.record.object.node) : r.record.object.literal,
    conditionKeys(r.sourceIndex, r.record.conditions), conditionKeys(r.sourceIndex, r.record.exceptions)]) : undefined).values()) {
    const positives = rows.filter((r) => 'polarity' in r.record && r.record.polarity === 'positive');
    const negatives = rows.filter((r) => 'polarity' in r.record && r.record.polarity === 'negative');
    if (positives.some((a) => negatives.some((b) => 'subject' in a.record && 'subject' in b.record
      && Date.parse(a.record.validFrom ?? '0001-01-01') <= Date.parse(b.record.validUntil ?? '9999-12-31')
      && Date.parse(b.record.validFrom ?? '0001-01-01') <= Date.parse(a.record.validUntil ?? '9999-12-31'))))
      add('opposing-statements', rows, 'Potentially overlapping claims have opposing polarities. Both are preserved for human review.');
  }
  for (const row of indexed) if ('predicate' in row.record && row.record.predicate === 'CONTRADICTS' && 'node' in row.record.object) {
    const target = indexed.find((other) => other.sourceIndex === row.sourceIndex && other.record.id === ('object' in row.record && 'node' in row.record.object ? row.record.object.node : ''));
    if (target) add('opposing-statements', [row, target], 'The source explicitly records a contradiction. Both records remain proposed.');
  }
  for (const rows of grouped((r) => 'kind' in r.record ? canonicalJson([r.record.kind, normalize(r.record.kind === 'languageRule' ? r.record.expression : r.record.label), [...r.record.scope].sort()]) : undefined).values()) {
    if (new Set(rows.map((r) => r.sourceIndex)).size < 2) continue;
    const meanings = new Set(rows.map((r) => canonicalJson(Object.fromEntries(Object.entries(r.record).filter(([key]) =>
      !['id', 'provenance', 'reviewState', 'reviewDecision', 'reviewNote', 'migrationStatus'].includes(key))))));
    if (meanings.size > 1) add('divergent-rules', rows, 'Similarly named expert rules differ. Preserve their separate scopes, guards and interpretations until a human reconciles them.');
  }
  return conflicts;
}
