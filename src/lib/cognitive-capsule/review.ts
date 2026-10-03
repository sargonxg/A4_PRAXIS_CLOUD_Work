import { KnowledgeSchema, ProvenanceActorSchema } from './schema';
import type { Knowledge, ProvenanceActor } from './types';

export function proposeKnowledge(value: unknown, generatedBy: ProvenanceActor): Knowledge {
  const body = KnowledgeSchema.parse(value);
  const { reviewedBy: _reviewer, reviewedAt: _at, ...provenance } = body.provenance;
  return KnowledgeSchema.parse({ ...body, reviewState: 'proposed', reviewDecision: undefined, reviewNote: undefined,
    provenance: { ...provenance, generatedBy: ProvenanceActorSchema.parse(generatedBy) } });
}
export function decideKnowledge(value: Knowledge, input: {
  decision: 'accept' | 'edit_accept' | 'reject' | 'need_evidence'; reviewer: ProvenanceActor; reason: string; edited?: unknown;
}): Knowledge {
  const reviewer = ProvenanceActorSchema.parse(input.reviewer);
  if (reviewer.type !== 'human') throw new Error('Only a human can decide expert proposals.');
  if (!input.reason.trim()) throw new Error('Record a review reason.');
  if (['rejected', 'superseded'].includes(value.reviewState)) throw new Error('This proposal is already closed.');
  const edited = input.edited ? KnowledgeSchema.parse(input.edited) : value;
  if (edited.id !== value.id || edited.kind !== value.kind) throw new Error('Editing a proposal cannot change its identity or kind.');
  const accepted = input.decision === 'accept' || input.decision === 'edit_accept';
  const result = KnowledgeSchema.parse({ ...edited,
    reviewState: accepted ? 'accepted' : input.decision === 'reject' ? 'rejected' : 'proposed',
    reviewDecision: input.decision, reviewNote: input.reason,
    // The human must explicitly edit a migration to supply real structure.
    migrationStatus: input.decision === 'edit_accept' ? 'native' : edited.migrationStatus,
    provenance: { ...edited.provenance, generatedBy: value.provenance.generatedBy, reviewedBy: reviewer, reviewedAt: reviewer.at },
  });
  return result;
}
