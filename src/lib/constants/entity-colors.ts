/**
 * ACO v2.0 — 14 entity types with standard colors
 *
 * Core 8 primitives + 6 extended types, all promoted to first-class.
 * Colors match the official ACO palette used across PRAXIS visualizations.
 *
 * Theoretical grounding:
 *   Core 8: Fisher-Ury, Glasl, Zartman, Stedman, CAMEO
 *   Extended 6: Lederach, Galtung, Burton, INFORM Risk Index, Putnam
 */
export const ENTITY_COLORS = {
  // Core 8 primitives
  Actor: '#4E79A7',       // ACO blue
  Claim: '#F28E2B',       // ACO orange
  Interest: '#59A14F',    // ACO green
  Constraint: '#E15759',  // ACO red
  Leverage: '#EDC948',    // ACO gold
  Commitment: '#76B7B2',  // ACO teal
  Event: '#B07AA1',       // ACO purple
  Narrative: '#FF9DA7',   // ACO pink
  // Extended 6 types
  Institution: '#9C755F', // ACO brown
  Norm: '#BAB0AC',        // ACO gray
  Resource: '#86BCB6',    // ACO sage
  Risk: '#FF6B6B',        // ACO coral
  Policy: '#4CC9F0',      // ACO sky
  Grievance: '#F72585',   // ACO magenta
} as const;

export type EntityType = keyof typeof ENTITY_COLORS;

/** Core 8 primitive types (original ACO) */
export const CORE_ENTITY_TYPES: EntityType[] = [
  'Actor', 'Claim', 'Interest', 'Constraint',
  'Leverage', 'Commitment', 'Event', 'Narrative',
];

/** Extended 6 types (promoted to first-class in ACO v2.0) */
export const EXTENDED_ENTITY_TYPES: EntityType[] = [
  'Institution', 'Norm', 'Resource', 'Risk', 'Policy', 'Grievance',
];

/** All 14 entity types */
export const ENTITY_TYPES: EntityType[] = [
  ...CORE_ENTITY_TYPES,
  ...EXTENDED_ENTITY_TYPES,
];

export function getEntityColor(type: string): string {
  return ENTITY_COLORS[type as EntityType] ?? '#475569';
}
