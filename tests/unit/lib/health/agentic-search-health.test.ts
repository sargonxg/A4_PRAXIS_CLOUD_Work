import { describe, expect, it } from 'vitest';
import {
  collectAgenticSearchHealth,
  summarizeAgenticSearchHealth,
  type AgenticSearchCheck,
} from '@/lib/health/agentic-search-health';

describe('agentic search health', () => {
  it('blocks with exact missing env names for required run-ledger and worker config', () => {
    const report = collectAgenticSearchHealth(new Date('2026-05-19T12:00:00.000Z'), {});

    expect(report.status).toBe('blocked');
    expect(report.missing).toEqual(expect.arrayContaining([
      'AGENT_RUNTIME_DATABASE_URL or PRAXIS_DATABASE_URL or DATABASE_URL',
      'AGENT_RUN_WORKER_BASE_URL or NEXT_PUBLIC_APP_URL or APP_URL or VERCEL_PROJECT_PRODUCTION_URL',
      'AGENT_RUN_WORKER_SHARED_SECRET or AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL+AGENT_RUN_WORKER_OIDC_AUDIENCE',
    ]));
    expect(JSON.stringify(report)).not.toContain('internalSpendCents');
  });

  it('returns degraded rather than blocked when optional Google search and ADK config are missing', () => {
    const env = {
      AGENT_RUNTIME_DATABASE_URL: 'postgres://example',
      AGENT_RUN_WORKER_BASE_URL: 'https://praxis.tacitus.me',
      AGENT_RUN_WORKER_SHARED_SECRET: 'secret',
      AGENT_RUN_TASKS_PROJECT: 'praxisbytacitus',
      AGENT_RUN_TASKS_LOCATION: 'us-central1',
      AGENT_RUN_TASKS_QUEUE: 'agent-runs',
      GOOGLE_VERTEX_PROJECT: 'praxisbytacitus',
      GOOGLE_VERTEX_LOCATION: 'us-central1',
    };

    const report = collectAgenticSearchHealth(new Date('2026-05-19T12:00:00.000Z'), env);

    expect(report.status).toBe('degraded');
    expect(report.missing).toEqual(expect.arrayContaining([
      'VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED',
      'VERTEX_AGENT_ENGINE_ID or GOOGLE_ADK_AGENT_ENGINE_ID',
      'RESEARCH_GRAPH_ENABLED',
    ]));
    expect(report.checks.find((check) => check.id === 'cloud_tasks_queue')).toMatchObject({
      status: 'ready',
      names: ['AGENT_RUN_TASKS_PROJECT', 'AGENT_RUN_TASKS_LOCATION', 'AGENT_RUN_TASKS_QUEUE'],
    });
  });

  it('summarizes ready when required and live research config is present', () => {
    const checks: AgenticSearchCheck[] = [
      { id: 'ledger', label: 'Cloud SQL run ledger', status: 'ready', names: ['AGENT_RUNTIME_DATABASE_URL'], detail: 'ready', required: true },
      { id: 'cloud_tasks_queue', label: 'Cloud Tasks queue', status: 'ready', names: ['AGENT_RUN_TASKS_PROJECT'], detail: 'ready', required: false },
      { id: 'worker_auth', label: 'Worker route auth', status: 'ready', names: ['AGENT_RUN_WORKER_SHARED_SECRET'], detail: 'ready', required: true },
      { id: 'vertex_grounding', label: 'Vertex Google Search grounding', status: 'ready', names: ['VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED'], detail: 'ready', required: false },
      { id: 'research_graph_extra', label: 'Research graph extra', status: 'ready', names: ['RESEARCH_GRAPH_ENABLED'], detail: 'ready', required: false },
    ];

    expect(summarizeAgenticSearchHealth(checks, new Date('2026-05-19T12:00:00.000Z'))).toMatchObject({
      status: 'ready',
      summary: 'Agentic search ready',
      missing: [],
    });
  });

  it('reports Research graph as an optional ready capability when GDELT/Wikidata mode is enabled', () => {
    const report = collectAgenticSearchHealth(new Date('2026-05-22T12:00:00.000Z'), {
      AGENT_RUNTIME_DATABASE_URL: 'postgres://example',
      AGENT_RUN_WORKER_BASE_URL: 'https://praxis.tacitus.me',
      AGENT_RUN_WORKER_SHARED_SECRET: 'secret',
      VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED: 'true',
      VERTEX_AGENT_ENGINE_ID: 'agent-1',
      GOOGLE_VERTEX_PROJECT: 'praxisbytacitus',
      GOOGLE_GENAI_API_KEY: 'configured',
      RESEARCH_GRAPH_ENABLED: 'true',
      RESEARCH_GRAPH_USER_AGENT: 'PRAXIS test',
    });

    expect(report.checks.find((check) => check.id === 'research_graph_extra')).toMatchObject({
      status: 'ready',
      required: false,
      detail: 'Research graph can use free GDELT DOC/API and Wikidata SPARQL receipts for optional Ask turns.',
    });
  });
});
