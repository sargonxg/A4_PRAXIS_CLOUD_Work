import { CognitiveCapsuleSchema, CognitiveNodeSchema, CognitiveStatementSchema, KnowledgeSchema } from './schema';
import type { CognitiveCapsule, CognitiveNode, CognitiveStatement, Condition, EvidenceSpan, ExpertHeuristic, Knowledge } from './types';

export type ValidationIssue = { code: string; id: string; message: string };
export type ContextFacts = Record<string, string | number | boolean>;
/** Unknown conditions never count as evidence of either presence or absence. */
export function conditionMatches(c: Condition, facts: ContextFacts): boolean {
  if (!Object.prototype.hasOwnProperty.call(facts, c.key)) return false;
  const v = facts[c.key];
  return c.operator === 'equals' ? v === c.value : c.operator === 'present' ? v === true : v === false;
}
export function withinTime(v: { validFrom?: string; validUntil?: string }, asOf: string): boolean {
  const at = Date.parse(asOf);
  if (!Number.isFinite(at)) throw new Error('Context date must be valid.');
  return (!v.validFrom || Date.parse(v.validFrom) <= at) && (!v.validUntil || Date.parse(v.validUntil) >= at);
}
export function withinScope(scopes: string[], scope: string): boolean { return scopes.includes(scope) || scopes.includes('general'); }

