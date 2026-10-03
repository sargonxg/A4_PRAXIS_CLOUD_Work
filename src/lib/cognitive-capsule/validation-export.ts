import { CognitiveCapsuleSchema } from './schema';
import type { CognitiveCapsule } from './types';

/** Small RDF projection for portable constraints, separate from the canonical record JSON-LD. */
export function cognitiveConstraintProjection(value: CognitiveCapsule) {
  const capsule = CognitiveCapsuleSchema.parse(value);
  const prefix = `urn:tacitus:capsule:${encodeURIComponent(capsule.capsuleId)}:`;
  const iri = (id: string) => ({ '@id': prefix + encodeURIComponent(id) });
  const records: Array<Record<string, unknown>> = [];
  for (const record of [...capsule.nodes, ...capsule.statements, ...capsule.knowledge]) records.push({ ...iri(record.id), recordId: record.id });
  for (const node of capsule.nodes.filter(node => node.type === 'aco:Commitment' && node.reviewState === 'accepted')) {
    const actors = capsule.statements.filter(statement => statement.reviewState === 'accepted' && 'node' in statement.object).flatMap(statement => {
      const target = 'node' in statement.object ? statement.object.node : '';
      const candidate = statement.subject === node.id && ['COMMITTED_BY', 'HAS_ACTOR'].includes(statement.predicate) ? target
        : target === node.id && ['COMMITS', 'MAKES_COMMITMENT'].includes(statement.predicate) ? statement.subject : '';
      return capsule.nodes.some(actor => actor.id === candidate && actor.type === 'aco:Actor') ? [iri(candidate)] : [];
    });
    records.push({ ...iri(node.id), '@type': 'AcceptedCommitment', actor: actors });
  }
  for (const statement of capsule.statements) {
    const types: string[] = [];
    if (statement.speechAct) types.push('SpeechAct');
    if (statement.reviewState === 'accepted' && ['world', 'epistemic', 'temporal'].includes(statement.layer)) types.push('EvidenceBoundClaim');
    if (['ALIAS_OF', 'FORMERLY_KNOWN_AS', 'SPLINTERED_FROM', 'MERGED_INTO', 'INTEGRATED_INTO', 'DISSOLVED_INTO', 'MEMBER_OF', 'AFFILIATED_WITH'].includes(statement.predicate)) types.push('ActorIdentityRelation');
    if (types.length) records.push({ ...iri(statement.id), '@type': types, ...(statement.assertedBy ? { speaker: iri(statement.assertedBy) } : {}),
      evidence: statement.sourceRefs.map(iri), ...(statement.validFrom ? { validFrom: statement.validFrom } : {}) });
  }
  for (const knowledge of capsule.knowledge.filter(knowledge => knowledge.kind === 'heuristic' && knowledge.reviewState === 'accepted')) {
    if (knowledge.kind === 'heuristic') records.push({ ...iri(knowledge.id), '@type': 'AcceptedHeuristic',
      applicability: knowledge.when.map((condition, index) => ({ '@id': `${prefix}${encodeURIComponent(knowledge.id)}:condition:${index}`, key: condition.key, operator: condition.operator })),
      rationale: knowledge.rationale });
  }
  for (const evidence of capsule.evidence) records.push({ ...iri(evidence.id), '@type': 'EvidenceSpan', recordId: evidence.id, sourceId: evidence.sourceId, sourceVersion: evidence.sourceVersion, quote: evidence.quote });
  return { '@context': { '@vocab': 'https://tacitus.me/ns/constraints#' }, '@graph': records };
}

/** SHACL Core constraints for the corresponding projection; no RDF store is required. */
export function cognitiveShaclShapes(): string {
  return `@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix cc: <https://tacitus.me/ns/constraints#> .
cc:CommitmentShape a sh:NodeShape ; sh:targetClass cc:AcceptedCommitment ;
  sh:property [ sh:path cc:actor ; sh:minCount 1 ; sh:nodeKind sh:IRI ; sh:node cc:ReferenceShape ] .
cc:SpeechActShape a sh:NodeShape ; sh:targetClass cc:SpeechAct ;
  sh:property [ sh:path cc:speaker ; sh:minCount 1 ; sh:maxCount 1 ; sh:nodeKind sh:IRI ; sh:node cc:ReferenceShape ] .
cc:ReferenceShape a sh:NodeShape ;
  sh:property [ sh:path cc:recordId ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ; sh:minLength 1 ] .
cc:HeuristicShape a sh:NodeShape ; sh:targetClass cc:AcceptedHeuristic ;
  sh:property [ sh:path cc:applicability ; sh:minCount 1 ] ;
  sh:property [ sh:path cc:rationale ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ; sh:minLength 1 ] .
cc:EvidenceBoundClaimShape a sh:NodeShape ; sh:targetClass cc:EvidenceBoundClaim ;
  sh:property [ sh:path cc:evidence ; sh:minCount 1 ; sh:nodeKind sh:IRI ; sh:node cc:EvidenceSpanShape ] .
cc:EvidenceSpanShape a sh:NodeShape ; sh:targetClass cc:EvidenceSpan ;
  sh:property [ sh:path cc:sourceId ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ; sh:minLength 1 ] ;
  sh:property [ sh:path cc:sourceVersion ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ; sh:minLength 1 ] ;
  sh:property [ sh:path cc:quote ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ; sh:minLength 1 ] .
cc:ActorIdentityShape a sh:NodeShape ; sh:targetClass cc:ActorIdentityRelation ;
  sh:property [ sh:path cc:validFrom ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ; sh:pattern "^[0-9]{4}-[0-9]{2}-[0-9]{2}" ] .
`;
}
