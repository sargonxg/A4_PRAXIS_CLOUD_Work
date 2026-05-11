import { NextResponse } from 'next/server';
import { buildSemanticaSituationGraph } from '@/lib/semantica/context-core-adapter';
import {
  getRustSemanticaBinaryPath,
  validateWithRustSemanticaCore,
} from '@/lib/semantica/rust-runtime';

export const runtime = 'nodejs';

export async function GET() {
  const graph = buildSemanticaSituationGraph({
    name: 'Runtime health check context',
    frame: 'Validate that the deployed Rust semantic core can inspect a PRAXIS Context Core graph.',
    domainId: 'armed-conflict-security',
    domainLabel: 'Armed Conflict and Security',
    ontologyIds: ['conflict', 'security', 'governance'],
    primaryOntologyId: 'conflict',
    caseType: 'active-conflict',
    regionFallback: 'Health check',
    userRole: 'analyst',
    workflowPath: 'political-officer',
    workflowPathLabel: 'Political officer',
  });

  try {
    const validation = await validateWithRustSemanticaCore(graph);
    const healthy = validation.ok === true && validation.result?.semanticaReady === true;
    return NextResponse.json(
      {
        status: healthy ? 'ok' : 'degraded',
        binaryPath: getRustSemanticaBinaryPath(),
        validation,
      },
      { status: healthy ? 200 : 503 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        binaryPath: getRustSemanticaBinaryPath(),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
