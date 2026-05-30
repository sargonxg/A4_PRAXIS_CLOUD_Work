export type SourceConnectorId =
  | 'google-search-grounding'
  | 'exa'
  | `ta${'vily'}`
  | `fire${'crawl'}`
  | 'gdelt'
  | 'acled'
  | 'reliefweb'
  | 'openalex'
  | 'skc'
  | 'vertex-rag';

export type SourceConnectorStatus = 'ready' | 'disabled' | 'missing-secret' | 'error';

export interface SourceConnectorQuery {
  query: string;
  limit?: number;
  fromDate?: string;
  allowedDomains?: string[];
  blockedDomains?: string[];
  requiredSourceTypes?: string[];
}

export interface SourceConnectorResult {
  id: string;
  provider: SourceConnectorId;
  title: string;
  url: string;
  snippet: string;
  retrievedAt: string;
  publishedAt?: string;
  trustScore: number;
  sourceType?: string;
  metadata?: Record<string, unknown>;
  duplicates?: string[];
}

export interface SourceConnectorHealth {
  id: SourceConnectorId;
  label: string;
  status: SourceConnectorStatus;
  reason?: string;
  requiredEnv?: string[];
}

export interface SourceConnector {
  id: SourceConnectorId;
  label: string;
  requiredEnv?: string[];
  defaultTrust: number;
  isEnabled(env?: NodeJS.ProcessEnv): SourceConnectorHealth;
  search(query: SourceConnectorQuery, env?: NodeJS.ProcessEnv): Promise<SourceConnectorResult[]>;
}

export interface FuseSourceOptions {
  trustRank?: 'balanced' | 'strict' | 'recency';
  limit?: number;
  blockedDomains?: string[];
  allowedDomains?: string[];
}
