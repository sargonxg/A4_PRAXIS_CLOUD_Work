// Conflict Grammar — 8 primitive entity types with consistent colors
export const ENTITY_COLORS = {
  Actor: '#1B3A5C',       // diplomatic-blue
  Claim: '#A63D40',       // crimson
  Interest: '#4A90A4',    // teal
  Constraint: '#334155',  // navy-600
  Leverage: '#C8961E',    // gold-600
  Commitment: '#5B8C5A',  // sage
  Event: '#C75B39',       // terracotta
  Narrative: '#7B6D8D',   // purple
} as const;

export type EntityType = keyof typeof ENTITY_COLORS;

export const ENTITY_TYPES: EntityType[] = [
  'Actor', 'Claim', 'Interest', 'Constraint',
  'Leverage', 'Commitment', 'Event', 'Narrative',
];

export function getEntityColor(type: string): string {
  return ENTITY_COLORS[type as EntityType] ?? '#475569';
}
