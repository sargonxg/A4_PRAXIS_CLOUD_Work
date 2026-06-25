import { describe, expect, it } from 'vitest';
import {
  GOOGLE_AGENT_MACRO_RAG_REPOSITORIES,
  assessGoogleAgentPlatformReadiness,
  buildGoogleAgentPlatformManifest,
} from '@/lib/google-agent-platform/readiness';

describe('Google Agent Platform readiness contract', () => {
  it('keeps macro RAG repositories review-gated and user-category scoped', () => {
    expect(GOOGLE_AGENT_MACRO_RAG_REPOSITORIES.length).toBeGreaterThanOrEqual(8);
    expect(GOOGLE_AGENT_MACRO_RAG_REPOSITORIES.map((repo) => repo.id)).toContain('diplomatic-policy');
    expect(GOOGLE_AGENT_MACRO_RAG_REPOSITORIES.map((repo) => repo.id)).toContain('legal-mandate-compliance');

    for (const repository of GOOGLE_AGENT_MACRO_RAG_REPOSITORIES) {
      expect(repository.audience).toBeTruthy();
      expect(repository.capsuleCoreHints.length).toBeGreaterThan(0);
      expect(repository.reviewGate).toBe('human-review-required');
      expect(repository.allowedRetrievalSources).toContain('context-capsule');
      expect(repository.defaultOutputTargets.length).toBeGreaterThan(0);
    }
  });

  it('allows local planning with warnings but fails production readiness without live runtime env', () => {
    const local = assessGoogleAgentPlatformReadiness({
      mode: 'local',
      env: { GOOGLE_CLOUD_PROJECT: 'praxisbytacitus', GOOGLE_VERTEX_LOCATION: 'us-central1' },
      files: {
        dataControllerAgent: true,
        runbook: true,
        adkBridge: true,
      },
    });
    expect(local.overall).toBe('warn');
    expect(local.checks.find((check) => check.id === 'agent_engine_id')?.status).toBe('warn');

    const production = assessGoogleAgentPlatformReadiness({
      mode: 'production',
      env: { GOOGLE_CLOUD_PROJECT: 'praxisbytacitus', GOOGLE_VERTEX_LOCATION: 'us-central1' },
      files: {
        dataControllerAgent: true,
        runbook: true,
        adkBridge: true,
      },
    });
    expect(production.overall).toBe('fail');
    expect(production.checks.filter((check) => check.status === 'fail').map((check) => check.id))
      .toEqual(expect.arrayContaining([
        'agent_engine_id',
        'agent_run_ledger',
        'worker_target',
        'worker_auth',
        'rag_corpus',
      ]));
  });

  it('supports first deploy preflight before an Agent Runtime id exists', () => {
    const predeploy = assessGoogleAgentPlatformReadiness({
      mode: 'predeploy',
      env: { GOOGLE_CLOUD_PROJECT: 'praxisbytacitus', GOOGLE_VERTEX_LOCATION: 'us-central1' },
      files: {
        dataControllerAgent: true,
        runbook: true,
        adkBridge: true,
      },
    });

    expect(predeploy.overall).toBe('warn');
    expect(predeploy.checks.find((check) => check.id === 'project')?.status).toBe('ok');
    expect(predeploy.checks.find((check) => check.id === 'region')?.status).toBe('ok');
    expect(predeploy.checks.find((check) => check.id === 'agent_engine_id')?.status).toBe('warn');
  });

  it('returns a deployable manifest that keeps PRAXIS as the canonical product state', () => {
    const manifest = buildGoogleAgentPlatformManifest();

    expect(manifest.projectId).toBe('praxisbytacitus');
    expect(manifest.region).toBe('us-central1');
    expect(manifest.canonicalProductState).toEqual([
      'Firestore ContextCapsules',
      'Cloud SQL AgentRun ledger',
      'PRAXIS review cards',
      'PRAXIS output stores',
    ]);
    expect(manifest.agents.map((agent) => agent.id)).toContain('praxis-data-controller');
    expect(manifest.agents.find((agent) => agent.id === 'praxis-data-controller')?.tools)
      .toEqual(expect.arrayContaining(['vertex-rag-retrieval', 'bigquery-analytics', 'capsule-context-reader']));
  });
});
