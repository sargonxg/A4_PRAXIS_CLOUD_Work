/**
 * ACO v2.0 (Agentic Conflict Ontology) Color Palette
 *
 * Standard colors for all 14 entity types in the ACO framework.
 * Used by: force-graph, conflict-graph page, export visualizations.
 *
 * Core 8 primitives + 6 extended types (all first-class in v2.0).
 *
 * Re-exports from entity-colors.ts for backwards compatibility with
 * code that uses lowercase keys.
 */

import { ENTITY_COLORS, ENTITY_TYPES, type EntityType } from './entity-colors';

export const ACO_COLORS: Record<string, string> = {
  // Core 8 primitives (lowercase keys for graph rendering)
  actor: '#4E79A7',
  claim: '#F28E2B',
  interest: '#59A14F',
  constraint: '#E15759',
  leverage: '#EDC948',
  commitment: '#76B7B2',
  event: '#B07AA1',
  narrative: '#FF9DA7',

  // Extended 6 types
  institution: '#9C755F',
  norm: '#BAB0AC',
  resource: '#86BCB6',
  risk: '#FF6B6B',
  policy: '#4CC9F0',
  grievance: '#F72585',
};

/**
 * Get the ACO color for an entity type, case-insensitive.
 * Returns a neutral gray for unknown types.
 */
export function getACOColor(type: string): string {
  return ACO_COLORS[type.toLowerCase()] || '#8884d8';
}

/**
 * Get a darker variant of an ACO color for borders/strokes.
 */
export function getACOBorderColor(type: string): string {
  const hex = getACOColor(type);
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * 0.7);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * 0.7);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * 0.7);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get a translucent variant of an ACO color for fills/backgrounds.
 */
export function getACOFillColor(type: string, opacity = 0.15): string {
  const hex = getACOColor(type);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * All ACO entity type names for legends and filters.
 */
export const ACO_TYPE_NAMES = [
  'Actor', 'Claim', 'Interest', 'Constraint', 'Leverage',
  'Commitment', 'Event', 'Narrative',
  'Institution', 'Norm', 'Resource', 'Risk', 'Policy', 'Grievance',
] as const;

export type ACOType = (typeof ACO_TYPE_NAMES)[number];

/**
 * Relationship categories for UI grouping and filtering.
 * Mirrors the Python-side RELATIONSHIP_CATEGORIES.
 */
export const RELATIONSHIP_CATEGORIES = {
  causal: [
    'triggered_by', 'escalates', 'de_escalates', 'derived_from_event',
    'imposed_by_event', 'generates_claim', 'motivates_actor',
    'fuels_grievance', 'escalated_by_event', 'triggers_risk',
  ],
  structural: [
    'member_of', 'subordinate_to', 'parent_of', 'governs',
    'controls_resource', 'manages_resource', 'enforces_norm',
  ],
  antagonistic: [
    'opposes', 'contradicts', 'conflicts_with', 'undermines_claim',
    'undermined_by', 'violated_by_event', 'violates_norm',
    'competes_with', 'competes_with_institution', 'conflicts_with_norm',
  ],
  cooperative: [
    'allied_with', 'supports_claim', 'aligns_with', 'made_commitment',
    'addresses_claim', 'brokered_by_institution', 'reinforces',
    'addresses_grievance', 'addresses_risk', 'mitigates_risk',
  ],
  foundational: [
    'has_interest', 'claims', 'based_on_interest', 'underlying_interest_of',
    'rooted_in_grievance', 'driven_by_grievance', 'expresses_grievance',
    'requires_resource', 'demands_resource',
  ],
} as const;

export type RelationshipCategory = keyof typeof RELATIONSHIP_CATEGORIES;

/**
 * Colors for relationship categories in graph edges.
 */
export const RELATIONSHIP_CATEGORY_COLORS: Record<RelationshipCategory, string> = {
  causal: '#B07AA1',      // purple — cause/effect chains
  structural: '#4E79A7',  // blue — hierarchical/organizational
  antagonistic: '#E15759', // red — opposition/conflict
  cooperative: '#59A14F',  // green — alliance/agreement
  foundational: '#F28E2B', // orange — interests/needs/grievances
};

/**
 * Get the category of a relationship type.
 */
export function getRelationshipCategory(relation: string): RelationshipCategory | null {
  for (const [cat, relations] of Object.entries(RELATIONSHIP_CATEGORIES)) {
    if ((relations as readonly string[]).includes(relation)) {
      return cat as RelationshipCategory;
    }
  }
  return null;
}

// Re-export for convenience
export { ENTITY_COLORS, ENTITY_TYPES, type EntityType };
