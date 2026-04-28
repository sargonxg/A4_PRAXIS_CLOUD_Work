export const TACITUS_CORE_PRIMITIVES = [
  'Actor',
  'Claim',
  'Interest',
  'Constraint',
  'Leverage',
  'Commitment',
  'Event',
  'Narrative',
] as const;

export type TacitusCorePrimitive = (typeof TACITUS_CORE_PRIMITIVES)[number];

export interface CorePrimitiveCoverage {
  counts: Record<TacitusCorePrimitive, number>;
  missing: TacitusCorePrimitive[];
  coverageRatio: number;
}

function normalizePrimitiveType(type: string | null | undefined): TacitusCorePrimitive | null {
  if (!type) return null;
  const normalized = type.trim().toLowerCase().replace(/[_\s-]+/g, '');
  return TACITUS_CORE_PRIMITIVES.find(
    (primitive) => primitive.toLowerCase() === normalized,
  ) ?? null;
}

export function computeCorePrimitiveCoverage(
  nodes: Array<{ type?: string | null; primitive_type?: string | null }>,
): CorePrimitiveCoverage {
  const counts = Object.fromEntries(
    TACITUS_CORE_PRIMITIVES.map((primitive) => [primitive, 0]),
  ) as Record<TacitusCorePrimitive, number>;

  for (const node of nodes) {
    const primitive = normalizePrimitiveType(node.type ?? node.primitive_type);
    if (primitive) counts[primitive] += 1;
  }

  const missing = TACITUS_CORE_PRIMITIVES.filter((primitive) => counts[primitive] === 0);
  return {
    counts,
    missing,
    coverageRatio: (TACITUS_CORE_PRIMITIVES.length - missing.length) / TACITUS_CORE_PRIMITIVES.length,
  };
}
