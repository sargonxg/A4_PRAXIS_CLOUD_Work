import { NextRequest, NextResponse } from 'next/server';
import { getConflict, addEntity, createConflict } from '@/lib/services/conflict-service';
import { ConflictEntitySchema, type ConflictEntity } from '@/lib/ai/schemas/conflict-grammar';

export async function POST(request: NextRequest) {
  try {
    const { entities, conflictId } = await request.json();

    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json({ error: 'No entities provided' }, { status: 400 });
    }

    const targetConflictId = conflictId || 'nordalia-crisis';

    // Ensure the conflict exists
    let conflict = getConflict(targetConflictId);
    if (!conflict) {
      conflict = createConflict('New Conflict');
    }

    // Validate and add each entity
    const counts: Record<string, number> = {
      actor: 0,
      claim: 0,
      interest: 0,
      constraint: 0,
      leverage: 0,
      commitment: 0,
      event: 0,
      narrative: 0,
    };
    const errors: string[] = [];

    for (const raw of entities) {
      try {
        const entity: ConflictEntity = ConflictEntitySchema.parse(raw);
        const result = addEntity(targetConflictId, entity);
        if (result) {
          counts[entity.type] = (counts[entity.type] || 0) + 1;
        } else {
          errors.push(`Failed to add entity ${raw.id ?? 'unknown'}: conflict not found`);
        }
      } catch (err) {
        errors.push(`Validation failed for entity ${raw.id ?? 'unknown'}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      conflictId: targetConflictId,
      ingested: {
        actors: counts.actor,
        claims: counts.claim,
        interests: counts.interest,
        constraints: counts.constraint,
        leverage: counts.leverage,
        commitments: counts.commitment,
        events: counts.event,
        narratives: counts.narrative,
        total,
      },
      errors: errors.length > 0 ? errors : undefined,
      message: `${total} entities ingested into conflict knowledge graph.`,
    });
  } catch {
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
