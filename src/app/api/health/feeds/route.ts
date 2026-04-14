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
    ucdp:        'ok',  // Always available
    unnews:      'ok',  // Always available
    sipri:       'ok',  // Always available
    crisisgroup: 'ok',  // Always available
    acled:       process.env.ACLED_API_KEY    ? 'ok' : 'not_configured',
    tavily:      process.env.TAVILY_API_KEY   ? 'ok' : 'not_configured',
    firecrawl:   process.env.FIRECRAWL_API_KEY ? 'ok' : 'not_configured',
  };

  const configured = Object.values(status).filter((s) => s === 'ok').length;
  const total = Object.keys(status).length;

  return NextResponse.json({
    status,
    summary: `${configured}/${total} feeds active`,
    timestamp: new Date().toISOString(),
  });
});
