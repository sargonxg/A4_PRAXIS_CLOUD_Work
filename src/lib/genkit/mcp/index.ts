export type ExternalMcpToolSource = 'ucdp' | 'gdelt' | 'reliefweb' | 'hdx' | 'un-news' | 'world-bank';

export interface ExternalMcpToolRegistration {
  source: ExternalMcpToolSource;
  enabled: boolean;
  serverUrl?: string;
  notes: string;
}

export const EXTERNAL_MCP_TOOL_STUBS: ExternalMcpToolRegistration[] = [
  {
    source: 'ucdp',
    enabled: false,
    notes: 'Conflict event and dyad tools will register here after MCP credentials and source posture rules are finalized.',
  },
  {
    source: 'gdelt',
    enabled: false,
    notes: 'Media/event stream tools will register here behind attribution and freshness checks.',
  },
  {
    source: 'reliefweb',
    enabled: false,
    notes: 'Humanitarian response tools will register here after rate limits and receipt persistence are defined.',
  },
  {
    source: 'hdx',
    enabled: false,
    notes: 'Dataset discovery tools will register here with explicit dataset provenance.',
  },
  {
    source: 'un-news',
    enabled: false,
    notes: 'UN source tools will register here as read-only MCP resources.',
  },
  {
    source: 'world-bank',
    enabled: false,
    notes: 'Indicator and development data tools will register here after query shaping is locked.',
  },
];

export function listExternalMcpToolStubs() {
  return EXTERNAL_MCP_TOOL_STUBS;
}
