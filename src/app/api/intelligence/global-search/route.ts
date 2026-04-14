import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchGlobalEntities, getCrossContextEntities } from '@/lib/services/global-entity-index';
import { listAnalystMemories, deleteAnalystMemory } from '@/lib/services/analyst-memory';

// ---------------------------------------------------------------------------
// GET — entity search + analyst memories
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const mode = url.searchParams.get('mode') || 'search'; // 'search' | 'cross' | 'memory'
    const situationId = url.searchParams.get('situationId') || '';

    if (mode === 'memory') {
      const memories = await listAnalystMemories(user.uid);
      return NextResponse.json({ memories });
    }

    if (mode === 'cross' && situationId) {
      const entities = await getCrossContextEntities(user.uid, situationId);
      return NextResponse.json({ entities });
    }

    if (!query.trim()) {
      return NextResponse.json({ entities: [] });
    }

    const entities = await searchGlobalEntities(user.uid, query, 30);
    return NextResponse.json({ entities });
  } catch (err) {
    return handleRouteError(err, 'intelligence/global-search/get');
  }
});

// ---------------------------------------------------------------------------
// DELETE — remove an analyst memory entry
// ---------------------------------------------------------------------------

export const DELETE = withAuth(async (request, user) => {
  try {
    const { memoryId } = await request.json() as { memoryId?: string };
    if (!memoryId) return NextResponse.json({ error: 'memoryId required' }, { status: 400 });
    await deleteAnalystMemory(user.uid, memoryId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleRouteError(err, 'intelligence/global-search/delete');
  }
});
