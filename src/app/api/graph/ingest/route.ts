import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { entities, conflictId, documentId } = await request.json();

    // Demo ingestion response
    return NextResponse.json({
      success: true,
      conflictId: conflictId || 'nordalia-crisis',
      documentId: documentId || 'unknown',
      ingested: {
        actors: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Actor').length || 0,
        claims: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Claim').length || 0,
        interests: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Interest').length || 0,
        constraints: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Constraint').length || 0,
        leverage: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Leverage').length || 0,
        commitments: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Commitment').length || 0,
        events: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Event').length || 0,
        narratives: entities?.filter((e: { primitiveType: string }) => e.primitiveType === 'Narrative').length || 0,
        total: entities?.length || 0,
      },
      message: 'Entities ingested into conflict knowledge graph.',
    });
  } catch {
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
