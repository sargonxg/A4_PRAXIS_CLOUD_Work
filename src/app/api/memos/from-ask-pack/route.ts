import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  conversationDocumentPackToMemoBlocks,
  type AskDocumentPackOutputTarget,
  type ConversationDocumentPack,
  type SourcePreviewCard,
} from '@/lib/ai/ask-answer-envelope';
import { saveMemoDraft } from '@/lib/firebase/memo-service';
import { saveOutputCapsule, type SaveOutputCapsuleInput } from '@/lib/output-capsules/storage';
import {
  ASK_DOCUMENT_PACK_OUTPUT_TARGET_IDS,
  PACK_PROVENANCE_OUTPUT_TARGET_IDS,
  normalizePolicyOutputTarget,
  outputCapsuleTemplateIdForTarget,
  outputTargetLabel,
  outputTargetStarterHeadings,
  type AskPersistedDocumentPackOutputTarget,
} from '@/lib/policy-work-file/output-targets';

const SourceCardSchema = z.object({
  id: z.string().min(1).max(240),
  title: z.string().min(1).max(500),
  label: z.string().min(1).max(120),
  sourceType: z.string().min(1).max(80),
  url: z.string().url().optional(),
  quotePreview: z.string().max(800),
  documentId: z.string().max(240).optional(),
  chunkId: z.string().max(240).optional(),
  sourceReceiptId: z.string().max(240).optional(),
  pageRef: z.string().max(80).optional(),
  paragraphRef: z.string().max(80).optional(),
  locatorLabel: z.string().max(240).optional(),
  citationLabel: z.string().max(80).optional(),
  sourceReceiptHref: z.string().max(500).optional(),
  extractionFallbackLabel: z.string().max(120).optional(),
  confidence: z.number().min(0).max(1),
});

const PackSchema = z.object({
  title: z.string().min(1).max(300),
  prompt: z.string().max(4000),
  answer: z.string().min(1).max(60000),
  sourceCards: z.array(SourceCardSchema).max(24),
  gaps: z.array(z.string().max(500)).max(24).default([]),
  provenance: z.object({
    capsuleId: z.string().nullable().optional(),
    capsuleVersion: z.number().nullable().optional(),
    conversationId: z.string().nullable().optional(),
    threadId: z.string().nullable().optional(),
    runId: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    provider: z.string().nullable().optional(),
    contextPackageId: z.string().nullable().optional(),
    sourceReceiptIds: z.array(z.string().max(240)).max(100).optional(),
    unsupportedClaims: z.array(z.string().max(1000)).max(50).optional(),
    outputTarget: z.enum(PACK_PROVENANCE_OUTPUT_TARGET_IDS).optional(),
    generatedAt: z.string().optional(),
  }).default({}),
});

const RequestSchema = z.object({
  pack: PackSchema,
  situationId: z.string().min(1).max(200),
  askTurnId: z.string().max(240).optional(),
  outputTarget: z.enum(ASK_DOCUMENT_PACK_OUTPUT_TARGET_IDS).default('policy-memo'),
});

