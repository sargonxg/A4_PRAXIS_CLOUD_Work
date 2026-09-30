import { z } from 'zod';
import {
  bumpCapsuleVersion, createCapsule, getCapsule,
  type CapsuleServiceDeps, type CreateCapsuleInput,
} from '@/lib/context/capsule-service';
import { getDocumentById } from '@/lib/firebase/documents-service';

const SourceDomainSchema = z.string().trim().toLowerCase().max(253)
  .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, 'Use a domain such as un.org, without a URL path.');

// These are bounded author preferences, not enforcement grants or factual assertions.
export const BuilderSourcingPreferencesSchema = z.object({
  mode: z.enum(['live-search', 'corpus', 'skc', 'hybrid']),
  minSourcesPerClaim: z.number().int().min(1).max(10),
  allowedDomains: z.array(SourceDomainSchema).max(30),
  blockedDomains: z.array(SourceDomainSchema).max(30),
  recencyWindowDays: z.number().int().min(1).max(3650).optional(),
  requiredSourceTypes: z.array(z.string().trim().min(1).max(80)).max(12),
  citationStyle: z.enum(['inline', 'footnote', 'source-card']).optional(),
}).strict();

export const BuilderToolPreferencesSchema = z.object({
  recommended: z.array(z.string().trim().min(1).max(120)).max(20),
  policy: z.enum(['suggest', 'manual', 'auto']),
}).strict();

export const CapsuleBuilderDraftSchema = z.object({
  action: z.literal('save-builder-draft'),
  capsuleId: z.string().min(1).max(120).regex(/^[a-z0-9][a-z0-9_.:-]*$/),
  purpose: z.string().trim().min(1).max(4000),
  systemFrame: z.string().trim().max(12000).default(''),
  domain: z.string().trim().min(1).max(120).default('generic'),
  frameworks: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  outputFormat: z.enum(['json', 'markdown', 'report', 'brief']),
  responseJsonSchema: z.record(z.string(), z.unknown())
    .refine((schema) => JSON.stringify(schema).length <= 16000, 'Output schema is too large.').optional(),
  propertyOrdering: z.array(z.string().max(120)).max(40).default([]),
  sourcing: BuilderSourcingPreferencesSchema.optional(),
  tools: BuilderToolPreferencesSchema.optional(),
  situationId: z.string().min(1).max(160).regex(/^[^/\\]+$/).optional(),
  documentIds: z.array(z.string().min(1).max(180).regex(/^[^/\\]+$/)).max(20).default([]),
}).strict();

export type CapsuleBuilderDraftInput = z.infer<typeof CapsuleBuilderDraftSchema>;

export class CapsuleBuilderDraftError extends Error {
  constructor(public readonly status: 404 | 409, message: string) {
    super(message);
    this.name = 'CapsuleBuilderDraftError';
  }
}

/** Save author preferences, not generated factual claims or proposal decisions. */
export async function saveCapsuleBuilderDraft(uid: string, input: CapsuleBuilderDraftInput, deps?: {
  service?: CapsuleServiceDeps;
  readDocument?: typeof getDocumentById;
}) {
  const existing = await getCapsule(uid, input.capsuleId, deps?.service);
  if (existing?.archivedAt) throw new CapsuleBuilderDraftError(409, 'This capsule is archived. Restore or fork it before saving changes.');
  const situationId = existing?.coreRefs.situationCoreId ?? input.situationId;
  if (input.documentIds.length && (!situationId || (input.situationId && input.situationId !== situationId))) {
    throw new CapsuleBuilderDraftError(409, 'These sources belong to a different workspace. Start a separate capsule for them.');
  }
  const readDocument = deps?.readDocument ?? getDocumentById;
  const documents = await Promise.all(input.documentIds.map((documentId) => readDocument(uid, situationId!, documentId)));
  if (documents.some((document, index) => !document || document.id !== input.documentIds[index] || (document.ownerUid && document.ownerUid !== uid))) {
    throw new CapsuleBuilderDraftError(404, 'A source document could not be found in your private workspace. Retry its upload before saving.');
  }

  const builderDraft = {
    purpose: input.purpose, systemFrame: input.systemFrame, domain: input.domain,
    frameworks: input.frameworks, outputFormat: input.outputFormat,
    propertyOrdering: input.propertyOrdering,
    ...(input.responseJsonSchema ? { responseJsonSchema: input.responseJsonSchema } : {}),
    ...(input.sourcing ? { sourcing: input.sourcing } : {}),
    ...(input.tools ? { tools: input.tools } : {}),
  };
  const outputContracts = [
    ...(existing?.outputContracts ?? []).filter((contract) => (
      !contract || typeof contract !== 'object' || (contract as { outputId?: string }).outputId !== 'builder-output'
    )),
    { outputId: 'builder-output', label: `Author-requested ${input.outputFormat}`,
      artifactType: input.outputFormat === 'brief' ? 'brief' : 'other', citationRequired: true, reviewRequired: true },
  ];
  const documentIds = [...new Set([...(existing?.coreRefs.documentCoreIds ?? []), ...input.documentIds])];
  const patch: CreateCapsuleInput = {
    label: input.purpose.slice(0, 160), summary: input.purpose.slice(0, 600),
    outputContracts, memoryPosture: { builderDraft },
    ...(input.documentIds.length ? { coreRefs: { situationCoreId: situationId, documentCoreIds: documentIds } } : {}),
  };
  if (existing) {
    const oldPosture = existing.memoryPosture as { builderDraft?: unknown } | undefined;
    const sameInstructions = JSON.stringify(oldPosture?.builderDraft) === JSON.stringify(builderDraft);
    const sameDocuments = JSON.stringify(existing.coreRefs.documentCoreIds) === JSON.stringify(documentIds);
    if (sameInstructions && sameDocuments) return { capsule: existing, created: false };
    const capsule = await bumpCapsuleVersion(uid, existing.capsuleId, patch, deps?.service);
    if (!capsule) throw new CapsuleBuilderDraftError(404, 'Your capsule could not be found. Reload the library before saving.');
    return { capsule, created: false };
  }
  const capsule = await createCapsule(uid, {
    ...patch, capsuleId: input.capsuleId, scope: 'user', access: { visibility: 'private' },
    latestGateState: 'draft', readinessSummary: { reviewRequired: true },
    community: { tags: ['builder-draft', input.domain] },
    provenance: { source: 'api', createdBy: uid, notes: 'Private author draft. Preferences and supplied sources are not independently verified evidence.' },
  }, deps?.service);
  return { capsule, created: true };
}
