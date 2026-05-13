/**
 * POST /api/intelligence/corpus-search
 *
 * Returns ranked corpus items from the active situation's evidence body.
 * Used by Ask PRAXIS, Brainstorming Table, Humanitarian, and the future
 * citation disclosure UI. This is a retrieval endpoint — it does NOT
 * generate AI text and does NOT consume model credits, so it lives under
 * `/api/intelligence/*` (not `/api/ai/*`) and is not subject to
 * `withCalibration`.
 *
 * Auth: signed session cookie via `withAuth` (Firebase + demo cookie).
 * Demo users get an empty corpus today — there is no user-owned situation
 * data for the demo cookie.
 *
 * Spec: docs/CORPUS_ARCHITECTURE.md (Target API).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { getContextPackage } from '@/lib/knowledge/context-engine';
import {
  DEFAULT_CORPUS_LAYERS,
  DEFAULT_CORPUS_LIMIT,
  MAX_CORPUS_LIMIT,
  type CorpusLayer,
} from '@/types/corpus';

const LayerSchema = z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output']);

const RequestSchema = z.object({
  situationId: z.string().min(1, 'situationId required').max(200),
  query: z.string().max(2000).default(''),
  layers: z.array(LayerSchema).max(10).optional(),
  limit: z.number().int().positive().max(MAX_CORPUS_LIMIT).optional(),
  contextPackageId: z.string().max(200).optional(),
  coreIds: z.array(z.string()).max(20).optional(),
  checkFreshness: z.boolean().optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({
        items: [],
        trace: {
          query: '',
          layersSearched: [],
          ranking: 'demo session — corpus search disabled',
          freshnessChecked: false,
          layerCounts: {},
          totalCandidates: 0,
          durationMs: 0,
        },
      });
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const contextPackage = parsed.data.contextPackageId
      ? await getContextPackage(user.uid, parsed.data.contextPackageId)
      : null;
    if (parsed.data.contextPackageId && !contextPackage) {
      return NextResponse.json({ error: 'Context package not found' }, { status: 404 });
    }
    const layers: CorpusLayer[] = parsed.data.layers
      ?? contextPackage?.retrievalPolicy.layers
      ?? [...DEFAULT_CORPUS_LAYERS];
    const limit = parsed.data.limit ?? contextPackage?.retrievalPolicy.limit ?? DEFAULT_CORPUS_LIMIT;

    const result = await searchSituationCorpus({
      uid: user.uid,
      situationId: contextPackage?.coreRefs.situationCoreId ?? parsed.data.situationId,
      query: parsed.data.query,
      layers,
      limit,
      contextPackageId: contextPackage?.id ?? parsed.data.contextPackageId,
      contextHealthScore: contextPackage?.health.score,
      checkFreshness: parsed.data.checkFreshness ?? contextPackage?.retrievalPolicy.checkFreshness,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err, 'intelligence/corpus-search');
  }
});
