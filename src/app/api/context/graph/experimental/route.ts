import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  CONTEXT_GRAPH_ONTOLOGY_PRESETS,
  ExperimentalContextGraphInputSchema,
  ExperimentalContextGraphIngestionSchema,
  buildExperimentalContextGraph,
  ingestMaterialsToExperimentalContextGraph,
  mirrorContextGraphToGrafeo,
  resolveContextGraphBackend,
  suggestContextGraphOntologies,
} from '@/lib/context/experimental-grafeo-context-graph';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  graph: ExperimentalContextGraphInputSchema.optional(),
  ingestion: ExperimentalContextGraphIngestionSchema.optional(),
  backend: z.enum(['firestore_lite', 'grafeo_experimental']).optional(),
  persistGrafeoArtifact: z.boolean().optional(),
}).refine((value) => Boolean(value.graph) !== Boolean(value.ingestion), {
  message: 'Provide exactly one of graph or ingestion.',
  path: ['graph'],
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ presets: CONTEXT_GRAPH_ONTOLOGY_PRESETS, suggestions: CONTEXT_GRAPH_ONTOLOGY_PRESETS });
    }
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain') ?? undefined;
    const userIntent = url.searchParams.get('intent') ?? undefined;
    const text = url.searchParams.get('text') ?? undefined;
    return NextResponse.json({
      presets: CONTEXT_GRAPH_ONTOLOGY_PRESETS,
      suggestions: suggestContextGraphOntologies({ domain, userIntent, text }).slice(0, 3),
      boundary: 'Use Context Core Lite now; future full context creation remains DIALECTICA by TACITUS.',
    });
  } catch (err) {
    return handleRouteError(err, 'context/graph/experimental/presets');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot create private experimental context graphs' }, { status: 403 });
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const backend = parsed.data.backend ?? resolveContextGraphBackend();
    const graph = parsed.data.ingestion
      ? ingestMaterialsToExperimentalContextGraph(parsed.data.ingestion, { backend })
      : buildExperimentalContextGraph(parsed.data.graph!, { backend });
    const mirror = await mirrorContextGraphToGrafeo(graph, {
      backend,
      artifactPath: parsed.data.persistGrafeoArtifact === true ? undefined : null,
    });

    return NextResponse.json({
      graph,
      mirror,
      visualization: graph.visualization,
      evolution: graph.evolution,
      mode: backend === 'grafeo_experimental' ? 'grafeo_experimental' : 'firestore_lite',
      boundary: 'Experimental PRAXIS Context Core Lite graph. DIALECTICA by TACITUS remains the future full context creation engine.',
    });
  } catch (err) {
    return handleRouteError(err, 'context/graph/experimental');
  }
});
