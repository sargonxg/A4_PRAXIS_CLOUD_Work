import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface FeatureFlagState {
  enabled: boolean;
  mode: string;
  reason: string;
}

interface FeatureFlags {
  cognee: FeatureFlagState;
  polar: FeatureFlagState;
  postgresKg: FeatureFlagState;
  agentEngineSubagents: FeatureFlagState;
}

export async function GET() {
  const cogneeConfigured = Boolean(process.env.COGNEE_BACKEND_URL);
  const cogneeEnabled = process.env.COGNEE_ENABLED === 'true' && cogneeConfigured;
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
