export type ExternalMcpToolSource = 'google-search' | 'web-crawler';

export interface ExternalMcpToolRegistration {
  source: ExternalMcpToolSource;
  enabled: boolean;
  serverUrl?: string;
  notes: string;
}

export const EXTERNAL_MCP_TOOL_STUBS: ExternalMcpToolRegistration[] = [
  {
    source: 'google-search',
    enabled: true,
    notes: 'Grounded Google Search is the supported live research path.',
  },
  {
    source: 'web-crawler',
    enabled: false,
    notes: 'Optional crawler integrations can register here when they return source-linked receipts.',
  },
];

export function listExternalMcpToolStubs() {
  return EXTERNAL_MCP_TOOL_STUBS;
}