export class CognitiveGraph {
  private capsule: CognitiveCapsule;
  constructor(capsule: unknown) { this.capsule = CognitiveCapsuleSchema.parse(capsule); }
  toCapsule(): CognitiveCapsule { return structuredClone(this.capsule); }
  addNode(value: CognitiveNode): void {
    const node = CognitiveNodeSchema.parse(value);
    if (this.ids().has(node.id)) throw new Error(`Duplicate semantic ID: ${node.id}`);
    this.capsule.nodes.push(node);
  }
  addStatement(value: CognitiveStatement): void {
    const statement = CognitiveStatementSchema.parse(value);
    if (this.ids().has(statement.id)) throw new Error(`Duplicate semantic ID: ${statement.id}`);
    if (!this.getNode(statement.subject) || ('node' in statement.object && !this.getNode(statement.object.node))) throw new Error('Statement references a missing node.');
    this.capsule.statements.push(statement);
  }
  getNode(id: string): CognitiveNode | undefined { const n = this.capsule.nodes.find((n) => n.id === id); return n ? structuredClone(n) : undefined; }
  getStatements(nodeId?: string): CognitiveStatement[] {
    return structuredClone(this.capsule.statements.filter((s) => !nodeId || s.subject === nodeId || ('node' in s.object && s.object.node === nodeId)));
  }
  findSupportingEvidence(statementId: string): EvidenceSpan[] {
    const refs = this.capsule.statements.find((s) => s.id === statementId)?.sourceRefs ?? [];
    return structuredClone(this.capsule.evidence.filter((e) => refs.includes(e.id) && ['supports', 'qualifies', 'mixed'].includes(e.stance)));
  }
  findContradictions(statementId: string): CognitiveStatement[] {
    const target = this.capsule.statements.find((s) => s.id === statementId);
    if (!target) return [];
    return structuredClone(this.capsule.statements.filter((s) => s.id !== target.id && (
      (s.predicate === 'CONTRADICTS' && 'node' in s.object && s.object.node === target.id)
      || (s.subject === target.subject && s.predicate === target.predicate && JSON.stringify(s.object) === JSON.stringify(target.object) && s.polarity !== target.polarity)
    )));
  }
  findApplicableHeuristics(facts: ContextFacts, scope: string, asOf = new Date().toISOString()): ExpertHeuristic[] {
    return structuredClone(this.capsule.knowledge.filter((k): k is ExpertHeuristic => k.kind === 'heuristic'
      && k.reviewState === 'accepted' && withinScope(k.scope, scope) && withinTime(k, asOf)
      && k.when.length > 0 && k.when.every((c) => conditionMatches(c, facts))
      && !k.exceptions.some((c) => conditionMatches(c, facts))));
  }
  findLanguageRules(expression: string, scope: string, asOf = new Date().toISOString()) {
    return structuredClone(this.capsule.knowledge.filter((k) => k.kind === 'languageRule' && k.reviewState === 'accepted'
      && withinScope(k.scope, scope) && withinTime(k, asOf) && expression.toLocaleLowerCase().includes(k.expression.toLocaleLowerCase())));
  }
  findCases(scope: string, dimensions: string[] = [], asOf = new Date().toISOString()) {
    return structuredClone(this.capsule.knowledge.filter((k) => k.kind === 'case' && k.reviewState === 'accepted' && withinScope(k.scope, scope)
      && withinTime(k, asOf) && (!dimensions.length || dimensions.every((d) => k.analogyDimensions.includes(d)))
      && !dimensions.some((d) => k.nonTransferableDimensions.includes(d))));
  }
  validate(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const seen = new Set<string>();
    const spans = new Set(this.capsule.evidence.map((e) => e.id));
    const nodes = new Map(this.capsule.nodes.map((n) => [n.id, n]));
    const statements = new Set(this.capsule.statements.map((s) => s.id));
    const records = [...this.capsule.nodes, ...this.capsule.statements, ...this.capsule.evidence, ...this.capsule.knowledge];
    const add = (code: string, id: string, message: string) => issues.push({ code, id, message });
    for (const r of records) {
      if (seen.has(r.id)) add('duplicate-id', r.id, 'Semantic IDs must be unique across all layers.');
      seen.add(r.id);
      if ('provenance' in r) for (const e of r.provenance.sourceRefs) if (!spans.has(e)) add('missing-evidence', r.id, `Missing evidence span ${e}.`);
    }
    for (const s of this.capsule.statements) {
      if (!nodes.has(s.subject) && !statements.has(s.subject)) add('missing-node', s.id, `Missing subject ${s.subject}.`);
      if ('node' in s.object && !nodes.has(s.object.node) && !statements.has(s.object.node)) add('missing-node', s.id, `Missing object ${s.object.node}.`);
      for (const ref of [s.wordingRef, ...s.sourceRefs].filter((v): v is string => Boolean(v))) if (!spans.has(ref)) add('missing-evidence', s.id, `Missing evidence span ${ref}.`);
      for (const ref of [s.assertedBy, s.rationaleRef, ...s.addressedTo, ...s.audience].filter((v): v is string => Boolean(v))) if (!seen.has(ref)) add('missing-reference', s.id, `Missing annotation reference ${ref}.`);
      for (const c of [...s.conditions, ...s.exceptions]) if (c.kind !== 'context' && !seen.has(c.key)) add('missing-reference', s.id, `Missing condition ${c.key}.`);
    }
    for (const n of this.capsule.nodes) if (n.type === 'aco:Commitment' && n.reviewState === 'accepted' && !this.capsule.statements.some((s) =>
      s.reviewState === 'accepted' && ((s.subject === n.id && ['COMMITTED_BY', 'HAS_ACTOR'].includes(s.predicate) && 'node' in s.object && nodes.get(s.object.node)?.type === 'aco:Actor')
        || ('node' in s.object && s.object.node === n.id && ['COMMITS', 'MAKES_COMMITMENT'].includes(s.predicate) && nodes.get(s.subject)?.type === 'aco:Actor'))))
      add('commitment-without-actor', n.id, 'An accepted commitment requires a linked actor.');
    for (const k of this.capsule.knowledge) {
      const refs: string[] = k.kind === 'heuristic' ? [...k.attendTo, ...k.cases] : k.kind === 'cue' ? [...k.suggests, ...k.examples]
        : k.kind === 'exception' ? k.ruleRefs : k.kind === 'question' ? k.resolves : k.kind === 'revisionTrigger' ? k.affectedIds : k.kind === 'case' ? k.cues : [];
      for (const ref of refs) if (!seen.has(ref)) add('missing-reference', k.id, `Missing knowledge reference ${ref}.`);
      if (k.kind === 'languageRule') for (const ref of k.examples) if (!spans.has(ref)) add('missing-evidence', k.id, `Missing example span ${ref}.`);
      if (k.kind === 'procedure') {
        const stepIds = new Set(k.steps.map((s) => s.id));
        for (const s of k.steps) for (const ref of s.precedes) if (!stepIds.has(ref)) add('missing-step', k.id, `Missing procedure step ${ref}.`);
      }
    }
    return issues;
  }
  toJsonLd(): Record<string, unknown> {
    const prefix = `urn:tacitus:capsule:${encodeURIComponent(this.capsule.capsuleId)}:`;
    const rows = (items: Array<CognitiveNode | CognitiveStatement | EvidenceSpan | Knowledge>, type: string) => items.map((r) => ({
      '@id': prefix + encodeURIComponent(r.id), '@type': type, label: 'label' in r ? r.label : 'quote' in r ? r.quote : r.predicate,
      ...('layer' in r ? { layer: r.layer } : {}), ...('reviewState' in r ? { reviewState: r.reviewState } : {}),
      ...('subject' in r ? { subject: { '@id': prefix + encodeURIComponent(r.subject) }, predicate: r.predicate,
        object: 'node' in r.object ? { '@id': prefix + encodeURIComponent(r.object.node) } : { '@value': r.object.literal },
        evidence: r.sourceRefs.map((id) => ({ '@id': prefix + encodeURIComponent(id) })) } : {}),
      record: { '@value': structuredClone(r), '@type': '@json' },
    }));
    const { nodes: _nodes, statements: _statements, evidence: _evidence, knowledge: _knowledge, ...metadata } = this.capsule;
    return { '@context': { '@vocab': 'https://tacitus.me/ns/cognitive#', aco: 'https://tacitus.me/ns/aco#', prov: 'http://www.w3.org/ns/prov#', oa: 'http://www.w3.org/ns/oa#' },
      '@id': prefix, '@type': 'CognitiveCapsule', metadata: { '@value': metadata, '@type': '@json' },
      '@graph': [...rows(this.capsule.nodes, 'Node'), ...rows(this.capsule.statements, 'Statement'), ...rows(this.capsule.evidence, 'EvidenceSpan'), ...rows(this.capsule.knowledge, 'ExpertKnowledge')],
    };
  }
  static fromJsonLd(value: unknown): CognitiveGraph {
    const v = value as { '@type'?: string; metadata?: { '@value'?: object }; '@graph'?: Array<{ '@type': string; record: { '@value': unknown } }> };
    if (v?.['@type'] !== 'CognitiveCapsule' || !v.metadata?.['@value'] || !Array.isArray(v['@graph'])) throw new Error('Not a TACITUS cognitive JSON-LD projection.');
    const groups: Record<string, unknown[]> = { Node: [], Statement: [], EvidenceSpan: [], ExpertKnowledge: [] };
    for (const r of v['@graph']) {
      if (!groups[r['@type']] || !r.record || !Object.prototype.hasOwnProperty.call(r.record, '@value')) throw new Error('Unknown JSON-LD record type.');
      groups[r['@type']].push(r.record['@value']);
    }
    const graph = new CognitiveGraph({ ...v.metadata['@value'], nodes: groups.Node, statements: groups.Statement, evidence: groups.EvidenceSpan, knowledge: groups.ExpertKnowledge });
    if (graph.validate().length) throw new Error('JSON-LD projection contains unresolved semantic references.');
    return graph;
  }
  private ids(): Set<string> { return new Set([...this.capsule.nodes, ...this.capsule.statements, ...this.capsule.evidence, ...this.capsule.knowledge].map((r) => r.id)); }
}
