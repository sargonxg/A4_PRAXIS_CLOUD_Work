export type GoogleAgentReadinessMode = 'local' | 'predeploy' | 'production';
export type GoogleAgentReadinessStatus = 'ok' | 'warn' | 'fail';

export type GoogleAgentReadinessInput = {
  mode?: GoogleAgentReadinessMode;
  env?: Record<string, string | undefined>;
  files?: {
    dataControllerAgent?: boolean;
    runbook?: boolean;
    adkBridge?: boolean;
  };
};

export type GoogleAgentReadinessCheck = {
  id: string;
  label: string;
  status: GoogleAgentReadinessStatus;
  detail: string;
};

export type GoogleAgentReadinessReport = {
  mode: GoogleAgentReadinessMode;
  overall: GoogleAgentReadinessStatus;
  checks: GoogleAgentReadinessCheck[];
  nextActions: string[];
};

export type MacroRagRepository = {
  id: string;
  label: string;
  audience: string;
  capsuleCoreHints: string[];
  allowedRetrievalSources: Array<'context-capsule' | 'uploaded-document' | 'curated-policy-corpus' | 'bigquery-analytics' | 'grounded-search'>;
  defaultOutputTargets: string[];
  reviewGate: 'human-review-required';
};

export const GOOGLE_AGENT_MACRO_RAG_REPOSITORIES: MacroRagRepository[] = [
  {
    id: 'diplomatic-policy',
    label: 'Diplomatic and Policy Teams',
    audience: 'Foreign ministry, multilateral, mediation, and policy planning users.',
    capsuleCoreHints: ['situation', 'source', 'objective', 'tool', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus', 'grounded-search'],
    defaultOutputTargets: ['principals-decision-memo', 'options-memo', 'talking-points'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'legal-mandate-compliance',
    label: 'Legal, Mandate, and Compliance',
    audience: 'Counsel, mandate reviewers, compliance teams, and governance users.',
    capsuleCoreHints: ['source', 'document', 'tool', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus'],
    defaultOutputTargets: ['legal-mandate-compliance-note', 'evidence-sourceability-annex'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'humanitarian-operations',
    label: 'Humanitarian and Field Operations',
    audience: 'Humanitarian access, protection, logistics, and field coordination users.',
    capsuleCoreHints: ['situation', 'source', 'time', 'tool', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus', 'grounded-search'],
    defaultOutputTargets: ['field-handover', 'risk-monitor-card', 'access-constraint-brief'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'security-crisis-monitoring',
    label: 'Security and Crisis Monitoring',
    audience: 'Crisis rooms, early-warning teams, and situation-monitoring users.',
    capsuleCoreHints: ['situation', 'time', 'source', 'tool'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'grounded-search', 'bigquery-analytics'],
    defaultOutputTargets: ['scenario-risk-dashboard-card', 'daily-brief', 'indicator-watchlist'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'research-strategy',
    label: 'Research Strategy and Analytics',
    audience: 'Analysts building evidence packs, evals, assumptions checks, and research agendas.',
    capsuleCoreHints: ['objective', 'source', 'tool', 'memory', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus', 'bigquery-analytics'],
    defaultOutputTargets: ['evidence-sourceability-annex', 'research-memo', 'assumptions-register'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'public-affairs-narrative',
    label: 'Public Affairs and Narrative Risk',
    audience: 'Public communications, narrative-risk, misinformation, and briefing users.',
    capsuleCoreHints: ['situation', 'source', 'tool', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus', 'grounded-search'],
    defaultOutputTargets: ['public-language-review', 'narrative-risk-card', 'talking-points'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'corporate-risk',
    label: 'Corporate, Sanctions, and Supply-Chain Risk',
    audience: 'Corporate risk, sanctions compliance, supply-chain exposure, and board-risk users.',
    capsuleCoreHints: ['source', 'situation', 'tool', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus', 'bigquery-analytics'],
    defaultOutputTargets: ['board-risk-pack', 'sanctions-exposure-note', 'counterparty-review'],
    reviewGate: 'human-review-required',
  },
  {
    id: 'defense-capture',
    label: 'Defense Capture and Public-Sector Opportunities',
    audience: 'Capture, grant, RFP, public-sector delivery, and bid/no-bid users.',
    capsuleCoreHints: ['objective', 'source', 'tool', 'output'],
    allowedRetrievalSources: ['context-capsule', 'uploaded-document', 'curated-policy-corpus'],
    defaultOutputTargets: ['opportunity-watchlist', 'bid-no-bid-fit-matrix', 'proposal-outline-pack'],
    reviewGate: 'human-review-required',
  },
];

export function buildGoogleAgentPlatformManifest() {
  return {
    projectId: 'praxisbytacitus',
    region: 'us-central1',
    canonicalProductState: [
      'Firestore ContextCapsules',
      'Cloud SQL AgentRun ledger',
      'PRAXIS review cards',
      'PRAXIS output stores',
    ],
    agents: [
      {
        id: 'praxis-data-controller',
        runtime: 'Google ADK on Agent Runtime',
        purpose: 'Long-running document, RAG, BigQuery, and sourceability controller behind queued PRAXIS AgentRuns.',
        tools: [
          'capsule-context-reader',
          'vertex-rag-retrieval',
          'bigquery-analytics',
          'sourceability-ledger',
          'review-card-proposer',
        ],
        writes: 'proposal-only',
      },
    ],
    ragRepositories: GOOGLE_AGENT_MACRO_RAG_REPOSITORIES,
  } as const;
}

export function assessGoogleAgentPlatformReadiness(input: GoogleAgentReadinessInput = {}): GoogleAgentReadinessReport {
  const mode = input.mode ?? 'local';
  const env = input.env ?? process.env;
  const files = input.files ?? {};
  const checks: GoogleAgentReadinessCheck[] = [];

  add(checks, 'project', 'Google Cloud project', hasAny(env, ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_VERTEX_PROJECT', 'GCP_PROJECT_ID'])
    ? ['ok', projectDetail(env)]
    : [mode === 'local' ? 'warn' : 'fail', 'Set GOOGLE_CLOUD_PROJECT or GOOGLE_VERTEX_PROJECT to praxisbytacitus.']);
  add(checks, 'region', 'Google Cloud region', hasAny(env, ['GOOGLE_CLOUD_LOCATION', 'GOOGLE_VERTEX_LOCATION', 'GCP_REGION'])
    ? ['ok', regionDetail(env)]
    : [mode === 'local' ? 'warn' : 'fail', 'Set GOOGLE_CLOUD_LOCATION or GOOGLE_VERTEX_LOCATION to us-central1.']);
  add(checks, 'agent_engine_id', 'ADK Agent Runtime engine', hasAny(env, ['VERTEX_AGENT_ENGINE_ID'])
    ? ['ok', 'VERTEX_AGENT_ENGINE_ID is present.']
    : [mode === 'production' ? 'fail' : 'warn', 'Deploy the ADK data controller and mount VERTEX_AGENT_ENGINE_ID.']);
  add(checks, 'rag_corpus', 'Vertex RAG corpus', hasAny(env, ['VERTEX_RAG_CORPUS', 'VERTEX_RAG_CORPUS_RESOURCE', 'PRAXIS_RAG_CORPUS'])
    ? ['ok', 'A Vertex RAG corpus resource env is present.']
    : [mode === 'production' ? 'fail' : 'warn', 'Create/mount a Vertex RAG corpus for PRAXIS macro repositories.']);
  add(checks, 'agent_run_ledger', 'AgentRun Cloud SQL ledger', hasAny(env, ['AGENT_RUNTIME_DATABASE_URL', 'PRAXIS_DATABASE_URL', 'DATABASE_URL'])
    ? ['ok', 'AgentRun ledger env is present.']
    : [mode === 'production' ? 'fail' : 'warn', 'Set AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL.']);
  add(checks, 'worker_target', 'Cloud Tasks worker target', hasAny(env, ['AGENT_RUN_WORKER_BASE_URL', 'APP_URL', 'NEXT_PUBLIC_APP_URL'])
    ? ['ok', 'Worker target URL env is present.']
    : [mode === 'production' ? 'fail' : 'warn', 'Set AGENT_RUN_WORKER_BASE_URL or APP_URL for Cloud Tasks dispatch.']);
  add(checks, 'worker_auth', 'Cloud Tasks worker auth', hasAny(env, ['AGENT_RUN_WORKER_SHARED_SECRET']) || (
    hasAny(env, ['AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL']) && hasAny(env, ['AGENT_RUN_WORKER_OIDC_AUDIENCE'])
  )
    ? ['ok', 'Worker authentication env is present.']
    : [mode === 'production' ? 'fail' : 'warn', 'Set Cloud Tasks OIDC service account/audience or local shared secret.']);
  add(checks, 'data_controller_agent', 'PRAXIS ADK data-controller scaffold', files.dataControllerAgent
    ? ['ok', 'backend/agents/praxis_data_controller/agent.py exists.']
    : ['fail', 'Missing backend/agents/praxis_data_controller/agent.py.']);
  add(checks, 'runbook', 'Google Agent Platform runbook', files.runbook
    ? ['ok', 'Google Agent Platform runbook exists.']
    : ['fail', 'Missing docs/runbooks/GOOGLE_AGENT_PLATFORM_FOR_PRAXIS.md.']);
  add(checks, 'adk_bridge', 'PRAXIS ADK bridge', files.adkBridge
    ? ['ok', 'Existing PRAXIS ADK bridge is present.']
    : ['fail', 'Missing src/lib/agent-runtime/adk-bridge.ts.']);

  const overall = checks.some((check) => check.status === 'fail')
    ? 'fail'
    : checks.some((check) => check.status === 'warn')
      ? 'warn'
      : 'ok';

  return {
    mode,
    overall,
    checks,
    nextActions: nextActions(checks),
  };
}

function add(
  checks: GoogleAgentReadinessCheck[],
  id: string,
  label: string,
  result: [GoogleAgentReadinessStatus, string],
): void {
  checks.push({ id, label, status: result[0], detail: result[1] });
}

function hasAny(env: Record<string, string | undefined>, names: string[]): boolean {
  return names.some((name) => Boolean(env[name]?.trim()));
}

function projectDetail(env: Record<string, string | undefined>): string {
  return `project=${env.GOOGLE_CLOUD_PROJECT || env.GOOGLE_VERTEX_PROJECT || env.GCP_PROJECT_ID}`;
}

function regionDetail(env: Record<string, string | undefined>): string {
  return `region=${env.GOOGLE_CLOUD_LOCATION || env.GOOGLE_VERTEX_LOCATION || env.GCP_REGION}`;
}

function nextActions(checks: GoogleAgentReadinessCheck[]): string[] {
  return checks
    .filter((check) => check.status !== 'ok')
    .map((check) => check.detail);
}
