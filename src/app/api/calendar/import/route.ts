import { withAuth } from '@/lib/api/with-auth';
import { fetchICalFeed } from '@/lib/utils/ical-parser';

/**
 * POST /api/calendar/import — Import events from an iCal feed URL.
 * Fetches the iCal feed server-side (avoids CORS) and returns parsed events.
 */
export const POST = withAuth(async (req) => {
  try {
    const { url, source } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400 });
    }

    const events = await fetchICalFeed(url, source || url);
    return new Response(JSON.stringify({ events, count: events.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[calendar] Import failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to import calendar feed' }), { status: 500 });
  }
});
