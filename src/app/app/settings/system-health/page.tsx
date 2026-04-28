'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Cpu,
  Database,
  Globe,
  Zap,
  Shield,
  Layers,
  Brain,
  BarChart3,
  Copy,
  ExternalLink,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { useSituationStore } from '@/stores/situation-store';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error' | 'loading';
  label?: string;
  detail?: string;
  latencyMs?: number;
}

interface SKCHealth {
  graph: boolean;
  graphType: 'neo4j' | 'firestore';
  vector: boolean;
  feeds: boolean;
  tools: boolean;
  embeddingCount: number;
}

interface BreakerState {
  name: string;
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure: number | null;
}

interface ProviderHealth {
  google: boolean;
  vertex: boolean;
  anthropic: boolean;
  firecrawl: boolean;
  parallel: boolean;
  vertexAdk: boolean;
  polar: boolean;
  polarMissing?: string[];
  providerMode?: 'vertex' | 'google' | 'offline';
  model: string;
  note: string;
}

interface FullHealth {
  skc: SKCHealth | null;
  breakers: BreakerState[];
  provider: ProviderHealth | null;
  timestamp: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HealthStatus['status'] }) {
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Checking…
      </span>
    );
  }
  const cfg = {
    ok:       { icon: CheckCircle2, cls: 'text-emerald-500', label: 'Healthy' },
    degraded: { icon: AlertCircle,  cls: 'text-amber-500',   label: 'Degraded' },
    error:    { icon: XCircle,      cls: 'text-red-500',      label: 'Error' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', cfg.cls)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function HealthRow({
  icon: Icon,
  label,
  status,
  detail,
  latencyMs,
}: {
  icon: React.ElementType;
  label: string;
  status: HealthStatus;
  detail?: string;
  latencyMs?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {(detail || status.detail) && (
            <p className="text-xs text-muted-foreground mt-0.5">{detail ?? status.detail}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {latencyMs !== undefined && (
          <span className="text-xs text-muted-foreground">{latencyMs}ms</span>
        )}
        <StatusBadge status={status.status} />
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────────────────

// Data-source activation guide. Anchored in docs/SPRINT_2026-04-25.md so the
// user can self-serve turning on the paid/freemium feeds without leaving the
// app. Each step links the vendor signup page, names the exact env var, and
// states the cost up front.
const ACTIVATION_STEPS: Array<{
  id: string;
  name: string;
  status: 'free-live' | 'unconfigured-paid' | 'unconfigured-free' | 'paid-live';
  why: string;
  envVars: string[];
  signupUrl?: string;
  costNote: string;
  effort: string;
}> = [
  {
    id: 'firecrawl',
    name: 'Firecrawl Web Intelligence',
    status: 'paid-live',
    why: 'Premium search, scrape, crawl, map, and structured extraction for hard-to-parse policy sites, PDFs, source monitors, and knowledge-base ingestion. Free PRAXIS research still works without it through Google/open-source fallbacks.',
    envVars: ['FIRECRAWL_API_KEY'],
    signupUrl: 'https://docs.firecrawl.dev/',
    costNote: 'Credit-based. Keep broad crawls, maps, and structured extraction behind paid/trial workflows or support approval.',
    effort: '~15 min',
  },
  {
    id: 'parallel',
    name: 'Parallel Search MCP + API',
    status: 'paid-live',
    why: 'LLM-optimized web search for contested claims, second-source checks, entity enrichment, and agent research. Codex MCP is configured as parallel-search with PARALLEL_API_KEY bearer auth.',
    envVars: ['PARALLEL_API_KEY'],
    signupUrl: 'https://docs.parallel.ai/getting-started/overview',
    costNote: 'Usage-based. Use basic search for routine source discovery; reserve advanced/deep tasks for paid or trial users.',
    effort: '~15 min',
  },
  {
    id: 'vertex-adk',
    name: 'Vertex AI Agent Engine (Deep Research Agent)',
    status: 'unconfigured-paid',
    why: 'Multi-agent reasoning pipeline (planner → researcher → synthesizer) on top of Google Search. Without it, Deep Research Agent falls back to single-shot Gemini grounded search.',
    envVars: ['VERTEX_AGENT_ENGINE_ID'],
    signupUrl: 'https://console.cloud.google.com/vertex-ai/reasoning-engines',
    costNote: 'Pay-per-token (~$0.25 / 1M tokens, billed inside the praxisbytacitus GCP project — no third-party vendor)',
    effort: '~1–2 h',
  },
  {
    id: 'gdelt-bq',
    name: 'GDELT BigQuery hot slice',
    status: 'unconfigured-free',
    why: 'Materialise the last 7 days of GDELT GKG into praxis_analytics for sub-200ms per-situation reads. Today we hit the public dataset directly (still fast, but cold).',
    envVars: [],
    signupUrl: 'https://docs.cloud.google.com/bigquery/public-data',
    costNote: 'Free for the first 1 TB/month. See docs/implementation/gdelt-ingestion-2026-04-25.md',
    effort: '~2 h',
  },
  {
    id: 'polar',
    name: 'Polar Billing (subscriptions)',
    status: 'unconfigured-paid',
    why: 'Required for live monthly subscriptions. Until configured, /api/polar/checkout returns 503 and users stay on the free plan.',
    envVars: ['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET', 'POLAR_PRODUCT_ANALYST', 'POLAR_PRODUCT_TEAM'],
    signupUrl: 'https://polar.sh/tacitus',
    costNote: 'Polar Merchant of Record fees apply; use a 14-day trial on self-serve plans',
    effort: '~2 h',
  },
];

function getActivationState(
  stepId: string,
  providerHealth: ProviderHealth | null | undefined,
): { label: string; className: string; detail?: string } {
  if (!providerHealth) {
    return {
      label: 'Checking',
      className: 'border-border bg-muted text-muted-foreground',
    };
  }

  const activeClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  const missingClass = 'border-amber-500/30 bg-amber-500/10 text-amber-700';

  switch (stepId) {
    case 'firecrawl':
      return providerHealth.firecrawl
        ? { label: 'Live', className: activeClass }
        : { label: 'Needs key', className: missingClass, detail: 'FIRECRAWL_API_KEY is not mounted' };
    case 'parallel':
      return providerHealth.parallel
        ? { label: 'Live', className: activeClass }
        : { label: 'Needs key', className: missingClass, detail: 'PARALLEL_API_KEY is not mounted' };
    case 'vertex-adk':
      return providerHealth.vertexAdk
        ? { label: 'Live', className: activeClass }
        : { label: 'Needs engine', className: missingClass, detail: 'VERTEX_AGENT_ENGINE_ID is not mounted' };
    case 'polar':
      return providerHealth.polar
        ? { label: 'Live', className: activeClass }
        : {
            label: 'Needs setup',
            className: missingClass,
            detail:
              providerHealth.polarMissing && providerHealth.polarMissing.length > 0
                ? `Missing ${providerHealth.polarMissing.join(', ')}`
                : 'Polar secrets are not fully mounted',
          };
    case 'gdelt-bq':
      return {
        label: 'Optional',
        className: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
        detail: 'Public BigQuery fallback remains available',
      };
    default:
      return { label: 'Optional', className: 'border-border bg-muted text-muted-foreground' };
  }
}

export default function SystemHealthPage() {
  const { user, credits } = useAuth();
  const { activeSituation } = useSituationStore();
  const [health, setHealth] = useState<FullHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const situationId = activeSituation?.id ?? 'health-check';

      const [skcRes, breakerRes, providerRes] = await Promise.allSettled([
        fetch(`/api/health/skc?situationId=${situationId}`).then((r) => r.json()),
        fetch('/api/health/breakers').then((r) => r.json()),
        fetch('/api/health/provider').then((r) => r.json()),
      ]);

      setHealth({
        skc:
          skcRes.status === 'fulfilled' && skcRes.value?.layers
            ? (skcRes.value.layers as SKCHealth)
            : null,
        breakers:
          breakerRes.status === 'fulfilled' && Array.isArray(breakerRes.value?.breakers)
            ? (breakerRes.value.breakers as BreakerState[])
            : [],
        provider:
          providerRes.status === 'fulfilled' && providerRes.value?.google !== undefined
            ? (providerRes.value as ProviderHealth)
            : null,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, [activeSituation?.id]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // ── Derive display statuses ─────────────────────────────────────────────

  const skcHealth = health?.skc;
  const providerHealth = health?.provider;
  const breakers = useMemo(() => health?.breakers ?? [], [health?.breakers]);

  // ── Diagnostic snapshot — copy-to-clipboard so the user can paste a
  //    structured report into Slack / Codex / Claude Code without
  //    screenshotting half the page. The snapshot omits credentials.
  const copyDiagnosticSnapshot = useCallback(async () => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      domain: typeof window !== 'undefined' ? window.location.host : 'unknown',
      user: user
        ? {
            id: user.id,
            email: user.email,
            isDemo: user.isDemo,
            subscription: user.subscription,
            role: user.role,
            orgName: user.orgName,
          }
        : null,
      activeSituation: activeSituation
        ? {
            id: activeSituation.id,
            name: activeSituation.name,
            region: activeSituation.region,
            type: activeSituation.type,
            riskScore: activeSituation.riskScore,
            glaslStage: activeSituation.glaslStage,
            domain: activeSituation.domain,
          }
        : null,
      provider: providerHealth,
      skc: skcHealth,
      breakers,
      timestamp: health?.timestamp ?? null,
    };
    const text = '```json\n' + JSON.stringify(snapshot, null, 2) + '\n```';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: log so the user can copy from the console.
      console.log('[system-health snapshot]', text);
    }
  }, [user, activeSituation, providerHealth, skcHealth, breakers, health?.timestamp]);

  const openBreakers = breakers.filter((b) => b.state === 'open').length;
  const halfOpenBreakers = breakers.filter((b) => b.state === 'half-open').length;

  const overallStatus: HealthStatus['status'] =
    loading ? 'loading'
    : !providerHealth?.google && !providerHealth?.vertex ? 'error'
    : openBreakers > 2 ? 'degraded'
    : !skcHealth?.graph ? 'degraded'
    : 'ok';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of AI providers, data feeds, and knowledge layers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last checked {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={copyDiagnosticSnapshot}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
            title="Copy a JSON snapshot of system status, your account, and the active situation. Paste into Slack / Codex / Claude Code to share context."
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy diagnostic
              </>
            )}
          </button>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Overall status banner ────────────────────────────────────────── */}
      <div
        className={cn(
          'rounded-lg p-4 flex items-center gap-3',
          overallStatus === 'ok'       && 'bg-emerald-500/10 border border-emerald-500/20',
          overallStatus === 'degraded' && 'bg-amber-500/10 border border-amber-500/20',
          overallStatus === 'error'    && 'bg-red-500/10 border border-red-500/20',
          overallStatus === 'loading'  && 'bg-muted border border-border',
        )}
      >
        <Activity
          className={cn(
            'h-5 w-5 shrink-0',
            overallStatus === 'ok'       && 'text-emerald-500',
            overallStatus === 'degraded' && 'text-amber-500',
            overallStatus === 'error'    && 'text-red-500',
            overallStatus === 'loading'  && 'text-muted-foreground animate-pulse',
          )}
        />
        <div>
          <p className="text-sm font-semibold">
            {overallStatus === 'ok'       && 'All systems operational'}
            {overallStatus === 'degraded' && `Degraded — ${openBreakers} circuit breaker${openBreakers !== 1 ? 's' : ''} open`}
            {overallStatus === 'error'    && 'Critical: AI provider not configured'}
            {overallStatus === 'loading'  && 'Running health checks…'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeSituation
              ? `Checked against situation: "${activeSituation.name}"`
              : 'No active situation — checking global health'}
          </p>
        </div>
      </div>

      {/* ── AI Provider ─────────────────────────────────────────────────── */}
      <Card title="AI Provider" icon={Brain}>
        <HealthRow
          icon={Cpu}
          label="Google AI Studio (Gemini 2.5 Flash)"
          status={{ status: loading ? 'loading' : providerHealth?.google ? 'ok' : 'error' }}
          detail={providerHealth?.note ?? 'Set GOOGLE_AI_API_KEY'}
        />
        <HealthRow
          icon={Shield}
          label="Google Vertex AI"
          status={{ status: loading ? 'loading' : providerHealth?.vertex ? 'ok' : 'degraded' }}
          detail={providerHealth?.vertex ? 'Active — enterprise tier' : 'Optional — set AI_PROVIDER=vertex + GOOGLE_VERTEX_PROJECT'}
        />
        <HealthRow
          icon={Brain}
          label="Anthropic Claude (Deep Analysis)"
          status={{ status: loading ? 'loading' : providerHealth?.anthropic ? 'ok' : 'degraded' }}
          detail={providerHealth?.anthropic ? 'Active — used for deep analysis' : 'Optional — set ANTHROPIC_API_KEY'}
        />
        <HealthRow
          icon={Globe}
          label="Firecrawl Web Intelligence"
          status={{ status: loading ? 'loading' : providerHealth?.firecrawl ? 'ok' : 'degraded' }}
          detail={providerHealth?.firecrawl ? 'Active — premium web extraction enabled' : 'Optional — set FIRECRAWL_API_KEY'}
        />
        <HealthRow
          icon={Zap}
          label="Parallel Search API"
          status={{ status: loading ? 'loading' : providerHealth?.parallel ? 'ok' : 'degraded' }}
          detail={providerHealth?.parallel ? 'Active — LLM-optimized source discovery enabled' : 'Optional — set PARALLEL_API_KEY'}
        />
        <HealthRow
          icon={Layers}
          label="Vertex AI Agent Engine"
          status={{ status: loading ? 'loading' : providerHealth?.vertexAdk ? 'ok' : 'degraded' }}
          detail={providerHealth?.vertexAdk ? 'Active — managed deep research agent enabled' : 'Optional — set VERTEX_AGENT_ENGINE_ID'}
        />
        <HealthRow
          icon={Plug}
          label="Polar Billing"
          status={{ status: loading ? 'loading' : providerHealth?.polar ? 'ok' : 'degraded' }}
          detail={
            providerHealth?.polar
              ? 'Active — subscription checkout enabled'
              : providerHealth?.polarMissing?.length
                ? `Optional — missing ${providerHealth.polarMissing.join(', ')}`
                : 'Optional — set Polar token, webhook secret, and product IDs'
          }
        />
        {providerHealth?.model && (
          <div className="mt-2 pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Active model: <span className="font-mono">{providerHealth.model}</span>
              {providerHealth.providerMode ? (
                <>
                  {' '}via <span className="font-mono">{providerHealth.providerMode}</span>
                </>
              ) : null}
            </p>
          </div>
        )}
      </Card>

      {/* ── Situation Knowledge Core ────────────────────────────────────── */}
      <Card title="Situation Knowledge Core (SKC)" icon={Layers}>
        <HealthRow
          icon={Database}
          label={`Graph Layer — ${skcHealth?.graphType === 'neo4j' ? 'Neo4j' : 'Firestore'}`}
          status={{ status: loading ? 'loading' : skcHealth?.graph ? 'ok' : 'degraded' }}
          detail={
            skcHealth?.graphType === 'neo4j'
              ? 'Neo4j connected — full graph analytics'
              : 'Firestore graph — betweenness, BFS, communities (zero config)'
          }
        />
        <HealthRow
          icon={Zap}
          label="Vector Search (768-dim KNN)"
          status={{ status: loading ? 'loading' : skcHealth?.vector ? 'ok' : 'degraded' }}
          detail={
            skcHealth?.vector
              ? `Active — ${skcHealth.embeddingCount} embeddings indexed`
              : 'Disabled — set GOOGLE_AI_API_KEY for gemini-embedding-2-preview'
          }
        />
        <HealthRow
          icon={Globe}
          label="Feed Cache Layer"
          status={{ status: loading ? 'loading' : skcHealth?.feeds ? 'ok' : 'degraded' }}
          detail="TTL-cached GDELT, UCDP, HDX, ReliefWeb, UNHCR, UN News, World Bank"
        />
        <HealthRow
          icon={BarChart3}
          label="Cross-Tool Output Layer"
          status={{ status: loading ? 'loading' : skcHealth?.tools ? 'ok' : 'degraded' }}
          detail="Referenced prior analyses from dependent tools"
        />
      </Card>

      {/* ── Circuit Breakers ────────────────────────────────────────────── */}
      <Card title="External Service Circuit Breakers" icon={Shield}>
        {loading ? (
          <p className="text-sm text-muted-foreground py-2">Checking breaker states…</p>
        ) : breakers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Breaker health endpoint not available — deploy /api/health/breakers
          </p>
        ) : (
          breakers.map((b) => (
            <HealthRow
              key={b.name}
              icon={b.state === 'open' ? XCircle : b.state === 'half-open' ? AlertCircle : CheckCircle2}
              label={b.name}
              status={{
                status: b.state === 'open' ? 'error' : b.state === 'half-open' ? 'degraded' : 'ok',
              }}
              detail={
                b.state === 'open'
                  ? `Circuit open — ${b.failures} failures. Last failure: ${b.lastFailure ? new Date(b.lastFailure).toLocaleTimeString() : 'unknown'}`
                  : b.state === 'half-open'
                  ? `Testing recovery — ${b.failures} failures recorded`
                  : `Healthy — ${b.failures} recent failures`
              }
            />
          ))
        )}
        {openBreakers + halfOpenBreakers > 0 && (
          <div className="mt-2 pt-2 border-t border-border/40">
            <p className="text-xs text-amber-600 font-medium">
              {openBreakers} service{openBreakers !== 1 ? 's' : ''} offline,
              {' '}{halfOpenBreakers} recovering.
              Gemini grounded search is the active fallback.
            </p>
          </div>
        )}
      </Card>

      {/* ── Credits ────────────────────────────────────────────────────── */}
      <Card title="Account" icon={Activity}>
        <HealthRow
          icon={Zap}
          label="Workspace Capacity"
          status={{ status: credits > 100 ? 'ok' : credits > 20 ? 'degraded' : 'error' }}
          detail={`${credits?.toLocaleString() ?? '—'} credits remaining`}
        />
        <HealthRow
          icon={CheckCircle2}
          label="Authentication"
          status={{ status: user ? 'ok' : 'error' }}
          detail={user ? `Signed in as ${user.email}` : 'Not authenticated'}
        />
      </Card>

      {/* ── Data source activation guide ─────────────────────────────────── */}
      <Card title="Activate paid / freemium data sources" icon={Plug}>
        <p className="mb-3 text-xs text-muted-foreground">
          PRAXIS works out-of-the-box on open-data feeds plus Vertex AI / Gemini and
          grounded research fallbacks. Firecrawl and Parallel are premium accelerators:
          use them for deeper source acquisition, not as a prerequisite for free value.
          Each source degrades gracefully if its env var is missing.
        </p>
        <ol className="space-y-3">
          {ACTIVATION_STEPS.map((step, i) => {
            const activation = getActivationState(step.id, providerHealth);

            return (
              <li
                key={step.id}
                className="rounded-md border border-border/60 bg-muted/30 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {i + 1}. {step.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.why}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        activation.className,
                      )}
                    >
                      {activation.label}
                    </span>
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {step.effort}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  {step.envVars.length > 0 ? (
                    <span className="font-mono text-muted-foreground">
                      env:&nbsp;{step.envVars.join(', ')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No app secret required</span>
                  )}
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{activation.detail ?? step.costNote}</span>
                  {step.signupUrl ? (
                    <a
                      href={step.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-medium text-foreground hover:bg-accent"
                    >
                      Sign up
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11px] text-muted-foreground">
          After signup, store every value in Google Secret Manager
          (project <span className="font-mono">praxisbytacitus</span>) and reference
          it in <span className="font-mono">cloudbuild.yaml</span>. Never commit a key
          to the repo. See <span className="font-mono">docs/SPRINT_2026-04-25.md</span>{' '}
          for the full activation checklist.
        </p>
      </Card>

      {/* ── Pre-flight checklist ─────────────────────────────────────────── */}
      <Card title="Pre-flight Checklist" icon={CheckCircle2}>
        {[
          { label: 'GOOGLE_AI_API_KEY configured', pass: !!providerHealth?.google },
          { label: 'Firebase Admin SDK available', pass: !!user },
          { label: 'SKC graph layer active', pass: !!skcHealth?.graph },
          { label: 'No circuit breakers open', pass: openBreakers === 0 },
          { label: 'Credits available (>20)', pass: credits > 20 },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-1.5">
            <span className="text-sm">{item.label}</span>
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : item.pass ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
