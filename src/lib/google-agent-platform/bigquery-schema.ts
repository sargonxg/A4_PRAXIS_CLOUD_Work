export type GoogleAgentBigQueryFieldType = 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'JSON';

export type GoogleAgentBigQueryField = {
  name: string;
  type: GoogleAgentBigQueryFieldType;
};

export type GoogleAgentBigQueryTable = {
  name: string;
  description: string;
  fields: GoogleAgentBigQueryField[];
};

export const GOOGLE_AGENT_BIGQUERY_TABLES: GoogleAgentBigQueryTable[] = [
  {
    name: 'pipeline_runs',
    description: 'Backend extraction pipeline run metrics.',
    fields: [
      { name: 'run_id', type: 'STRING' },
      { name: 'tenant_id', type: 'STRING' },
      { name: 'situation_id', type: 'STRING' },
      { name: 'nodes_count', type: 'INTEGER' },
      { name: 'edges_count', type: 'INTEGER' },
      { name: 'duration_ms', type: 'INTEGER' },
      { name: 'status', type: 'STRING' },
      { name: 'timestamp', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'extractions',
    description: 'Backend source extraction metrics.',
    fields: [
      { name: 'extraction_id', type: 'STRING' },
      { name: 'tenant_id', type: 'STRING' },
      { name: 'situation_id', type: 'STRING' },
      { name: 'source_type', type: 'STRING' },
      { name: 'source_file', type: 'STRING' },
      { name: 'nodes_count', type: 'INTEGER' },
      { name: 'edges_count', type: 'INTEGER' },
      { name: 'model', type: 'STRING' },
      { name: 'input_tokens', type: 'INTEGER' },
      { name: 'output_tokens', type: 'INTEGER' },
      { name: 'duration_ms', type: 'INTEGER' },
      { name: 'timestamp', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'agent_runs_analytics',
    description: 'Cloud SQL AgentRun mirror for BigQuery analytics.',
    fields: [
      { name: 'run_id', type: 'STRING' },
      { name: 'owner_uid', type: 'STRING' },
      { name: 'capsule_id', type: 'STRING' },
      { name: 'policy_agent_id', type: 'STRING' },
      { name: 'status', type: 'STRING' },
      { name: 'objective', type: 'STRING' },
      { name: 'trace_id', type: 'STRING' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'agent_run_events_analytics',
    description: 'Cloud SQL AgentRun event mirror for runtime and ADK traces.',
    fields: [
      { name: 'event_id', type: 'STRING' },
      { name: 'run_id', type: 'STRING' },
      { name: 'owner_uid', type: 'STRING' },
      { name: 'capsule_id', type: 'STRING' },
      { name: 'event_type', type: 'STRING' },
      { name: 'message', type: 'STRING' },
      { name: 'substrate', type: 'STRING' },
      { name: 'trace_id', type: 'STRING' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'data_json', type: 'JSON' },
    ],
  },
  {
    name: 'agent_tool_calls_analytics',
    description: 'Tool-call mirror for ADK, RAG, BigQuery, and PRAXIS tools.',
    fields: [
      { name: 'tool_call_id', type: 'STRING' },
      { name: 'run_id', type: 'STRING' },
      { name: 'owner_uid', type: 'STRING' },
      { name: 'tool_name', type: 'STRING' },
      { name: 'tool_risk', type: 'STRING' },
      { name: 'status', type: 'STRING' },
      { name: 'started_at', type: 'TIMESTAMP' },
      { name: 'completed_at', type: 'TIMESTAMP' },
      { name: 'metadata_json', type: 'JSON' },
    ],
  },
  {
    name: 'agent_approvals_analytics',
    description: 'Approval mirror for risky agent, capsule, graph, export, and RAG actions.',
    fields: [
      { name: 'approval_id', type: 'STRING' },
      { name: 'run_id', type: 'STRING' },
      { name: 'owner_uid', type: 'STRING' },
      { name: 'tool_call_id', type: 'STRING' },
      { name: 'approval_status', type: 'STRING' },
      { name: 'risk', type: 'STRING' },
      { name: 'requested_at', type: 'TIMESTAMP' },
      { name: 'resolved_at', type: 'TIMESTAMP' },
      { name: 'metadata_json', type: 'JSON' },
    ],
  },
];

export function getGoogleAgentBigQueryTable(name: string): GoogleAgentBigQueryTable {
  const table = GOOGLE_AGENT_BIGQUERY_TABLES.find((entry) => entry.name === name);
  if (!table) throw new Error(`Unknown Google Agent BigQuery table: ${name}`);
  return table;
}

export function toBqSchemaString(table: GoogleAgentBigQueryTable): string {
  return table.fields.map((field) => `${field.name}:${field.type}`).join(',');
}
