import { z } from 'zod';
import type { LightweightContextCoreLite } from '@/lib/context/context-core-lite';

export const DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION = '2026-05-15.prx-dialectica-context.v1';

export const DialecticaClaimSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['fact', 'evidence_gap', 'conflicting_claim']),
  text: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).default([]),
});

export const DialecticaSourceReceiptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  citation: z.string().optional(),
  excerpt: z.string().optional(),
});

export const DialecticaContextExportSchema = z.object({
  contractVersion: z.literal(DIALECTICA_PRAXIS_CONTEXT_CONTRACT_VERSION),
  packageId: z.string().min(1),
  exportedAt: z.string().datetime(),
  title: z.string().min(1),
  situationCoreId: z.string().min(1).optional(),
  userCoreId: z.string().min(1).optional(),
  capsuleId: z.string().min(1).optional(),
  contextPackageId: z.string().min(1).optional(),
  claims: z.array(DialecticaClaimSchema).default([]),
  assumptions: z.array(z.string().min(1)).default([]),
  uncertainties: z.array(z.string().min(1)).default([]),
  evidenceGaps: z.array(z.string().min(1)).default([]),
  sourceReceipts: z.array(DialecticaSourceReceiptSchema).default([]),
});

export type DialecticaClaim = z.infer<typeof DialecticaClaimSchema>;
export type DialecticaSourceReceipt = z.infer<typeof DialecticaSourceReceiptSchema>;
export type DialecticaContextExport = z.infer<typeof DialecticaContextExportSchema>;

export interface DialecticaPraxisImportPreview {
  packageId: string;
  title: string;
  factClaims: DialecticaClaim[];
  evidenceGaps: string[];
  conflictingClaims: DialecticaClaim[];
  assumptions: string[];
  uncertainties: string[];
  sourceRefs: string[];
  sourceReceipts: DialecticaSourceReceipt[];
  exportedAt: string;
}

export function parseDialecticaContextExport(input: unknown): DialecticaContextExport {
  return DialecticaContextExportSchema.parse(input);
}

export function mapDialecticaExportToPraxisPreview(input: DialecticaContextExport): DialecticaPraxisImportPreview {
  const factClaims = input.claims.filter((claim) => claim.kind === 'fact');
  const evidenceGapClaims = input.claims.filter((claim) => claim.kind === 'evidence_gap');
  const conflictingClaims = input.claims.filter((claim) => claim.kind === 'conflicting_claim');
  const explicitGaps = input.evidenceGaps;

  return {
    packageId: input.packageId,
    title: input.title,
    factClaims,
    evidenceGaps: [
      ...explicitGaps,
      ...evidenceGapClaims.map((claim) => claim.text),
    ],
    conflictingClaims,
    assumptions: input.assumptions,
    uncertainties: input.uncertainties,
    sourceRefs: input.sourceReceipts.map((receipt) => receipt.id),
    sourceReceipts: input.sourceReceipts,
    exportedAt: input.exportedAt,
  };
}

export function mapDialecticaExportToContextCoreLite(input: DialecticaContextExport): Partial<LightweightContextCoreLite> {
  const preview = mapDialecticaExportToPraxisPreview(input);
  return {
    id: input.contextPackageId ?? input.packageId,
    title: input.title,
    situationCoreId: input.situationCoreId ?? '',
    userCoreId: input.userCoreId ?? null,
    capsuleId: input.capsuleId ?? '',
    contextPackageId: input.contextPackageId ?? input.packageId,
    sourceRefs: preview.sourceRefs,
    assumptions: preview.assumptions,
    gaps: [
      ...preview.evidenceGaps,
      ...preview.conflictingClaims.map((claim) => `Conflicting claim: ${claim.text}`),
      ...preview.uncertainties.map((uncertainty) => `Uncertainty: ${uncertainty}`),
    ],
  };
}
