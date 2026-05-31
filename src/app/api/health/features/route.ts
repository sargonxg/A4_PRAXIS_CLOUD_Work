import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface FeatureFlagState {
  enabled: boolean;
  mode: string;
  reason: string;
}

interface FeatureFlags {
  cognee: FeatureFlagState;
  graphlite: FeatureFlagState;
  trustgraph: FeatureFlagState;
  contextEnrichment: FeatureFlagState & {
    receipts: {
      firestore: 'ready';
      cognee: 'enabled' | 'disabled';
      graphlite: 'enabled' | 'disabled';
      trustgraph: 'enabled' | 'disabled';
      graphiti: 'deferred';
    };
  };
  polar: FeatureFlagState;
  postgresKg: FeatureFlagState;
  agentEngineSubagents: FeatureFlagState;
}

export async function GET() {
  const cogneeConfigured = Boolean(process.env.COGNEE_BACKEND_URL);
  const cogneeEnabled = process.env.COGNEE_ENABLED === 'true' && cogneeConfigured;
  const graphliteConfigured = Boolean(process.env.GRAPHLITE_BACKEND_URL);
  const graphliteEnabled = process.env.GRAPHLITE_ENABLED === 'true' && graphliteConfigured;
  const trustgraphConfigured = Boolean(process.env.TRUSTGRAPH_BACKEND_URL);
  const trustgraphEnabled = process.env.TRUSTGRAPH_ENABLED === 'true' && trustgraphConfigured;
  const kgBackend = (process.env.KG_BACKEND ?? 'firestore').toLowerCase();
  const postgresKgEnabled = kgBackend === 'postgres' || kgBackend === 'both';
  const agentEngineConfigured = Boolean(process.env.VERTEX_AGENT_ENGINE_ID);
  const polarMissing = ['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET', 'POLAR_PRODUCT_ANALYST', 'POLAR_PRODUCT_TEAM']
    .filter((name) => !process.env[name]);

  const flags: FeatureFlags = {
      cognee: {
        enabled: cogneeEnabled,
        mode: cogneeEnabled ? process.env.COGNEE_MODE || 'enabled' : 'disabled',
        reason: cogneeEnabled
          ? 'COGNEE_ENABLED=true and COGNEE_BACKEND_URL is set'
          : 'COGNEE_ENABLED is not "true" or COGNEE_BACKEND_URL is missing',
      },
      graphlite: {
        enabled: graphliteEnabled,
        mode: graphliteEnabled ? process.env.GRAPHLITE_WORKSPACE_MODE || 'owner-capsule' : 'disabled',
        reason: graphliteEnabled
          ? 'GRAPHLITE_ENABLED=true and GRAPHLITE_BACKEND_URL is set'
          : 'GRAPHLITE_ENABLED is not "true" or GRAPHLITE_BACKEND_URL is missing',
      },
      trustgraph: {
        enabled: trustgraphEnabled,
        mode: trustgraphEnabled ? process.env.TRUSTGRAPH_WORKSPACE_MODE || 'owner-capsule' : 'disabled',
        reason: trustgraphEnabled
          ? 'TRUSTGRAPH_ENABLED=true and TRUSTGRAPH_BACKEND_URL is set'
          : 'TRUSTGRAPH_ENABLED is not "true" or TRUSTGRAPH_BACKEND_URL is missing',
      },
      contextEnrichment: {
        enabled: true,
        mode: graphliteEnabled
          ? 'firestore+cognee_review+graphlite_review'
          : trustgraphEnabled
          ? 'firestore+cognee_review+trustgraph_legacy_review'
          : cogneeEnabled
            ? 'firestore+cognee_review'
            : 'firestore_only',
        reason: graphliteEnabled
          ? 'Firestore is canonical; GraphLite and Cognee may enrich reviewable context; Graphiti is deferred'
          : trustgraphEnabled
          ? 'Firestore is canonical; legacy TrustGraph and Cognee may enrich reviewable context; Graphiti is deferred'
          : cogneeEnabled
            ? 'Firestore is canonical; Cognee recall may enrich reviewable context; Graphiti is deferred'
            : 'Firestore-only context is active; Cognee, GraphLite, and TrustGraph are disabled or unconfigured; Graphiti is deferred',
        receipts: {
          firestore: 'ready',
          cognee: cogneeEnabled ? 'enabled' : 'disabled',
          graphlite: graphliteEnabled ? 'enabled' : 'disabled',
          trustgraph: trustgraphEnabled ? 'enabled' : 'disabled',
          graphiti: 'deferred',
        },
      },
      polar: {
        enabled: polarMissing.length === 0,
        mode: polarMissing.length === 0 ? process.env.POLAR_SERVER || 'production' : 'unconfigured',
        reason: polarMissing.length === 0
          ? 'Polar token, webhook secret, and monthly product IDs are set'
          : `Missing ${polarMissing.join(', ')}`,
      },
      postgresKg: {
        enabled: postgresKgEnabled,
        mode: kgBackend,
        reason: `KG_BACKEND=${kgBackend}`,
      },
      agentEngineSubagents: {
        enabled: agentEngineConfigured,
        mode: agentEngineConfigured ? 'configured' : 'unconfigured',
        reason: agentEngineConfigured
          ? 'VERTEX_AGENT_ENGINE_ID is set'
          : 'VERTEX_AGENT_ENGINE_ID is not set',
      },
  };

  return NextResponse.json(
    flags,
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    },
  );
}
