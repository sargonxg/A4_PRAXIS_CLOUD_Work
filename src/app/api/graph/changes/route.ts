import { NextResponse } from 'next/server';
import { diffGraphSnapshots } from '@/lib/graph/diff-engine';

export async function GET() {
  const diff = diffGraphSnapshots(
    { nodes: [], edges: [], sources: [] },
    {
      nodes: [{ id: 'proposal-1', label: 'New actor proposal' }],
      edges: [{ id: 'edge-1', source: 'proposal-1', target: 'case-root', type: 'RELATES_TO' }],
      sources: [{ id: 'source-1', title: 'Updated source', updatedAt: new Date().toISOString() }],
    },
  );
  return NextResponse.json(diff);
}
