import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getDocumentById } from '@/lib/firebase/documents-service';
import { getProModel, hasServerAiProvider } from '@/lib/ai/providers';
import {
  getKnowledgeDocument,
  markKnowledgeDocumentSummaryFailed,
  saveKnowledgeDocumentDigest,
  upsertKnowledgeDocument,
} from '@/lib/knowledge/library-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type RouteContext = { params: Promise<{ documentId: string }> };

const SummarizeRequestSchema = z.object({
  situationId: z.string().min(1).max(160).optional(),
  repositoryId: z.string().min(1).max(160).optional(),
  capsuleIds: z.array(z.string().max(160)).max(20).optional(),
});

const KnowledgeDigestSchema = z.object({
  shortSummary: z.string().max(500),
  analystSummary: z.string().max(3000),
  keyClaims: z.array(z.string().max(240)).max(12),
  actors: z.array(z.string().max(120)).max(20),
  institutions: z.array(z.string().max(120)).max(20),
  dates: z.array(z.string().max(80)).max(20),
  causalLinks: z.array(z.string().max(240)).max(12),
  humanFrictionSignals: z.array(z.string().max(240)).max(12),
  policyRelevance: z.array(z.string().max(240)).max(12),
  sourceabilityWarnings: z.array(z.string().max(240)).max(12),
  suggestedCapsuleIds: z.array(z.string().max(160)).max(20),
  suggestedTags: z.array(z.string().max(48)).max(20),
  followUpQuestions: z.array(z.string().max(240)).max(12),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot summarize private knowledge documents' }, { status: 403 });
    }
    if (!hasServerAiProvider()) {
      return NextResponse.json({ error: 'AI provider is not configured for document digestion' }, { status: 503 });
    }
    const { documentId } = await context.params;
    const parsed = SummarizeRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid summarize request', details: parsed.error.flatten() }, { status: 400 });
    }

    let knowledgeDocument = await getKnowledgeDocument(user.uid, documentId);
    if (!knowledgeDocument && parsed.data.situationId) {
      knowledgeDocument = await upsertKnowledgeDocument(user.uid, {
        documentId,
        situationId: parsed.data.situationId,
        repositoryIds: parsed.data.repositoryId ? [parsed.data.repositoryId] : undefined,
        capsuleIds: parsed.data.capsuleIds,
      });
    }
    if (!knowledgeDocument) return NextResponse.json({ error: 'Knowledge document not found' }, { status: 404 });

    const storedDocument = await getDocumentById(user.uid, knowledgeDocument.situationId, knowledgeDocument.documentId);
    if (!storedDocument?.text?.trim()) {
      return NextResponse.json({ error: 'Document has no extracted text to summarize' }, { status: 400 });
    }

    try {
      const { output } = await generateText({
        model: getProModel(),
        output: Output.object({ schema: KnowledgeDigestSchema }),
        prompt: buildDigestPrompt({
          title: storedDocument.title,
          fileType: storedDocument.fileType,
          categoryId: knowledgeDocument.categoryId,
          policyDomain: knowledgeDocument.policyDomain,
          capsuleIds: knowledgeDocument.capsuleIds,
          text: storedDocument.text.slice(0, 60000),
        }),
      });
      const updated = await saveKnowledgeDocumentDigest(user.uid, knowledgeDocument.id, {
        ...output,
        model: 'vertex-gemini',
      });
      return NextResponse.json({ document: updated, digest: updated?.digest });
    } catch (err) {
      await markKnowledgeDocumentSummaryFailed(user.uid, knowledgeDocument.id).catch(() => undefined);
      throw err;
    }
  } catch (err) {
    return handleRouteError(err, 'knowledge/documents/summarize');
  }
});

function buildDigestPrompt(input: {
  title: string;
  fileType: string;
  categoryId: string;
  policyDomain: string;
  capsuleIds: string[];
  text: string;
}): string {
  return `You are PRAXIS by TACITUS, preparing a document for a policy team's private knowledge library.

Return a compact structured digest. Stay grounded only in the document text. Do not invent citations, people, dates, or facts. If a field is not evident, return an empty array for that field.

Focus especially on:
- what the document is about;
- key claims and sourceability limits;
- actors, institutions, dates, temporal horizons;
- causal links and human friction;
- how the document should help a policy analyst or memo drafter;
- tags and follow-up research questions.

Document title: ${input.title}
File type: ${input.fileType}
Repository category: ${input.categoryId}
Policy domain: ${input.policyDomain}
Associated capsule ids: ${input.capsuleIds.length ? input.capsuleIds.join(', ') : 'none'}

Document text:
---
${input.text}
---`;
}
