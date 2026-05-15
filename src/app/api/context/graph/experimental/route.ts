import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  ExperimentalContextGraphInputSchema,
  buildExperimentalContextGraph,
  mirrorContextGraphToGrafeo,
  resolveContextGraphBackend,
} from '@/lib/context/experimental-grafeo-context-graph';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  graph: ExperimentalContextGraphInputSchema,
  backend: z.enum(['firestore_lite', 'grafeo_experimental']).optional(),
  persistGrafeoArtifact: z.boolean().optional(),
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
    const graph = buildExperimentalContextGraph(parsed.data.graph, { backend });
    const mirror = await mirrorContextGraphToGrafeo(graph, {
      backend,
      artifactPath: parsed.data.persistGrafeoArtifact === true ? undefined : null,
    });

    return NextResponse.json({
      graph,
      mirror,
      mode: backend === 'grafeo_experimental' ? 'grafeo_experimental' : 'firestore_lite',
      boundary: 'Experimental PRAXIS Context Core Lite graph. DIALECTICA by TACITUS remains the future full context creation engine.',
    });
  } catch (err) {
    return handleRouteError(err, 'context/graph/experimental');
  }
});
