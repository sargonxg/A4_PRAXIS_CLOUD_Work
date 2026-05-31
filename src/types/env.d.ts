export interface PraxisFeatureFlags {
  cogneeMemoryEnabled: boolean;
  cogneeMode: 'postgres-kuzu' | 'neo4j' | 'postgres-only-vector' | 'disabled';
  graphLiteEnabled: boolean;
  graphLiteMode: 'advisory-embedded' | 'disabled';
  trustGraphEnabled: boolean;
  trustGraphMode: 'advisory-derived' | 'disabled';
}
