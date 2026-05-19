import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const archivedGraphStagingRoute = {
  code: 'archived_graph_staging_route',
  replacement: '/api/graph/proposals',
};

export const GET = withAuth(async () => NextResponse.json(archivedGraphStagingRoute, { status: 410 }));

export const POST = withAuth(async () => NextResponse.json(archivedGraphStagingRoute, { status: 410 }));
