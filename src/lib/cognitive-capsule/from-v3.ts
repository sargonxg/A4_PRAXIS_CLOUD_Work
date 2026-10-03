import type { ContextCapsuleV3 } from '@/lib/context/capsule-v3';
import { CognitiveCapsuleSchema, CognitiveNodeSchema, CognitiveStatementSchema, EvidenceSpanSchema, KnowledgeSchema, createCognitiveCapsule } from './schema';
import type { CognitiveCapsule } from './types';

/** A reversible read adapter, never a database migration or evidence of expert review. */
export function fromV3(v3: ContextCapsuleV3): CognitiveCapsule {
  const c = createCognitiveCapsule(v3.identity.capsuleId, `${v3.identity.capsuleVersion}.0.0`);
  c.legacy = { capsuleVersion: v3.identity.capsuleVersion, schemaVersion: 3 };
  const at = Number.isFinite(Date.parse(v3.identity.updatedAt)) ? new Date(v3.identity.updatedAt).toISOString() : '1970-01-01T00:00:00Z';
  const provenance = { generatedBy: { type: 'import', id: `legacy-v3:${v3.identity.capsuleId}`, at }, sourceRefs: [], confidenceKind: 'imported' };
  const scope = v3.businessUseCase.domainTags.length ? v3.businessUseCase.domainTags.slice(0, 30) : ['general'];
  const base = (id: string, label: string) => ({ id, label: label.slice(0, 4000), scope, provenance, reviewState: 'proposed', migrationStatus: 'needs_review' });
  for (const [field, entries] of Object.entries(v3.humanTacitKnowledge)) {
    entries.forEach((raw: string, index: number) => {
      const label = raw.trim().slice(0, 4000); if (!label) return;
      const common = base(`legacy:${field}:${index}`, label);
      const k = field === 'practicalHeuristics' ? { ...common, kind: 'heuristic', interpretation: label, rationale: 'Imported prose; an expert rationale and applicability conditions have not been supplied.' }
        : field === 'institutionalHabits' ? { ...common, kind: 'pattern', interpretation: label }
          : field === 'redLines' || field === 'approvalPolitics' || field === 'hiddenConstraints' ? { ...common, kind: 'redFlag', description: label, possibleSignificance: 'Legacy constraint or sensitivity; scope and exceptions require expert review.' }
            : field === 'caveats' ? { ...common, kind: 'exception', explanation: label }
              : field === 'recurringDecisions' ? { ...common, kind: 'procedure', purpose: label }
                : field === 'workingAssumptions' ? { ...common, kind: 'unknown', description: label }
                  : { ...common, kind: 'cue', description: label };
      c.knowledge.push(KnowledgeSchema.parse(k));
    });
  }
  v3.sourceSpine.sourceGaps.forEach((gap, i) => c.knowledge.push(KnowledgeSchema.parse({ ...base(`legacy:sourceGap:${i}`, gap), kind: 'unknown', description: gap, requiredEvidence: [gap] })));
  const graph = v3.grounding.embeddedGraph;
  for (const node of graph.nodes) c.nodes.push(CognitiveNodeSchema.parse({ id: `legacy-node:${node.id}`, type: `aco:${node.entityType}`, label: node.label,
    layer: 'world', reviewState: 'proposed', provenance: { ...provenance, derivedFrom: [node.id] } }));
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    // Missing identity intervals stay explicit questions instead of invalid identity assertions.
    const predicate = edge.relationshipType || edge.label;
    const temporalIdentity = ['ALIAS_OF', 'FORMERLY_KNOWN_AS', 'SPLINTERED_FROM', 'MERGED_INTO', 'INTEGRATED_INTO', 'DISSOLVED_INTO', 'MEMBER_OF', 'AFFILIATED_WITH'].includes(predicate);
    if (temporalIdentity) {
      c.knowledge.push(KnowledgeSchema.parse({ ...base(`legacy-edge-gap:${edge.id}`, `Review identity relation: ${predicate}`), kind: 'question',
        question: `When did ${edge.source} ${predicate} ${edge.target}?`, whyItMatters: 'Legacy graph edge has no explicit identity validity interval.', requiredEvidence: [edge.label] }));
      continue;
    }
    c.statements.push(CognitiveStatementSchema.parse({ id: `legacy-edge:${edge.id}`, subject: `legacy-node:${edge.source}`, predicate,
      object: { node: `legacy-node:${edge.target}` }, layer: 'world', polarity: 'positive', reviewState: 'proposed', provenance: { ...provenance, derivedFrom: [edge.id] } }));
  }
  for (const claim of v3.claimLedger.allClaims) {
    const refs: string[] = [];
    claim.receipts.forEach((r, i) => {
      const id = `legacy-span:${claim.claimId}:${i}`;
      const parsed = EvidenceSpanSchema.safeParse({ id, sourceId: r.sourceId, sourceVersion: r.date || 'legacy-unspecified', quote: r.snippet,
        ...(r.url ? { uri: r.url } : {}), ...(r.page ? { page: r.page } : {}),
        ...(r.charOffset && r.charOffset.end > r.charOffset.start ? { start: r.charOffset.start, end: r.charOffset.end } : {}),
        anchorStatus: 'excerpt', stance: r.stance || 'supports' });
      if (parsed.success) { c.evidence.push(parsed.data); refs.push(id); }
    });
    const subject = `legacy-claim:${claim.claimId}`;
    c.nodes.push(CognitiveNodeSchema.parse({ id: subject, type: 'epistemic:Claim', label: claim.text, layer: 'epistemic', reviewState: 'proposed', provenance }));
    c.statements.push(CognitiveStatementSchema.parse({ id: `legacy-assertion:${claim.claimId}`, subject, predicate: 'LEGACY_REPORTED_CLAIM', object: { literal: claim.text },
      layer: 'epistemic', polarity: 'positive', modality: claim.support === 'supported' ? 'asserted' : 'possible', sourceRefs: refs,
      ...(validDate(claim.validFrom) ? { validFrom: claim.validFrom } : {}), ...(validDate(claim.validUntil) ? { validUntil: claim.validUntil } : {}),
      reviewState: 'proposed', provenance: { ...provenance, sourceRefs: refs } }));
  }
  return CognitiveCapsuleSchema.parse(c);
}
function validDate(v: string | null): v is string { return Boolean(v && /^\d{4}-\d{2}-\d{2}/.test(v) && Number.isFinite(Date.parse(v))); }
