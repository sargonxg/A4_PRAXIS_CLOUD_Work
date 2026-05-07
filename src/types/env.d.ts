export interface PraxisFeatureFlags {
  cogneeMemoryEnabled: boolean;
  cogneeMode: 'postgres-kuzu' | 'neo4j' | 'postgres-only-vector' | 'disabled';
}
