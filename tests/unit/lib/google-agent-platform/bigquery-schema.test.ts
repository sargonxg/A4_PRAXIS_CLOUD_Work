import { describe, expect, it } from 'vitest';
import {
  GOOGLE_AGENT_BIGQUERY_TABLES,
  getGoogleAgentBigQueryTable,
  toBqSchemaString,
} from '@/lib/google-agent-platform/bigquery-schema';

describe('Google Agent Platform BigQuery schema contract', () => {
  it('aligns pipeline and extraction tables with the Python logging client', () => {
    expect(toBqSchemaString(getGoogleAgentBigQueryTable('pipeline_runs'))).toContain('tenant_id:STRING');
    expect(toBqSchemaString(getGoogleAgentBigQueryTable('pipeline_runs'))).toContain('nodes_count:INTEGER');
    expect(toBqSchemaString(getGoogleAgentBigQueryTable('pipeline_runs'))).not.toContain('user_id:STRING');
    expect(toBqSchemaString(getGoogleAgentBigQueryTable('pipeline_runs'))).not.toContain('nodes:INTEGER');

    const extractionSchema = toBqSchemaString(getGoogleAgentBigQueryTable('extractions'));
    expect(extractionSchema).toContain('tenant_id:STRING');
    expect(extractionSchema).toContain('nodes_count:INTEGER');
    expect(extractionSchema).toContain('model:STRING');
    expect(extractionSchema).toContain('duration_ms:INTEGER');
  });

  it('defines AgentRun analytics mirror tables for Codex/ADK verification', () => {
    const tableNames = GOOGLE_AGENT_BIGQUERY_TABLES.map((table) => table.name);
    expect(tableNames).toEqual(expect.arrayContaining([
      'agent_runs_analytics',
      'agent_run_events_analytics',
      'agent_tool_calls_analytics',
      'agent_approvals_analytics',
    ]));
    expect(toBqSchemaString(getGoogleAgentBigQueryTable('agent_tool_calls_analytics')))
      .toContain('tool_risk:STRING');
    expect(toBqSchemaString(getGoogleAgentBigQueryTable('agent_approvals_analytics')))
      .toContain('approval_status:STRING');
  });
});