export const POST = withAuth(async (request, user) => {
  try {
    const parsed = RequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Ask document pack', details: parsed.error.flatten() }, { status: 400 });
    }

    const outputTarget = parsed.data.outputTarget;
    const pack = withOutputTarget(parsed.data.pack as ConversationDocumentPack, outputTarget);
    const capsuleReceiptError = validateCapsuleReadReceipt(pack);
    if (capsuleReceiptError) {
      return NextResponse.json({ error: capsuleReceiptError, code: 'capsule_read_receipt_required' }, { status: 400 });
    }

    const blocks = conversationDocumentPackToMemoBlocks(pack);
    if (user.isDemo) {
      return NextResponse.json({
        success: true,
        mode: 'demo-local',
        memo: null,
        blocks,
      });
    }

    const outputCapsuleInput = buildOutputCapsuleInput(pack, parsed.data.situationId, outputTarget);
    const outputCapsule = await saveOutputCapsule(user.uid, outputCapsuleInput);
    if (!outputCapsule) return NextResponse.json({ error: 'ContextCapsule not found for Ask artifact output.' }, { status: 404 });

    const artifactMetadata = buildArtifactMetadata(pack, outputTarget);
    const record = await saveMemoDraft(user.uid, {
      caseId: parsed.data.situationId,
      templateId: 'policy-memo',
      title: pack.title,
      graphSnapshotId: `${parsed.data.situationId}:ask-pack:${parsed.data.askTurnId ?? 'turn'}`,
      blocks,
      status: 'draft',
      changeNote: 'Created from Ask PRAXIS document pack.',
      capsuleId: artifactMetadata.capsuleId,
      capsuleVersion: artifactMetadata.capsuleVersion,
      conversationId: artifactMetadata.conversationId,
      runId: artifactMetadata.runId,
      outputTarget: artifactMetadata.outputTarget,
      sourceReceiptIds: artifactMetadata.sourceReceiptIds,
      sourceReceipts: pack.sourceCards,
      unsupportedClaims: artifactMetadata.unsupportedClaims,
      claimChecks: artifactMetadata.unsupportedClaims.map((claim, index) => ({
        id: `unsupported-${index + 1}`,
        claim,
        status: 'unsupported',
        sourceReceiptIds: artifactMetadata.sourceReceiptIds,
      })),
      outputCapsuleId: outputCapsule.id,
    });

    return NextResponse.json({
      success: true,
      memoId: record.memo.id,
      href: `/app/write?memoId=${encodeURIComponent(record.memo.id)}`,
      ...record,
      outputCapsule,
    });
  } catch (err) {
    return handleRouteError(err, 'memos/from-ask-pack');
  }
});

function withOutputTarget(pack: ConversationDocumentPack, outputTarget: AskDocumentPackOutputTarget): ConversationDocumentPack {
  return {
    ...pack,
    provenance: {
      ...pack.provenance,
      conversationId: pack.provenance.conversationId ?? pack.provenance.threadId ?? null,
      outputTarget,
      generatedAt: pack.provenance.generatedAt ?? new Date().toISOString(),
    },
  };
}

function validateCapsuleReadReceipt(pack: ConversationDocumentPack): string | null {
  const sourceReceiptIds = collectSourceReceiptIds(pack);
  const grounded = sourceReceiptIds.length > 0
    || pack.sourceCards.some((card) => Boolean(card.documentId || card.chunkId || card.url));
  if (!grounded) return null;
  if (!pack.provenance.capsuleId || typeof pack.provenance.capsuleVersion !== 'number') {
    return 'Grounded Ask artifacts require a capsule id and capsule version from the Ask read receipt.';
  }
  return null;
}

