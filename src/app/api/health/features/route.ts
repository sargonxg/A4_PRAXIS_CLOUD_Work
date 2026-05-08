import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET() {
  const cogneeConfigured = Boolean(process.env.COGNEE_BACKEND_URL);
  const cogneeEnabled = process.env.COGNEE_ENABLED === 'true' && cogneeConfigured;
  const postgresKgEnabled = (process.env.KG_BACKEND ?? '').toLowerCase() === 'postgres';
  const agentEngineConfigured = Boolean(process.env.VERTEX_AGENT_ENGINE_PROJECT && process.env.VERTEX_AGENT_ENGINE_LOCATION);

  return NextResponse.json(
    {
      cognee: {
        enabled: cogneeEnabled,
        mode: cogneeEnabled ? process.env.COGNEE_MODE || 'enabled' : 'disabled',
        reason: cogneeEnabled
          ? 'configured'
          : process.env.COGNEE_ENABLED === 'true'
            ? 'missing_backend_url'
            : 'disabled_by_env',
      },
      postgresKg: {
        enabled: postgresKgEnabled,
        mode: postgresKgEnabled ? 'postgres' : (process.env.KG_BACKEND || 'unset'),
      },
      agentEngineSubagents: {
        enabled: agentEngineConfigured,
        mode: agentEngineConfigured ? 'configured' : 'unconfigured',
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
      },
    },
  );
}
