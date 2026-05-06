import type { ProvenanceClaim } from '@/lib/exports/json-ld-prov';

export function createEmptyProvenanceClaim(text: string): ProvenanceClaim {
  return {
    id: crypto.randomUUID(),
    text,
    sources: [],
    trustScore: 72,
    confidence: 'ASSESSED',
  };
}

export function attachCypherPath(claim: ProvenanceClaim, cypherPath: string): ProvenanceClaim {
  return { ...claim, cypherPath };
}