function buildOutputCapsuleInput(
  pack: ConversationDocumentPack,
  situationId: string,
  outputTarget: AskPersistedDocumentPackOutputTarget,
): SaveOutputCapsuleInput {
  const metadata = buildArtifactMetadata(pack, outputTarget);
  const policyTarget = normalizePolicyOutputTarget(outputTarget);
  const targetLabel = outputTargetLabel(policyTarget);
  const starterHeadings = outputTargetStarterHeadings(policyTarget);
  const citations = pack.sourceCards.map((card, index) => ({
    id: card.sourceReceiptId ?? card.id ?? `source-${index + 1}`,
    title: card.title,
    ...(card.url ? { uri: card.url } : {}),
    ...(card.sourceReceiptId ? { sourceReceiptId: card.sourceReceiptId } : {}),
    confidence: card.confidence,
  }));
  const citationIds = citations.map((citation) => citation.id);
  const metadataLines = artifactMetadataLines(metadata);
  const unsupportedGaps = metadata.unsupportedClaims.map((claim, index) => ({
    id: `unsupported-${index + 1}`,
    claim,
    reason: 'Ask PRAXIS sourceability review marked this claim as unsupported or unresolved.',
    severity: 'high' as const,
  }));
  const sourceGaps = pack.gaps.map((gap, index) => ({
    id: `gap-${index + 1}`,
    claim: gap,
    reason: 'Ask PRAXIS recorded this as an evidence or review gap.',
    severity: 'medium' as const,
  }));
  return {
    situationId,
    contextCapsuleId: metadata.capsuleId,
    templateId: outputCapsuleTemplateIdForTarget(policyTarget),
    payload: {
      title: pack.title,
      summary: excerpt(pack.answer, 280) || 'Ask PRAXIS artifact created from an assistant response.',
      sections: [
        ...starterHeadings.map((heading, index) => ({
          heading,
          body: index === 0
            ? pack.answer || 'No answer text was captured.'
            : `Draft this ${targetLabel.toLowerCase()} section from the preserved Ask answer, source cards, and gaps.`,
          citationIds: index === 0 ? citationIds : [],
        })),
        { heading: 'Source posture', body: sourcePostureText(pack), citationIds },
        { heading: 'Gaps and unsupported claims', body: [...pack.gaps, ...metadata.unsupportedClaims].join('\n') || 'No gaps or unsupported claims were recorded.', citationIds: [] },
        { heading: 'Artifact metadata', body: metadataLines.join('\n'), citationIds: [] },
      ],
      outputTarget: policyTarget,
      outputTargetLabel: targetLabel,
    },
    citations,
    gaps: [...unsupportedGaps, ...sourceGaps],
    provenance: {
      createdBy: 'ask-praxis',
      toolIds: ['ask-praxis', 'sourceability-reviewer', 'memo-drafter'],
      agentIds: metadata.runId ? ['ask-orchestrated-agent'] : [],
      traceId: [metadata.conversationId, metadata.runId].filter(Boolean).join(':') || metadata.timestamp,
    },
  };
}

function buildArtifactMetadata(pack: ConversationDocumentPack, outputTarget: AskDocumentPackOutputTarget) {
  const policyTarget = normalizePolicyOutputTarget(outputTarget);
  return {
    conversationId: pack.provenance.conversationId ?? pack.provenance.threadId ?? null,
    runId: pack.provenance.runId ?? null,
    capsuleId: pack.provenance.capsuleId ?? null,
    capsuleVersion: pack.provenance.capsuleVersion ?? null,
    sourceReceiptIds: collectSourceReceiptIds(pack),
    unsupportedClaims: pack.provenance.unsupportedClaims ?? [],
    gaps: pack.gaps,
    timestamp: pack.provenance.generatedAt ?? new Date().toISOString(),
    outputTarget: policyTarget,
  };
}

function artifactMetadataLines(metadata: ReturnType<typeof buildArtifactMetadata>): string[] {
  return [
    `conversation id: ${metadata.conversationId ?? 'not recorded'}`,
    `run id: ${metadata.runId ?? 'not queued'}`,
    `capsule: ${metadata.capsuleId ?? 'not recorded'}${metadata.capsuleVersion ? ` v${metadata.capsuleVersion}` : ''}`,
    `source receipt ids: ${metadata.sourceReceiptIds.length ? metadata.sourceReceiptIds.join(', ') : 'none'}`,
    `unsupported claims: ${metadata.unsupportedClaims.length}`,
    `gaps: ${metadata.gaps.length}`,
    `timestamp: ${metadata.timestamp}`,
    `output target: ${metadata.outputTarget}`,
  ];
}

function collectSourceReceiptIds(pack: ConversationDocumentPack): string[] {
  return Array.from(new Set([
    ...(pack.provenance.sourceReceiptIds ?? []),
    ...pack.sourceCards.map((card) => card.sourceReceiptId).filter((id): id is string => Boolean(id)),
  ]));
}

function sourcePostureText(pack: ConversationDocumentPack): string {
  if (!pack.sourceCards.length) return 'No source previews were attached. Treat factual claims as ungrounded until repaired.';
  return pack.sourceCards.map(sourceCardLine).join('\n');
}

function sourceCardLine(card: SourcePreviewCard): string {
  const receipt = card.sourceReceiptId ? ` Source receipt: ${card.sourceReceiptId}.` : '';
  const locator = card.locatorLabel ? ` ${card.locatorLabel}.` : '';
  return `${card.label}: ${card.title}.${locator}${receipt}`;
}

function excerpt(value: string, limit: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, limit);
}
