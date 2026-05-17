import { NextResponse } from 'next/server';

/**
 * GET /api/health/feeds
 * Returns the configuration and availability status of the supported
 * Google-grounded research path.
 */
export async function GET() {
  const status: Record<string, 'ok' | 'degraded' | 'not_configured'> = {
    google_search: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VERTEX_PROJECT ? 'ok' : 'not_configured',
    web_crawler: process.env.GOOGLE_AI_API_KEY ? 'ok' : 'degraded',
  };

  const configured = Object.values(status).filter((s) => s === 'ok').length;
  const total = Object.keys(status).length;

  return NextResponse.json({
    status,
    summary: `${configured}/${total} feeds active`,
    timestamp: new Date().toISOString(),
  });
}
