'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function SystemHealthPage() {
  const { user, credits } = useAuth();
  const { activeSituation } = useSituationStore();
  const [health, setHealth] = useState<FullHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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
  const breakers = health?.breakers ?? [];

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
          label="Google AI Studio (Gemini 3 Flash)"
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
        {providerHealth?.model && (
          <div className="mt-2 pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">Active model: <span className="font-mono">{providerHealth.model}</span></p>
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
          detail="TTL-cached ACLED, GDELT, HDX, ReliefWeb, UNHCR, World Bank"
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
