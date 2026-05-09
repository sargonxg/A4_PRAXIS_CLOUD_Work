import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface FeatureFlagState {
  enabled: boolean;
  mode: string;
  reason: string;
}

interface FeatureFlags {
  praxisV7: FeatureFlagState;
  cognee: FeatureFlagState;
  postgresKg: FeatureFlagState;
  agentEngineSubagents: FeatureFlagState;
}

export async function GET() {
  const cogneeConfigured = Boolean(process.env.COGNEE_BACKEND_URL);
  const cogneeEnabled = process.env.COGNEE_ENABLED === 'true' && cogneeConfigured;
  const kgBackend = (process.env.KG_BACKEND ?? 'firestore').toLowerCase();
  const postgresKgEnabled = kgBackend === 'postgres' || kgBackend === 'both';
  const agentEngineConfigured = Boolean(process.env.VERTEX_AGENT_ENGINE_ID);
  const praxisV7Enabled = process.env.PRAXIS_V7_BACKEND === 'true' || process.env.NEXT_PUBLIC_PRAXIS_V7 === 'true';

  const flags: FeatureFlags = {
      praxisV7: {
        enabled: praxisV7Enabled,
        mode: praxisV7Enabled ? 'enabled' : 'disabled',
        reason: praxisV7Enabled
          ? 'PRAXIS_V7_BACKEND=true or NEXT_PUBLIC_PRAXIS_V7=true'
          : 'v7 shell is disabled by default',
      },
      cognee: {
        enabled: cogneeEnabled,
        mode: cogneeEnabled ? process.env.COGNEE_MODE || 'enabled' : 'disabled',
        reason: cogneeEnabled
          ? 'COGNEE_ENABLED=true and COGNEE_BACKEND_URL is set'
          : 'COGNEE_ENABLED is not "true" or COGNEE_BACKEND_URL is missing',
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
