import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { createGraphUpdateProposal } from '@/lib/firebase/graph-updates-service';

export const maxDuration = 60;

const ProposalSchema = z.object({
  kind: z.enum(['node.add', 'node.edit', 'edge.add', 'edge.edit']),
  summary: z.string().min(1).max(800),
  confidence: z.number().min(0).max(1).default(0.65),
  provenance: z.object({
    documentId: z.string().optional(),
    chunkId: z.string().optional(),
    sourceUrl: z.string().optional(),
    extractor: z.string().optional(),
  }).default({}),
  payload: z.record(z.string(), z.unknown()),
});

const BodySchema = z.object({
  situationId: z.string().min(1),
  capsuleId: z.string().min(1).optional(),
  capsuleVersion: z.number().int().positive().optional(),
  traceId: z.string().min(1).optional(),
  capabilityId: z.string().min(1).optional(),
  actionLabel: z.string().min(1).max(120).optional(),
  proposals: z.array(ProposalSchema).min(1).max(50),
});

export const POST = withCalibration('conflict_graph', 'ai_analysis', {
  retrievalQuery: (_req, body) => typeof body?.actionLabel === 'string' ? body.actionLabel : 'graph proposal',
})(async (request: Request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ proposalIds: [], reviewRequired: true, persisted: false });
    }
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid graph proposal request', details: parsed.error.flatten() }, { status: 400 });
    }

    const proposalIds: string[] = [];
    for (const proposal of parsed.data.proposals) {
      const id = await createGraphUpdateProposal(user.uid, parsed.data.situationId, {
        kind: proposal.kind,
        summary: proposal.summary,
        confidence: proposal.confidence,
        provenance: {
          ...proposal.provenance,
          extractor: proposal.provenance.extractor ?? parsed.data.capabilityId ?? 'graph-propose',
        },
        payload: {
          ...proposal.payload,
          capsuleId: parsed.data.capsuleId,
          capsuleVersion: parsed.data.capsuleVersion,
          traceId: parsed.data.traceId,
          actionLabel: parsed.data.actionLabel,
        },
      });
      if (id) proposalIds.push(id);
    }

    return NextResponse.json({
      proposalIds,
      reviewRequired: true,
      persisted: proposalIds.length > 0,
      capsuleId: parsed.data.capsuleId ?? null,
      capsuleVersion: parsed.data.capsuleVersion ?? null,
      traceId: parsed.data.traceId ?? null,
    }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'ai/graph-propose');
  }
});
