/**
 * Re-export Conflict Grammar types from the canonical schema definitions.
 * This module provides convenient access to all Conflict Grammar types
 * without requiring consumers to import from the schema module directly.
 */
export type {
  Actor,
  Claim,
  Interest,
  Constraint,
  Leverage,
  Commitment,
  Event,
  Narrative,
  ConflictEntity,
  ConflictEntityType,
  ConflictGraph,
} from '@/lib/ai/schemas/conflict-grammar';
