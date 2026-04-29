import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/health/feeds
 * Returns the configuration and availability status of each external data feed.
 * Feeds marked 'ok' have no API key requirement and are always available.
 * Feeds marked 'not_configured' need an environment variable to activate.
 */
export const GET = withAuth(async () => {
  const status: Record<string, 'ok' | 'degraded' | 'not_configured'> = {
    gdelt:       'ok',  // Always available — no key needed
    reliefweb:   'ok',  // Always available
    hdx:         'ok',  // Always available (HDX HAPI)
    unhcr:       'ok',  // Always available
    worldbank:   'ok',  // Always available
    ucdp:        process.env.UCDP_API_TOKEN || process.env.UCDP_ACCESS_TOKEN ? 'ok' : 'not_configured',
    unnews:      'ok',  // Always available
    sipri:       'ok',  // Always available
    crisisgroup: 'ok',  // Always available
    google_search: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VERTEX_PROJECT ? 'ok' : 'not_configured',
    web_crawler: process.env.FIRECRAWL_API_KEY ? 'ok' : 'degraded',
  };

  const configured = Object.values(status).filter((s) => s === 'ok').length;
  const total = Object.keys(status).length;

  return NextResponse.json({
    status,
    summary: `${configured}/${total} feeds active`,
    timestamp: new Date().toISOString(),
  });
});
