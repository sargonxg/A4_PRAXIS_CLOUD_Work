import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  createCapsule,
  createCapsuleReviewCard,
  upsertImportedCapsule,
} from '@/lib/context/capsule-service';
import {
  DIALECTICA_CAPSULE_MIMETYPE,
  DialecticaCapsuleImportError,
  buildDialecticaCapsuleImportPlan,
  parseDialecticaCapsulePackageFromParts,
  parseDialecticaCapsuleZip,
  type DialecticaCapsuleParts,
  type DialecticaImportedCapsuleInput,
  type DialecticaParsedCapsulePackage,
} from '@/lib/context/dialectica-capsule-import';
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
    const contentType = request.headers.get('content-type') ?? '';
    if (isDialecticaZipContentType(contentType)) {
      const raw = await request.arrayBuffer();
      if (raw.byteLength > MAX_IMPORT_BYTES) {
        return NextResponse.json({ error: 'DIALECTICA package exceeds the 2MB import limit' }, { status: 413 });
      }
      return importSpec3DialecticaPackage(user.uid, await parseDialecticaCapsuleZip(raw));
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
    if (isSpec3JsonPackage(parsedBody)) {
      return importSpec3DialecticaPackage(user.uid, parseDialecticaCapsulePackageFromParts(jsonPackageParts(parsedBody)));
    }
    return importLegacyDialecticaContextPackage(user.uid, parsedBody);
  } catch (err) {
    if (err instanceof DialecticaCapsuleImportError) {
      return NextResponse.json({
        error: err.message,
        fieldErrors: err.fieldErrors,
        importNotes: err.importNotes,
      }, { status: err.status });
    }
    return handleRouteError(err, 'context/capsules/import/dialectica');
  }
});

async function importSpec3DialecticaPackage(uid: string, parsedPackage: DialecticaParsedCapsulePackage) {
  const importedAt = new Date().toISOString();
  const importContentHash = `sha256:${createHash('sha256').update(parsedPackage.contentHashInput).digest('hex')}`;
  const plan = buildDialecticaCapsuleImportPlan(parsedPackage, {
    ownerUid: uid,
    importedAt,
    importContentHash,
  });
  const importedCapsuleInput: DialecticaImportedCapsuleInput = {
    ...plan.capsuleInput,
    capsuleId: plan.capsuleInput.capsuleId,
    importSource: 'dialectica',
    originalCapsuleId: plan.manifest.capsule_id,
    packageVersion: plan.manifest.version,
    importContentHash,
  };
  const result = await upsertImportedCapsule(uid, importedCapsuleInput);
  const importNotes = uniqueStrings([...plan.importNotes, ...result.importNotes]);
  const reviewCard = await createCapsuleReviewCard(uid, result.capsule.capsuleId, {
    title: `Review DIALECTICA import ${plan.manifest.capsule_id}`,
    sourceType: 'intake',
    target: 'claimLedger',
    evidence: plan.reviewPatch.sourceRefs.slice(0, 20).map((source) => ({
      id: source.sourceId,
      label: source.label,
      advisory: true,
      sourceType: 'dialectica',
      url: source.url ?? null,
    })),
    proposedEnvelopePatch: {
      summary: plan.capsuleInput.summary,
      sourceRefs: plan.reviewPatch.sourceRefs.map((ref) => ({ ...ref })),
      claimLedger: plan.reviewPatch.claimLedger.map((claim) => ({ ...claim })),
      ...(plan.reviewPatch.temporality ? { temporality: plan.reviewPatch.temporality } : {}),
      ...(plan.reviewPatch.ontologyBinding ? { ontologyBinding: plan.reviewPatch.ontologyBinding } : {}),
      ...(plan.reviewPatch.embeddedGraph ? { embeddedGraph: plan.reviewPatch.embeddedGraph } : {}),
    },
  });

  return NextResponse.json({
    capsule: result.capsule,
    imported: true,
    upsert: {
      created: result.created,
      updated: result.updated,
      versionBumped: result.versionBumped,
    },
    contract: plan.manifest.spec_version,
    preview: {
      ...plan.preview,
      importNotes,
    },
    reviewCard: { reviewCardId: reviewCard.reviewCardId, state: reviewCard.state },
    proposedRowsRetainedForReview: plan.proposedRowsRetainedForReview,
  }, { status: result.created ? 201 : 200 });
}

async function importLegacyDialecticaContextPackage(uid: string, parsedBody: unknown) {
    const exportPackage = parseDialecticaContextExport(parsedBody);
    const preview = mapDialecticaExportToPraxisPreview(exportPackage);

    const capsule = await createCapsule(uid, {
      capsuleId: `dialectica-${exportPackage.packageId}`,
      label: exportPackage.title,
      summary: buildImportSummary(exportPackage),
      scope: 'user',
      community: { tags: ['dialectica', 'verified-context', 'imported'] },
      provenance: {
        source: 'api',
        createdBy: uid,
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

    const reviewCard = await createCapsuleReviewCard(uid, capsule.capsuleId, {
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
}

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

function isDialecticaZipContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return normalized.includes(DIALECTICA_CAPSULE_MIMETYPE) || normalized.includes('application/zip');
}

function isSpec3JsonPackage(input: unknown): boolean {
  if (!isRecord(input)) return false;
  const manifest = isRecord(input.manifest) ? input.manifest : input;
  return typeof manifest.capsule_id === 'string' && typeof manifest.spec_version === 'string' && manifest.spec_version.startsWith('3.');
}

function jsonPackageParts(input: unknown): DialecticaCapsuleParts {
  const body = isRecord(input) ? input : {};
  const manifest = isRecord(body.manifest) ? body.manifest : body;
  return {
    manifest,
    claimsJsonl: typeof body.claimsJsonl === 'string'
      ? body.claimsJsonl
      : Array.isArray(body.claims)
        ? body.claims.map((claim) => JSON.stringify(claim)).join('\n')
        : '',
    sourcesJsonl: typeof body.sourcesJsonl === 'string'
      ? body.sourcesJsonl
      : Array.isArray(body.sources)
        ? body.sources.map((source) => JSON.stringify(source)).join('\n')
        : '',
    episodesJson: body.episodesJson ?? body.episodes,
    runtimeJson: body.runtimeJson ?? body.runtime,
    graphJsonld: body.graphJsonld ?? body.graph,
    agentContextMd: typeof body.agentContextMd === 'string' ? body.agentContextMd : null,
    operationsMd: typeof body.operationsMd === 'string' ? body.operationsMd : null,
    mimetype: typeof body.mimetype === 'string' ? body.mimetype : DIALECTICA_CAPSULE_MIMETYPE,
    hasLadybugProjection: body.hasLadybugProjection === true,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
