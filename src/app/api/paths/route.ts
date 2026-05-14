/**
 * GET /api/paths — public read of the 10 operator paths.
 *
 * Public read so the PathPicker (CC-2) can render before auth completes
 * on the contexts page. Falls back to in-memory seeds when Firestore is
 * unreachable so the picker is never empty.
 */

import { NextResponse } from 'next/server';
import { listPaths } from '@/lib/path/resolve';
import { PATH_IDS } from '@/lib/path/types';
import { PATH_SEEDS } from '@/lib/path/seeds';

export async function GET() {
  try {
    const paths = await listPaths();
    if (paths.length > 0) {
      return NextResponse.json({ paths }, { headers: { 'cache-control': 'public, max-age=300' } });
    }
  } catch (err) {
    console.warn('[api/paths] listPaths failed, returning seeds:', err);
  }
  const fallback = PATH_IDS.map((id) => ({ ...PATH_SEEDS[id], version: 0, schemaVersion: 1 }));
  return NextResponse.json({ paths: fallback });
}
