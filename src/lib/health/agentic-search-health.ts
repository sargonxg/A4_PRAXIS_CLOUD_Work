export type AgenticSearchStatus = 'ready' | 'degraded' | 'blocked';

export type AgenticSearchCheckStatus = 'ready' | 'degraded' | 'blocked';

export interface AgenticSearchCheck {
  id: string;
  label: string;
  status: AgenticSearchCheckStatus;
  names: string[];
  missing?: string[];
  detail: string;
  required: boolean;
}

export interface AgenticSearchHealthReport {
  status: AgenticSearchStatus;
  summary: string;
  checkedAt: string;
  missing: string[];
  checks: AgenticSearchCheck[];
}

type Env = Record<string, string | undefined>;

export function collectAgenticSearchHealth(
  checkedAt: Date = new Date(),
  env: Env = process.env,
): AgenticSearchHealthReport {
  return summarizeAgenticSearchHealth([
    oneOfCheck({
      id: 'ledger',
      label: 'Cloud SQL run ledger',
      names: ['AGENT_RUNTIME_DATABASE_URL', 'PRAXIS_DATABASE_URL', 'DATABASE_URL'],
      required: true,
      readyDetail: 'AgentRun ledger can persist runs, events, tool calls, approvals, and artifacts.',
      missingDetail: 'Durable deep-search runs need Cloud SQL before Ask can claim queued research.',
      env,
    }),
    allOfCheck({
      id: 'cloud_tasks_queue',
      label: 'Cloud Tasks queue',
      names: ['AGENT_RUN_TASKS_PROJECT', 'AGENT_RUN_TASKS_LOCATION', 'AGENT_RUN_TASKS_QUEUE'],
      required: false,
      readyDetail: 'Cloud Tasks queue names are explicit.',
      missingDetail: 'Queue names will fall back to project defaults; verify production queue access before launch.',
      env,
    }),
    workerAuthCheck(env),
    oneOfCheck({
      id: 'vertex_runtime',
      label: 'Vertex/Gemini runtime',
      names: ['GOOGLE_VERTEX_PROJECT', 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT'],
      required: false,
      readyDetail: 'Vertex project is configured for Gemini runtime calls.',
      missingDetail: 'Vertex project config is missing; model and grounding calls may fall back or fail.',
      env,
    }),
    oneOfCheck({
      id: 'adk_runtime',
      label: 'ADK agent runtime',
      names: ['VERTEX_AGENT_ENGINE_ID', 'GOOGLE_ADK_AGENT_ENGINE_ID'],
      required: false,
      readyDetail: 'ADK/Agent Platform runtime id is configured.',
      missingDetail: 'ADK is optional for MVP but missing; deep search should remain PRAXIS-led until configured.',
      env,
    }),
    oneOfCheck({
      id: 'genkit_provider',
      label: 'Genkit provider',
      names: ['GOOGLE_GENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_VERTEX_PROJECT'],
      required: false,
      readyDetail: 'Genkit can resolve a Google provider for typed flows.',
      missingDetail: 'Genkit provider config is missing; typed flow execution may be local-only or blocked.',
      env,
    }),
    oneOfCheck({
      id: 'vertex_grounding',
      label: 'Vertex Google Search grounding',
      names: ['VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED'],
      required: false,
      readyDetail: 'Google Search grounding is explicitly enabled for current public-web research.',
      missingDetail: 'Google Search grounding is not explicitly enabled; keep current-source claims caveated.',
      env,
    }),
    oneOfCheck({
      id: 'exa_premium_search',
      label: 'Exa premium agentic search',
      names: ['EXA_API_KEY'],
      required: false,
      readyDetail: 'Exa is configured for paid Premium web conversation turns.',
      missingDetail: 'Exa Premium web is unavailable until EXA_API_KEY is configured; default grounded search remains separate.',
      env,
    }),
    oneOfCheck({
      id: 'research_graph_extra',
      label: 'Research graph extra',
      names: ['RESEARCH_GRAPH_ENABLED'],
      required: false,
      readyDetail: 'Research graph can use free GDELT DOC/API and Wikidata SPARQL receipts for optional Ask turns.',
      missingDetail: 'Research graph is disabled; Ask PRAXIS remains available and should show a degraded optional receipt when requested.',
      env,
    }),
    {
      id: 'route_imports',
      label: 'Route/runtime imports',
      status: 'ready',
      names: [
        '/api/ai/chat',
        '/api/agents/runs',
        '/api/agents/runs/[runId]/stream',
        '/api/health/agentic-search',
      ],
      detail: 'Ask, AgentRun, stream, and agentic-search health routes are part of the runtime inventory.',
      required: true,
    },
  ], checkedAt);
}

export function summarizeAgenticSearchHealth(
  checks: AgenticSearchCheck[],
  checkedAt: Date = new Date(),
): AgenticSearchHealthReport {
  const missing = checks.flatMap((check) => check.missing ?? []);
  const hasBlocked = checks.some((check) => check.status === 'blocked' && check.required);
  const hasDegraded = checks.some((check) => check.status !== 'ready');
  const status: AgenticSearchStatus = hasBlocked ? 'blocked' : hasDegraded ? 'degraded' : 'ready';
  return {
    status,
    summary: status === 'ready'
      ? 'Agentic search ready'
      : status === 'degraded'
        ? 'Agentic search degraded'
        : 'Agentic search blocked',
    checkedAt: checkedAt.toISOString(),
    missing,
    checks,
  };
}

function oneOfCheck(input: {
  id: string;
  label: string;
  names: string[];
  required: boolean;
  readyDetail: string;
  missingDetail: string;
  env: Env;
}): AgenticSearchCheck {
  const present = input.names.some((name) => Boolean(input.env[name]?.trim()));
  const missingName = input.names.join(' or ');
  return {
    id: input.id,
    label: input.label,
    status: present ? 'ready' : input.required ? 'blocked' : 'degraded',
    names: input.names,
    missing: present ? [] : [missingName],
    detail: present ? input.readyDetail : input.missingDetail,
    required: input.required,
  };
}

function allOfCheck(input: {
  id: string;
  label: string;
  names: string[];
  required: boolean;
  readyDetail: string;
  missingDetail: string;
  env: Env;
}): AgenticSearchCheck {
  const missing = input.names.filter((name) => !input.env[name]?.trim());
  return {
    id: input.id,
    label: input.label,
    status: missing.length === 0 ? 'ready' : input.required ? 'blocked' : 'degraded',
    names: input.names,
    missing,
    detail: missing.length === 0 ? input.readyDetail : input.missingDetail,
    required: input.required,
  };
}

function workerAuthCheck(env: Env): AgenticSearchCheck {
  const hasBaseUrl = Boolean(
    env.AGENT_RUN_WORKER_BASE_URL?.trim()
      || env.NEXT_PUBLIC_APP_URL?.trim()
      || env.APP_URL?.trim()
      || env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
  );
  const hasSharedSecret = Boolean(env.AGENT_RUN_WORKER_SHARED_SECRET?.trim());
  const hasOidc = Boolean(env.AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL?.trim() && env.AGENT_RUN_WORKER_OIDC_AUDIENCE?.trim());
  const missing: string[] = [];
  if (!hasBaseUrl) {
    missing.push('AGENT_RUN_WORKER_BASE_URL or NEXT_PUBLIC_APP_URL or APP_URL or VERCEL_PROJECT_PRODUCTION_URL');
  }
  if (!hasSharedSecret && !hasOidc) {
    missing.push('AGENT_RUN_WORKER_SHARED_SECRET or AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL+AGENT_RUN_WORKER_OIDC_AUDIENCE');
  }
  return {
    id: 'worker_auth',
    label: 'Worker route auth',
    status: missing.length ? 'blocked' : 'ready',
    names: [
      'AGENT_RUN_WORKER_BASE_URL',
      'NEXT_PUBLIC_APP_URL',
      'APP_URL',
      'VERCEL_PROJECT_PRODUCTION_URL',
      'AGENT_RUN_WORKER_SHARED_SECRET',
      'AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL',
      'AGENT_RUN_WORKER_OIDC_AUDIENCE',
    ],
    missing,
    detail: missing.length
      ? 'Cloud Tasks cannot safely call the worker route without a target URL and auth posture.'
      : 'Worker route target and auth posture are configured.',
    required: true,
  };
}
