export type AppDiagnosticStatus = 'healthy' | 'blocked' | 'degraded' | 'stale' | 'needs-auth';
export type AppDiagnosticGroup = 'Runtime' | 'Agentic research' | 'Capsules' | 'Search' | 'Graph/provenance' | 'Auth canary';
export type AppDiagnosticSource = 'local audit' | 'live endpoint' | 'static route check' | 'skipped canary gate';

export type AppDiagnosticRedFlag = {
  id: string;
  label: string;
  status: AppDiagnosticStatus;
  detail: string;
  repairAction: string;
  source: AppDiagnosticSource;
  href?: string;
};

type RuntimeHealthInput = {
  status: 'ok' | 'degraded' | 'down' | 'unconfigured';
  summary: string;
  checkedAt: string;
  checks?: Array<{ id: string; label: string; status: string; repairAction?: string }>;
};

type AgenticSearchInput = {
  status: 'ready' | 'degraded' | 'blocked';
  summary: string;
  checkedAt: string;
  missing?: string[];
  checks?: Array<{ id: string; label: string; status: string; detail?: string }>;
};

export type AppDiagnosticSummaryInput = {
  runtimeHealth?: RuntimeHealthInput | null;
  agenticSearchHealth?: AgenticSearchInput | null;
  graphFreshness?: { status: 'healthy' | 'stale' | 'degraded'; detail: string } | null;
  authCanary?: { missingEnvVars?: string[]; presentEnvVars?: string[] } | null;
  appSearchAudit?: { status: 'ok' | 'degraded' | 'blocked'; detail: string } | null;
  capsuleAudit?: { status: 'ok' | 'degraded' | 'blocked'; detail: string } | null;
};

export type AppDiagnosticSummary = {
  groups: Record<AppDiagnosticGroup, AppDiagnosticRedFlag[]>;
};

export function buildAppDiagnosticSummary(input: AppDiagnosticSummaryInput): AppDiagnosticSummary {
  const groups: Record<AppDiagnosticGroup, AppDiagnosticRedFlag[]> = {
    Runtime: [],
    'Agentic research': [],
    Capsules: [],
    Search: [],
    'Graph/provenance': [],
    'Auth canary': [],
  };

  groups.Runtime.push(runtimeFlag(input.runtimeHealth ?? null));
  groups['Agentic research'].push(agenticResearchFlag(input.agenticSearchHealth ?? null));
  groups.Capsules.push(capsuleFlag(input.capsuleAudit ?? null));
  groups.Search.push(searchFlag(input.appSearchAudit ?? null));
  groups['Graph/provenance'].push(graphFlag(input.graphFreshness ?? null));
  groups['Auth canary'].push(authCanaryFlag(input.authCanary ?? null));

  return { groups };
}

function runtimeFlag(runtime: RuntimeHealthInput | null): AppDiagnosticRedFlag {
  if (!runtime) {
    return flag('runtime-health', 'Runtime health', 'degraded', 'Runtime health has not loaded yet.', 'Refresh checks or run npm run audit:runtime-health-live.', 'live endpoint', '/api/health/runtime');
  }
  if (runtime.status === 'ok') {
    return flag('runtime-health', 'Runtime health', 'healthy', runtime.summary, 'Keep npm run audit:runtime-health-live in the ship gate.', 'live endpoint', '/api/health/runtime');
  }
  return flag('runtime-health', 'Runtime health', runtime.status === 'down' ? 'blocked' : 'degraded', runtime.summary, 'Run npm run audit:runtime-health-live and inspect failing checks.', 'live endpoint', '/api/health/runtime');
}

