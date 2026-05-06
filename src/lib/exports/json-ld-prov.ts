export interface ProvenanceClaim {
  id: string;
  text: string;
  sources: string[];
  cypherPath?: string;
  trustScore: number;
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
}

export function buildJsonLdProvenanceManifest(claims: ProvenanceClaim[], workProductId: string) {
  return {
    '@context': {
      prov: 'http://www.w3.org/ns/prov#',
      praxis: 'https://praxis.tacitus.me/ns#',
    },
    '@id': `praxis:work-product:${workProductId}`,
    '@type': 'prov:Entity',
    wasGeneratedBy: {
      '@type': 'prov:Activity',
      agent: 'praxis-v7-product-surface',
      generatedAt: new Date().toISOString(),
    },
    claims: claims.map((claim) => ({
      '@id': `praxis:claim:${claim.id}`,
      text: claim.text,
      sources: claim.sources,
      cypherPath: claim.cypherPath,
      trustScore: claim.trustScore,
      confidence: claim.confidence,
    })),
  };
}
