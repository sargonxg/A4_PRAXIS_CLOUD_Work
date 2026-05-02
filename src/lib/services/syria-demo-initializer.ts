import { SYRIA_DEMO_CONFLICT_GRAPH, SYRIA_DEMO_CASE_ID } from '@/lib/constants/syria-demo-case';
import { createConflictWithId, getConflict, updateConflict } from '@/lib/services/conflict-service';

let initialized = false;

export function ensureSyriaDemoData(conflictId: string = SYRIA_DEMO_CASE_ID): void {
  if (conflictId !== SYRIA_DEMO_CASE_ID) return;
  if (initialized && getConflict(conflictId)) return;

  const existing = getConflict(conflictId);
  if (!existing) {
    createConflictWithId(
      SYRIA_DEMO_CONFLICT_GRAPH.id,
      SYRIA_DEMO_CONFLICT_GRAPH.name,
      SYRIA_DEMO_CONFLICT_GRAPH.description,
      SYRIA_DEMO_CONFLICT_GRAPH.region,
    );
  }

  updateConflict(conflictId, {
    name: SYRIA_DEMO_CONFLICT_GRAPH.name,
    description: SYRIA_DEMO_CONFLICT_GRAPH.description,
    region: SYRIA_DEMO_CONFLICT_GRAPH.region,
    status: SYRIA_DEMO_CONFLICT_GRAPH.status,
    actors: SYRIA_DEMO_CONFLICT_GRAPH.actors,
    claims: SYRIA_DEMO_CONFLICT_GRAPH.claims,
    interests: SYRIA_DEMO_CONFLICT_GRAPH.interests,
    constraints: SYRIA_DEMO_CONFLICT_GRAPH.constraints,
    leverage: SYRIA_DEMO_CONFLICT_GRAPH.leverage,
    commitments: SYRIA_DEMO_CONFLICT_GRAPH.commitments,
    events: SYRIA_DEMO_CONFLICT_GRAPH.events,
    narratives: SYRIA_DEMO_CONFLICT_GRAPH.narratives,
    dataCompleteness: SYRIA_DEMO_CONFLICT_GRAPH.dataCompleteness,
    metadata: SYRIA_DEMO_CONFLICT_GRAPH.metadata,
  });

  initialized = true;
}

