import {
  ConflictGraph,
  ConflictGraphSchema,
  ConflictEntity,
  ConflictEntityType,
} from '@/lib/ai/schemas/conflict-grammar';

// In-memory store for conflict graphs during the session
const conflictStore = new Map<string, ConflictGraph>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function emptyGraph(id: string, name: string): ConflictGraph {
  return {
    id,
    name,
    status: 'active',
    actors: [],
    claims: [],
    interests: [],
    constraints: [],
    leverage: [],
    commitments: [],
    events: [],
    narratives: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function createConflict(name: string, description?: string, region?: string): ConflictGraph {
  const id = generateId();
  const graph: ConflictGraph = {
    ...emptyGraph(id, name),
    description,
    region,
  };
  const validated = ConflictGraphSchema.parse(graph);
  conflictStore.set(id, validated);
  return validated;
}

export function createConflictWithId(id: string, name: string, description?: string, region?: string): ConflictGraph {
  const graph: ConflictGraph = {
    ...emptyGraph(id, name),
    description,
    region,
  };
  const validated = ConflictGraphSchema.parse(graph);
  conflictStore.set(id, validated);
  return validated;
}

export function getConflict(id: string): ConflictGraph | undefined {
  return conflictStore.get(id);
}

export function getAllConflicts(): ConflictGraph[] {
  return Array.from(conflictStore.values());
}

export function updateConflict(id: string, updates: Partial<Omit<ConflictGraph, 'id'>>): ConflictGraph | null {
  const existing = conflictStore.get(id);
  if (!existing) return null;

  const updated: ConflictGraph = {
    ...existing,
    ...updates,
    id: existing.id,
    lastUpdated: new Date().toISOString(),
  };

  const validated = ConflictGraphSchema.parse(updated);
  conflictStore.set(id, validated);
  return validated;
}

export function addEntity(conflictId: string, entity: ConflictEntity): ConflictGraph | null {
  const graph = conflictStore.get(conflictId);
  if (!graph) return null;

  const updated = { ...graph, lastUpdated: new Date().toISOString() };

  switch (entity.type) {
    case 'actor':
      updated.actors = [...graph.actors, entity];
      break;
    case 'claim':
      updated.claims = [...graph.claims, entity];
      break;
    case 'interest':
      updated.interests = [...graph.interests, entity];
      break;
    case 'constraint':
      updated.constraints = [...graph.constraints, entity];
      break;
    case 'leverage':
      updated.leverage = [...graph.leverage, entity];
      break;
    case 'commitment':
      updated.commitments = [...graph.commitments, entity];
      break;
    case 'event':
      updated.events = [...graph.events, entity];
      break;
    case 'narrative':
      updated.narratives = [...graph.narratives, entity];
      break;
  }

  const validated = ConflictGraphSchema.parse(updated);
  conflictStore.set(conflictId, validated);
  return validated;
}

export function removeEntity(
  conflictId: string,
  entityType: ConflictEntityType,
  entityId: string
): ConflictGraph | null {
  const graph = conflictStore.get(conflictId);
  if (!graph) return null;

  const updated = { ...graph, lastUpdated: new Date().toISOString() };

  const filterById = (arr: { id: string }[]) => arr.filter((e) => e.id !== entityId);

  switch (entityType) {
    case 'actor':
      updated.actors = filterById(graph.actors) as typeof graph.actors;
      break;
    case 'claim':
      updated.claims = filterById(graph.claims) as typeof graph.claims;
      break;
    case 'interest':
      updated.interests = filterById(graph.interests) as typeof graph.interests;
      break;
    case 'constraint':
      updated.constraints = filterById(graph.constraints) as typeof graph.constraints;
      break;
    case 'leverage':
      updated.leverage = filterById(graph.leverage) as typeof graph.leverage;
      break;
    case 'commitment':
      updated.commitments = filterById(graph.commitments) as typeof graph.commitments;
      break;
    case 'event':
      updated.events = filterById(graph.events) as typeof graph.events;
      break;
    case 'narrative':
      updated.narratives = filterById(graph.narratives) as typeof graph.narratives;
      break;
  }

  const validated = ConflictGraphSchema.parse(updated);
  conflictStore.set(conflictId, validated);
  return validated;
}
