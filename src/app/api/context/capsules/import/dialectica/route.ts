import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  createCapsule,
  createCapsuleReviewCard,
} from '@/lib/context/capsule-service';
import {
  mapDialecticaExportToPraxisPreview,
  parseDialecticaContextExport,
  type DialecticaClaim,
  type DialecticaContextExport,
} from '@/lib/context/dialectica-context-contract';
import type { ContextCapsuleClaim, ContextCapsuleSourceRef } from '@/lib/context/capsule-v2';

export const dynamic = 'force-dynamic';

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot import DIALECTICA context packages' }, { status: 403 });
    }
    const raw = await request.text();
    if (raw.length > MAX_IMPORT_BYTES) {
      return NextResponse.json({ error: 'DIALECTICA package exceeds the 2MB import limit' }, { status: 413 });
    }
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'DIALECTICA package must be valid JSON' }, { status: 400 });
    }
    const exportPackage = parseDialecticaContextExport(parsedBody);
    const preview = mapDialecticaExportToPraxisPreview(exportPackage);

    const capsule = await createCapsule(user.uid, {
      capsuleId: `dialectica-${exportPackage.packageId}`,
      label: exportPackage.title,
      summary: buildImportSummary(exportPackage),
      scope: 'user',
      community: { tags: ['dialectica', 'verified-context', 'imported'] },
      provenance: {
        source: 'api',
        createdBy: user.uid,
        parentCapsuleId: exportPackage.capsuleId ?? null,
        forkedFromVersion: null,
        notes: `Imported from DIALECTICA context package ${exportPackage.packageId} (exported ${exportPackage.exportedAt}).`,
      },
    });

    const sourceRefs = exportPackage.sourceReceipts.map((receipt): ContextCapsuleSourceRef => ({
      sourceId: receipt.id,
      label: receipt.title,
      url: receipt.url ?? null,
      publisher: receipt.citation ?? null,
    }));
    const claimLedger = exportPackage.claims.map((claim) => mapDialecticaClaim(claim));

    const reviewCard = await createCapsuleReviewCard(user.uid, capsule.capsuleId, {
      title: `Review DIALECTICA import ${exportPackage.packageId}`,
      sourceType: 'intake',
      target: 'claimLedger',
      evidence: exportPackage.sourceReceipts.slice(0, 20).map((receipt) => ({
        id: receipt.id,
        label: receipt.title,
        advisory: true,
        sourceType: 'dialectica',
        url: receipt.url ?? null,
      })),
      proposedEnvelopePatch: {
        summary: buildImportSummary(exportPackage),
        sourceRefs: sourceRefs.map((ref) => ({ ...ref })),
        claimLedger: claimLedger.map((claim) => ({ ...claim })),
      },
    });

    return NextResponse.json({
      capsule,
      imported: true,
      contract: exportPackage.contractVersion,
      preview: {
        packageId: preview.packageId,
        title: preview.title,
        factClaimCount: preview.factClaims.length,
        conflictingClaimCount: preview.conflictingClaims.length,
        evidenceGapCount: preview.evidenceGaps.length,
        assumptionCount: preview.assumptions.length,
        uncertaintyCount: preview.uncertainties.length,
        sourceReceiptCount: preview.sourceReceipts.length,
      },
      reviewCard: { reviewCardId: reviewCard.reviewCardId, state: reviewCard.state },
      proposedRowsRetainedForReview: claimLedger.length + sourceRefs.length,
    }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/import/dialectica');
  }
});

function mapDialecticaClaim(claim: DialecticaClaim): ContextCapsuleClaim {
  const support = claim.kind === 'conflicting_claim'
    ? 'disputed'
    : claim.kind === 'evidence_gap' || claim.sourceIds.length === 0
      ? 'needs_source'
      : 'supported';
  return {
    claimId: claim.id,
    text: claim.text,
    support,
    sourceRefIds: claim.sourceIds,
    ...(claim.kind === 'conflicting_claim' ? { caveat: 'DIALECTICA marked this claim as contested; resolve before final use.' } : {}),
  };
}

function buildImportSummary(exportPackage: DialecticaContextExport): string {
  const counts = [
    `${exportPackage.claims.length} claim${exportPackage.claims.length === 1 ? '' : 's'}`,
    `${exportPackage.sourceReceipts.length} source receipt${exportPackage.sourceReceipts.length === 1 ? '' : 's'}`,
    `${exportPackage.evidenceGaps.length} evidence gap${exportPackage.evidenceGaps.length === 1 ? '' : 's'}`,
  ].join(', ');
  return `Verified-context package imported from DIALECTICA (${counts}). Claims and sources stay review-gated until approved.`;
}