function agenticResearchFlag(health: AgenticSearchInput | null): AppDiagnosticRedFlag {
  if (!health) {
    return flag('agentic-search-health', 'Research runtime', 'degraded', 'Agentic-search health has not loaded yet.', 'Refresh checks or run npm run audit:agentic-search.', 'local audit', '/api/health/agentic-search');
  }
  if (health.status === 'ready') {
    return flag('agentic-search-health', 'Research runtime', 'healthy', health.summary, 'Keep npm run audit:agentic-search in the validation lane.', 'local audit', '/api/health/agentic-search');
  }
  const missing = health.missing?.length ? ` Missing: ${health.missing.join('; ')}.` : '';
  return flag('agentic-search-health', 'Research runtime', health.status, `${health.summary}.${missing}`, 'Run npm run audit:agentic-search and repair the blocked runtime contract.', 'local audit', '/api/health/agentic-search');
}

function capsuleFlag(input: AppDiagnosticSummaryInput['capsuleAudit']): AppDiagnosticRedFlag {
  if (!input || input.status === 'ok') {
    return flag('capsule-contracts', 'Capsule contracts', 'healthy', input?.detail ?? 'Starter capsules, review gates, and Capsule+ contracts are checked by local audits.', 'Run npm run audit:capsule-contract before deploy.', 'local audit', '/app/capsules');
  }
  return flag('capsule-contracts', 'Capsule contracts', input.status === 'blocked' ? 'blocked' : 'degraded', input.detail, 'Run npm run audit:capsule-contract and inspect the listed capsule contract.', 'local audit', '/app/capsules');
}

function searchFlag(input: AppDiagnosticSummaryInput['appSearchAudit']): AppDiagnosticRedFlag {
  if (!input || input.status === 'ok') {
    return flag('app-search-contracts', 'App search contracts', 'healthy', input?.detail ?? 'Command IDs, routes, and diagnostic targets are route-safe.', 'Run npm run audit:app-search after changing command or capsule search surfaces.', 'static route check', '/app');
  }
  return flag('app-search-contracts', 'App search contracts', input.status === 'blocked' ? 'blocked' : 'degraded', input.detail, 'Run npm run audit:app-search and fix the reported command or route.', 'static route check', '/app');
}

function graphFlag(graph: AppDiagnosticSummaryInput['graphFreshness']): AppDiagnosticRedFlag {
  if (!graph) {
    return flag('graphify-freshness', 'Graphify freshness', 'degraded', 'Graphify freshness is checked by npm run audit:app-search in the local repo.', 'Run npm run audit:app-search or graphify update . after code edits.', 'local audit');
  }
  if (graph.status === 'healthy') {
    return flag('graphify-freshness', 'Graphify freshness', 'healthy', graph.detail, 'Refresh with graphify update . after code changes.', 'local audit');
  }
  return flag('graphify-freshness', 'Graphify freshness', graph.status, graph.detail, 'Run graphify update . and rerun npm run audit:app-search.', 'local audit');
}

function authCanaryFlag(auth: AppDiagnosticSummaryInput['authCanary']): AppDiagnosticRedFlag {
  const missing = auth?.missingEnvVars?.filter((name) => name === 'TEST_FIREBASE_EMAIL' || name === 'TEST_FIREBASE_PASSWORD') ?? ['TEST_FIREBASE_EMAIL', 'TEST_FIREBASE_PASSWORD'];
  if (!missing.length) {
    return flag('auth-canary-env', 'Authenticated canary', 'healthy', 'TEST_FIREBASE_EMAIL and TEST_FIREBASE_PASSWORD are present in the diagnostic shell.', 'Run npm run test:auth-runtime when a canary lane is needed.', 'skipped canary gate');
  }
  return flag('auth-canary-env', 'Authenticated canary', 'needs-auth', `Missing ${missing.join(' / ')}; authenticated canaries are skipped until these env vars exist.`, 'Set TEST_FIREBASE_EMAIL and TEST_FIREBASE_PASSWORD in the shell, then run npm run test:auth-runtime.', 'skipped canary gate');
}

function flag(
  id: string,
  label: string,
  status: AppDiagnosticStatus,
  detail: string,
  repairAction: string,
  source: AppDiagnosticSource,
  href?: string,
): AppDiagnosticRedFlag {
  return { id, label, status, detail, repairAction, source, ...(href ? { href } : {}) };
}
