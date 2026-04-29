'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useSituationStore } from '@/stores/situation-store';
import { useConflictStore } from '@/stores/conflict-store';
import { SituationOnboarding } from '@/components/praxis/situation-onboarding';
import { IntelligenceFeed } from '@/components/praxis/intelligence-feed';
import { cn } from '@/lib/utils/cn';
import {
  MessageSquare, FileText, Search, Upload, Compass, Network,
  Globe, Users, AlertTriangle, BarChart3, GitBranch, Scale,
  Sparkles, Plus, ArrowRight, TrendingUp, TrendingDown, Minus,
  Loader2, Clock, RefreshCw, X, CheckCircle2, Link2, Play,
  Shield, BookOpen, Target, Eye, Newspaper,
} from 'lucide-react';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { EscalationLadder } from '@/components/visualizations/escalation-ladder';
import { RiskGauge } from '@/components/visualizations/risk-gauge';
import type { Situation } from '@/types/situation';
import { recordActivity, getRecentActivity, type ActivityEntry } from '@/lib/utils/activity';
import { db } from '@/lib/firebase/config';
import { onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/auth-context';
import { useAllToolStatuses, type ToolStatusInfo } from '@/hooks/use-tool-status';

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Daily Digest Card
// ---------------------------------------------------------------------------

function buildDemoDailyBrief(situation: Situation): string {
  const actors = situation.actors.slice(0, 3).join(', ') || 'the named actors';
  const region = situation.region || 'the selected region';

  return `**Situation Update** — ${situation.name} remains active in ${region}, with ${actors} shaping the current risk picture.

**Priority Actions** — Review the graph, risk monitor, and briefing tools to see how PRAXIS turns situation data into reusable analysis.

**Watch Points** — Track escalation trend, actor leverage, source coverage, and whether new documents change the assessment.`;
}

function DailyDigestCard({ situation }: { situation: Situation }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const generated = useRef(false);

  const generate = useCallback(async () => {
    if (loading) return;

    if (isDemo) {
      setBrief(buildDemoDailyBrief(situation));
      return;
    }

    setLoading(true);
    setBrief('');
    try {
      const prompt = `Generate a concise morning intelligence brief for the situation: "${situation.name}" (${situation.region || 'unspecified region'}).

Key details:
- Type: ${situation.type}
- Status: ${situation.status}
- Risk Score: ${situation.riskScore}/10
- Escalation Trend: ${situation.escalationTrend}
- Key Actors: ${situation.actors.slice(0, 6).join(', ') || 'to be identified'}
- Description: ${situation.description || 'No description provided'}

Structure your brief in 3 short sections using **bold headers**:
**Situation Update** — current status and key developments
**Priority Actions** — what the analyst should focus on today
**Watch Points** — indicators to monitor in the next 24-48 hours

Keep it under 120 words, professional, UN-standard diplomatic language.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) throw new Error('Brief failed');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const m = line.match(/^0:"(.*)"$/);
          if (m) {
            acc += JSON.parse(`"${m[1]}"`);
            setBrief(acc);
          }
        }
      }
    } catch {
      setBrief('_Brief generation failed. Check AI service configuration._');
    } finally {
      setLoading(false);
    }
  }, [isDemo, loading, situation]);

  // Auto-generate on first mount. Health route reports `checks.ai_provider = 'ok'`
  // when either GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT is configured. We
  // default to generating on mount — if the call fails the catch below shows
  // a friendly message.
  useEffect(() => {
    if (isDemo) {
      generated.current = true;
      setBrief(buildDemoDailyBrief(situation));
      return;
    }

    if (!generated.current) {
      generated.current = true;
      fetch('/api/health')
        .then((r) => r.json())
        .then((data) => {
          const aiOk = data?.checks?.ai_provider === 'ok' || data?.services?.googleAI;
          if (aiOk) {
            generate();
          } else {
            setBrief('_Brief generation is unavailable because no AI provider is configured for this workspace._');
          }
        })
        .catch(() => {
          // Don't show a scary message on network failure — just try to generate.
          generate();
        });
    }
  }, [generate, isDemo, situation]);

  if (dismissed) return null;

  return (
    <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/4 via-white to-transparent">
      <div className="flex items-center justify-between border-b border-gold-500/15 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-600" />
          <h2 className="text-sm font-semibold text-navy-900">Daily Intelligence Brief</h2>
          <span className="rounded-full bg-gold-500/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-700">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-navy-500 hover:text-navy-700 disabled:opacity-40"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            {loading ? 'Generating…' : 'Refresh'}
          </button>
          <button onClick={() => setDismissed(true)} className="text-navy-400 hover:text-navy-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="px-5 py-4">
        {loading && !brief ? (
          <div className="space-y-2">
            {[1, 0.8, 0.6].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded-full bg-navy-100" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        ) : brief ? (
          <div className="space-y-2 text-xs leading-relaxed text-navy-700">
            {brief.split(/\*\*([^*]+)\*\*/g).map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="block mt-2 font-semibold text-navy-900 first:mt-0">{part}</strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Activity Feed
// ---------------------------------------------------------------------------

function RecentActivityFeed({ situationId }: { situationId: string }) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setActivity(getRecentActivity(situationId));
  }, [situationId]);

  if (activity.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-3">
        <Clock className="h-4 w-4 text-navy-400" />
        <h2 className="text-sm font-semibold text-navy-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-[var(--color-app-border-light)]">
        {activity.map((entry, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-diplomatic-blue/40" />
              <PraxisLink
                href={entry.href}
                className="text-xs text-navy-700 hover:text-diplomatic-blue hover:underline"
              >
                {entry.tool}
              </PraxisLink>
            </div>
            <span className="text-[10px] text-navy-400">{formatRelTime(entry.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TREND_ICONS = {
  escalating: TrendingUp,
  'de-escalating': TrendingDown,
  stable: Minus,
  volatile: AlertTriangle,
};

const TREND_COLORS = {
  escalating: 'text-red-600 bg-red-50',
  'de-escalating': 'text-emerald-600 bg-emerald-50',
  stable: 'text-navy-500 bg-navy-50',
  volatile: 'text-amber-600 bg-amber-50',
};

// ---------------------------------------------------------------------------
// Situation Health Widget — shows tool population status
// ---------------------------------------------------------------------------

const HEALTH_TOOLS_CORE = [
  { id: 'actor-profiles', label: 'Actor Profiles', href: '/actors', icon: Users },
  { id: 'risk-monitor', label: 'Risk Monitor', href: '/risk-monitor', icon: AlertTriangle },
  { id: 'early-warning', label: 'Early Warning', href: '/early-warning', icon: BarChart3 },
  { id: 'conflict-graph', label: 'Conflict Graph', href: '/conflict-graph', icon: GitBranch },
  { id: 'stakeholder-map', label: 'Stakeholder Map', href: '/stakeholder-map', icon: Network },
] as const;

const HEALTH_TOOLS_EXTENDED = [
  { id: 'dossier', label: 'Dossier', href: '/dossier', icon: FileText },
  { id: 'negotiation', label: 'Negotiation Prep', href: '/negotiation-prep', icon: Scale },
  { id: 'media-roundup', label: 'Media Roundup', href: '/media-roundup', icon: Compass },
  { id: 'sanctions', label: 'Sanctions Tracker', href: '/sanctions', icon: Globe },
  { id: 'briefing', label: 'Briefing Room', href: '/briefing', icon: FileText },
] as const;

function ToolSemaphore({
  tool,
  isSeeded,
  statusInfo,
  onNavigate,
}: {
  tool: { id: string; label: string; href: string; icon: React.ElementType };
  isSeeded: boolean;
  statusInfo?: ToolStatusInfo;
  onNavigate: () => void;
}) {
  const Icon = tool.icon;
  const isResearching = statusInfo?.isResearching ?? false;
  const isStale = statusInfo?.isStale ?? false;

  // Determine visual state: researching > seeded+stale > seeded > not-seeded
  const borderClass = isResearching
    ? 'border-gold-300 bg-gold-50/50 hover:border-gold-400'
    : isSeeded && isStale
      ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
      : isSeeded
        ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
        : 'border-navy-200 bg-navy-50/30 hover:border-diplomatic-blue/30 hover:bg-diplomatic-blue/5';

  const iconClass = isResearching
    ? 'text-gold-600'
    : isSeeded && isStale
      ? 'text-amber-500'
      : isSeeded
        ? 'text-emerald-600'
        : 'text-navy-400';

  return (
    <button
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all text-left group',
        borderClass
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', iconClass)} />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-xs font-medium',
          isResearching ? 'text-gold-700' :
          isSeeded ? (isStale ? 'text-amber-700' : 'text-emerald-700') :
          'text-navy-600 group-hover:text-diplomatic-blue'
        )}>
          {tool.label}
        </p>
        {isResearching && (
          <p className="mt-0.5 truncate text-[10px] text-gold-500">
            {statusInfo?.researchStatus === 'fetching-sources' ? 'Gathering sources...' :
             statusInfo?.researchStatus === 'synthesizing' ? 'AI analyzing...' :
             statusInfo?.researchStatus === 'saving' ? 'Saving...' : 'Queued...'}
          </p>
        )}
        {isStale && !isResearching && (
          <p className="mt-0.5 truncate text-[10px] text-amber-500">Stale — update recommended</p>
        )}
      </div>
      {isResearching ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold-500" />
      ) : isSeeded ? (
        <CheckCircle2 className={cn('h-4 w-4 shrink-0', isStale ? 'text-amber-400' : 'text-emerald-500')} />
      ) : (
        <span className="shrink-0 rounded bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue group-hover:bg-diplomatic-blue/20 transition-colors">
          Generate
        </span>
      )}
    </button>
  );
}

function SituationHealthWidget({
  situation,
  persisted,
}: {
  situation: Situation;
  persisted: ReturnType<typeof usePersistedToolData>;
}) {
  const route = usePraxisRoute();
  const router = useRouter();

  // Determine if the situation was just created (within last 5 minutes)
  const [mountTime] = useState(() => Date.now());
  const isRecentlyCreated = mountTime - new Date(situation.updatedAt).getTime() < 5 * 60 * 1000;

  // Auto-poll for seeded tools when situation is recently created
  // Re-fetch every 8 seconds until all core tools are seeded or 3 minutes pass
  const [pollCount, setPollCount] = useState(0);
  const persistedData = persisted.data;
  const persistedClear = persisted.clear;
  useEffect(() => {
    if (!isRecentlyCreated) return;
    const snapshotData = persistedData as { seededTools?: string[] } | null;
    const seeded = snapshotData?.seededTools ?? [];
    const allCoreSeeded = HEALTH_TOOLS_CORE.every((t) => seeded.includes(t.id));
    if (allCoreSeeded || pollCount > 22) return; // Stop after ~3 min

    const timer = setTimeout(() => {
      persistedClear(); // Triggers re-fetch
      setPollCount((c) => c + 1);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isRecentlyCreated, persistedData, persistedClear, pollCount]);

  // MUST be called unconditionally before any conditional returns (Rules of Hooks)
  const allStatuses = useAllToolStatuses(situation.id);

  // If persisted data is loading on first mount, show skeleton
  if (persisted.isLoading && !persisted.data) return null;

  // If no snapshot data and situation was just created, show building state
  if (!persisted.data && isRecentlyCreated) {
    return (
      <div className="rounded-xl border border-diplomatic-blue/20 bg-gradient-to-r from-diplomatic-blue/4 via-white to-diplomatic-blue/4 p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-diplomatic-blue" />
          <div>
            <p className="text-sm font-semibold text-navy-900">PRAXIS is building your intelligence...</p>
            <p className="mt-0.5 text-xs text-navy-500">
              Researching, analyzing actors, assessing risks, mapping stakeholders. Tools will light up as they complete.
            </p>
          </div>
        </div>
        {/* Progress skeleton for core tools */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {HEALTH_TOOLS_CORE.map((tool) => (
            <div key={tool.id} className="flex items-center gap-2 rounded-lg border border-navy-100 bg-white/60 px-3 py-2.5">
              <tool.icon className="h-3.5 w-3.5 text-navy-300 animate-pulse" />
              <span className="text-xs text-navy-400">{tool.label}</span>
              <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-diplomatic-blue/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const snapshotData = persisted.data as { seededTools?: string[] } | null;
  const seededTools = snapshotData?.seededTools ?? [];
  const coreSeeded = HEALTH_TOOLS_CORE.filter((t) => seededTools.includes(t.id)).length;
  const totalCore = HEALTH_TOOLS_CORE.length;

  // allStatuses is already declared above (before conditional returns)
  const researchingCount = Object.values(allStatuses).filter((s) => s.isResearching).length;
  const staleCount = Object.values(allStatuses).filter((s) => s.isStale).length;

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-700">Intelligence Readiness</h2>
        <div className="flex items-center gap-2">
          {researchingCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-gold-50 px-2 py-0.5">
              <Loader2 className="h-3 w-3 animate-spin text-gold-500" />
              <span className="text-[10px] font-medium text-gold-600">
                {researchingCount} researching
              </span>
            </div>
          )}
          {staleCount > 0 && !researchingCount && (
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5">
              <span className="text-[10px] font-medium text-amber-600">
                {staleCount} stale
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className={cn(
              'h-2 w-2 rounded-full',
              coreSeeded === totalCore ? 'bg-emerald-500' : coreSeeded > 0 ? 'bg-gold-500' : 'bg-navy-300'
            )} />
            <span className="text-[10px] font-medium text-navy-500">
              {coreSeeded}/{totalCore} core tools ready
            </span>
          </div>
          {isRecentlyCreated && coreSeeded < totalCore && (
            <Loader2 className="h-3 w-3 animate-spin text-diplomatic-blue" />
          )}
        </div>
      </div>

      {/* Core tools */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {HEALTH_TOOLS_CORE.map((tool) => (
          <ToolSemaphore
            key={tool.id}
            tool={tool}
            isSeeded={seededTools.includes(tool.id)}
            statusInfo={allStatuses[tool.id]}
            onNavigate={() => router.push(route(tool.href))}
          />
        ))}
      </div>

      {/* Extended tools */}
      <div className="mt-3 border-t border-navy-100 pt-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-navy-400">Analysis & Intelligence Tools</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {HEALTH_TOOLS_EXTENDED.map((tool) => (
            <ToolSemaphore
              key={tool.id}
              tool={tool}
              isSeeded={seededTools.includes(tool.id)}
              statusInfo={allStatuses[tool.id]}
              onNavigate={() => router.push(route(tool.href))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Graph Analysis types
// ---------------------------------------------------------------------------

interface GraphAnalysis {
  glaslStage?: number;
  pivotActors?: { id: string; label: string; centralityScore: number }[];
  intelligenceGaps?: string[];
  hiddenLinkages?: { source: string; target: string; description: string }[];
  lastPipelineRun?: string;
  pipelineStatus?: 'running' | 'complete' | 'failed' | 'idle';
}

// ---------------------------------------------------------------------------
// Quick Ingest Card — URL ingestion via Python backend
// ---------------------------------------------------------------------------

function QuickIngestCard({ situationId }: { situationId: string }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleIngest = useCallback(async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const { praxisBackend } = await import('@/lib/api/praxis-backend');
      await praxisBackend.ingestUrl(situationId, url.trim());
      setResult('success');
      setUrl('');
    } catch {
      setResult('error');
    } finally {
      setLoading(false);
    }
  }, [url, loading, situationId]);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-diplomatic-blue" />
        <h3 className="text-sm font-semibold text-navy-900">Quick Ingest</h3>
        <span className="ml-auto rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-semibold text-diplomatic-blue">
          Knowledge Graph
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleIngest()}
          placeholder="Paste a URL to ingest into the conflict graph..."
          className="min-w-0 flex-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder-navy-400 focus:border-diplomatic-blue/50 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/20"
        />
        <button
          onClick={handleIngest}
          disabled={loading || !url.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-diplomatic-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-diplomatic-blue/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Ingest
        </button>
      </div>
      {result === 'success' && (
        <p className="mt-2 text-[11px] font-medium text-emerald-600">URL ingested — pipeline will update the graph shortly.</p>
      )}
      {result === 'error' && (
        <p className="mt-2 text-[11px] font-medium text-red-600">Ingest failed. Ensure the Python backend is running and configured.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intelligence Summary Card — live from Firestore graph/analysis
// ---------------------------------------------------------------------------

const GLASL_STAGE_COLOR = (stage: number) =>
  stage <= 3 ? '#5B8C5A' : stage <= 6 ? '#E8B931' : '#A63D40';

const GLASL_STAGE_BG = (stage: number) =>
  stage <= 3 ? 'bg-emerald-50 text-emerald-700' : stage <= 6 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';

const GLASL_STAGE_LABELS = [
  '', 'Hardening', 'Debates', 'Actions',
  'Coalitions', 'Loss of Face', 'Threats',
  'Destructive Blows', 'Fragmentation', 'Abyss',
];

function IntelligenceSummaryCard({ situationId }: { situationId: string }) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineMsg, setPipelineMsg] = useState<string | null>(null);

  // Subscribe to Firestore graph/analysis in real time
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !situationId) return;
    const ref = doc(db, 'users', uid, 'situations', situationId, 'graph', 'analysis');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setAnalysis(snap.data() as GraphAnalysis);
      }
    });
    return unsub;
  }, [user?.id, situationId]);

  const runPipeline = useCallback(async () => {
    if (pipelineLoading) return;
    setPipelineLoading(true);
    setPipelineMsg(null);
    try {
      const { praxisBackend } = await import('@/lib/api/praxis-backend');
      await praxisBackend.runPipeline(situationId, []);
      setPipelineMsg('Pipeline started — graph will update in a few minutes.');
    } catch {
      setPipelineMsg('Pipeline failed to start. Ensure the Python backend is reachable.');
    } finally {
      setPipelineLoading(false);
    }
  }, [pipelineLoading, situationId]);

  // If no analysis yet, show a muted placeholder
  if (!analysis) {
    return (
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-diplomatic-blue" />
          <h3 className="text-sm font-semibold text-navy-900">Intelligence Summary</h3>
          <span className="ml-auto text-[10px] text-navy-400">From Knowledge Graph</span>
        </div>
        <p className="text-xs text-navy-400 text-center py-4">
          No graph analysis yet. Run the pipeline to generate conflict intelligence.
        </p>
        <div className="flex justify-center">
          <button
            onClick={runPipeline}
            disabled={pipelineLoading}
            className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/25 bg-diplomatic-blue/8 px-4 py-2 text-xs font-medium text-diplomatic-blue transition-colors hover:bg-diplomatic-blue/15 disabled:opacity-50"
          >
            {pipelineLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run Full Pipeline
          </button>
        </div>
        {pipelineMsg && <p className="mt-2 text-center text-[11px] text-navy-500">{pipelineMsg}</p>}
      </div>
    );
  }

  const pivotActors = (analysis.pivotActors ?? []).slice(0, 3);
  const gapCount = (analysis.intelligenceGaps ?? []).length;
  const linkageCount = (analysis.hiddenLinkages ?? []).length;
  const stage = analysis.glaslStage ?? 0;
  const statusColors: Record<string, string> = {
    running: 'bg-blue-50 text-blue-700',
    complete: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-red-50 text-red-700',
    idle: 'bg-navy-50 text-navy-500',
  };

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Network className="h-4 w-4 text-diplomatic-blue" />
        <h3 className="text-sm font-semibold text-navy-900">Intelligence Summary</h3>
        <span className="ml-1 rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-semibold text-diplomatic-blue">
          Knowledge Graph
        </span>
        {analysis.pipelineStatus && (
          <span className={cn('ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize', statusColors[analysis.pipelineStatus] ?? statusColors.idle)}>
            {analysis.pipelineStatus}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Glasl Stage */}
        <div className="rounded-lg bg-navy-50 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Glasl Stage</p>
          {stage > 0 ? (
            <>
              <span
                className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-bold', GLASL_STAGE_BG(stage))}
              >
                {stage}/9
              </span>
              <p className="mt-1 text-[10px] text-navy-500">{GLASL_STAGE_LABELS[stage] ?? ''}</p>
            </>
          ) : (
            <span className="text-xs text-navy-400">—</span>
          )}
        </div>

        {/* Intel Gaps */}
        <div className="rounded-lg bg-navy-50 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Intel Gaps</p>
          <p className="text-2xl font-bold text-navy-900">{gapCount}</p>
          <p className="text-[10px] text-navy-400">identified</p>
        </div>

        {/* Hidden Linkages */}
        <div className="rounded-lg bg-navy-50 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Hidden Links</p>
          <p className="text-2xl font-bold text-navy-900">{linkageCount}</p>
          <p className="text-[10px] text-navy-400">detected</p>
        </div>

        {/* Last Run */}
        <div className="rounded-lg bg-navy-50 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Last Run</p>
          <p className="text-[11px] font-medium text-navy-700">
            {analysis.lastPipelineRun
              ? new Date(analysis.lastPipelineRun).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
        </div>
      </div>

      {/* Top pivot actors */}
      {pivotActors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Top Pivot Actors</p>
          <div className="space-y-1.5">
            {pivotActors.map((actor, i) => (
              <div key={actor.id ?? i} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/10 text-[10px] font-bold text-diplomatic-blue">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-navy-800">{actor.label ?? actor.id}</span>
                <span className="shrink-0 text-[11px] font-mono text-navy-500">
                  {typeof actor.centralityScore === 'number' ? actor.centralityScore.toFixed(3) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Pipeline button */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={runPipeline}
          disabled={pipelineLoading || analysis.pipelineStatus === 'running'}
          className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/25 bg-diplomatic-blue/8 px-4 py-2 text-xs font-medium text-diplomatic-blue transition-colors hover:bg-diplomatic-blue/15 disabled:opacity-50"
        >
          {pipelineLoading || analysis.pipelineStatus === 'running'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Play className="h-3.5 w-3.5" />}
          Run Full Pipeline
        </button>
        {pipelineMsg && <p className="text-[11px] text-navy-500">{pipelineMsg}</p>}
      </div>
    </div>
  );
}

/**
 * Real PRAXIS dashboard — shows the active situation's data only.
 * No demo data, no hardcoded conflicts. Everything comes from the situation.
 */
export function SituationDashboard({ situation }: { situation: Situation }) {
  const [onboardingComplete, setOnboardingComplete] = useState(
    situation.documentCount > 0 || situation.graphEntities > 0
  );

  // Dashboard snapshot — tracks which tools have been seeded
  const persisted = usePersistedToolData('dashboard-snapshot', situation?.id);

  const syncFromSituation = useConflictStore((s: any) => s.syncFromSituation);

  // Sync situation to conflict store for global access
  useEffect(() => {
    syncFromSituation(situation);
  }, [situation, syncFromSituation]);

  // Record dashboard visit in activity log
  useEffect(() => {
    recordActivity({ tool: 'Dashboard', href: '/dashboard', situationId: situation.id });
  }, [situation.id]);

  const TrendIcon = TREND_ICONS[situation.escalationTrend] || Minus;
  const trendColor = TREND_COLORS[situation.escalationTrend] || TREND_COLORS.stable;

  const quickActions = [
    { label: 'Ask PRAXIS', desc: 'AI chat about this situation', href: '/assistant', icon: MessageSquare, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' },
    { label: 'New Report', desc: 'Generate a situation report', href: '/reports/new', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
    { label: 'Deep Research', desc: 'Search web for latest intel', href: '/assistant', icon: Search, color: 'text-gold-600', bg: 'bg-gold-500/8' },
    { label: 'Upload Sources', desc: 'Add documents for analysis', href: '/documents', icon: Upload, color: 'text-purple-600', bg: 'bg-purple-500/8' },
    { label: 'Media Scan', desc: 'Analyze media coverage', href: '/media-compass', icon: Compass, color: 'text-sky-600', bg: 'bg-sky-500/8' },
    { label: 'ARGUS Query', desc: 'Knowledge graph intelligence', href: '/argus', icon: Network, color: 'text-teal', bg: 'bg-teal/8' },
  ];

  return (
    <div className="space-y-6">
      {/* Situation Header */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-navy-900">{situation.name}</h1>
              <span className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-[11px] font-medium text-diplomatic-blue capitalize">
                {situation.type.replace('_', ' ')}
              </span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
                situation.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-100 text-navy-500')}>
                {situation.status}
              </span>
            </div>
            {situation.region && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-500">
                <Globe className="h-3.5 w-3.5" />
                {situation.region}
              </div>
            )}
            {situation.description && (
              <p className="mt-2 max-w-2xl text-sm text-navy-600 leading-relaxed">{situation.description}</p>
            )}
          </div>

          {/* Risk Score + Glasl */}
          <div className="flex flex-col items-end gap-2">
            <PraxisLink
              href={`/situations/${situation.id}/inspect`}
              className="text-[10px] text-navy-400 hover:text-navy-700 hover:underline"
            >
              Inspect situation data
            </PraxisLink>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <RiskGauge score={situation.riskScore * 10} size="sm" showValue />
                <span className="text-[10px] text-navy-400">INFORM Risk</span>
              </div>
              {situation.glaslStage && (
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold',
                    situation.glaslStage <= 3 ? 'bg-emerald-50 text-emerald-600' :
                    situation.glaslStage <= 6 ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  )}>
                    {situation.glaslStage}<span className="text-xs font-normal">/9</span>
                  </div>
                  <span className="text-[10px] text-navy-400">Glasl Stage</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-navy-100 pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-navy-400" />
            <span className="text-xs text-navy-600"><strong>{situation.actorCount}</strong> actors</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-navy-400" />
            <span className="text-xs text-navy-600"><strong>{situation.graphEntities}</strong> graph entities</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-navy-400" />
            <span className="text-xs text-navy-600"><strong>{situation.documentCount}</strong> documents</span>
          </div>
          <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {situation.escalationTrend}
          </div>
          {situation.glaslStage && (
            <div className="flex items-center gap-1.5 text-xs text-navy-500">
              <BarChart3 className="h-3.5 w-3.5" />
              Glasl Stage {situation.glaslStage}/9
            </div>
          )}
        </div>

        {/* Actors */}
        {situation.actors.length > 0 && (
          <div className="mt-4 border-t border-navy-100 pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Key Actors</p>
            <div className="flex flex-wrap gap-1.5">
              {situation.actors.map((actor) => (
                <span key={actor} className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-xs font-medium text-diplomatic-blue">
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Glasl Escalation Stage — if available */}
      {situation.glaslStage && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-4">
            <TrendingUp className="h-4 w-4 text-gold-600" />
            <h2 className="text-sm font-semibold text-navy-900">Escalation Stage (Glasl Model)</h2>
            <span className="ml-auto text-[10px] text-navy-400">
              {situation.glaslStage <= 3 ? 'Win-Win Zone' : situation.glaslStage <= 6 ? 'Win-Lose Zone' : 'Lose-Lose Zone'}
            </span>
          </div>
          <div className="px-5 py-4">
            <EscalationLadder currentStage={situation.glaslStage} orientation="horizontal" />
          </div>
        </div>
      )}

      {/* Dashboard Methodology Panel */}
      <RegistryToolInfo toolId="dashboard" />

      {/* Onboarding — shows after first creation to help populate */}
      {!onboardingComplete && (
        <SituationOnboarding
          situation={situation}
          onComplete={() => setOnboardingComplete(true)}
        />
      )}

      {/* Daily Intelligence Brief */}
      <DailyDigestCard situation={situation} />

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-700">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <PraxisLink
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', action.bg)}>
                <action.icon className={cn('h-5 w-5', action.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-900 group-hover:text-diplomatic-blue">{action.label}</p>
                <p className="text-[11px] text-navy-500">{action.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </PraxisLink>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed situationId={situation.id} />

      {/* Live Intelligence Feed */}
      <IntelligenceFeed situation={situation} />

      {/* Situation Health — tool population status */}
      <SituationHealthWidget situation={situation} persisted={persisted} />

      {/* Quick Ingest — URL ingestion into knowledge graph */}
      <QuickIngestCard situationId={situation.id} />

      {/* Intelligence Summary — live Firestore graph/analysis */}
      <IntelligenceSummaryCard situationId={situation.id} />

      {/* Getting Started Tips — show when situation is empty */}
      {situation.documentCount === 0 && situation.graphEntities === 0 && onboardingComplete && (
        <div className="rounded-xl border border-navy-200 bg-navy-50/50 p-5">
          <h3 className="text-sm font-semibold text-navy-900">Next Steps for &ldquo;{situation.name}&rdquo;</h3>
          <div className="mt-3 space-y-2">
            {[
              { text: 'Upload documents (PDFs, reports, cables) for AI extraction', action: 'Upload', href: '/documents' },
              { text: 'Ask PRAXIS to research the situation and find key actors', action: 'Chat', href: '/assistant' },
              { text: 'Generate a situation report to establish a baseline', action: 'Report', href: '/reports/new' },
              { text: 'Run a risk assessment to identify early warning indicators', action: 'Assess', href: '/risk-monitor' },
            ].map((tip) => (
              <div key={tip.text} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 border border-navy-100">
                <p className="text-xs text-navy-600">{tip.text}</p>
                <PraxisLink href={tip.href} className="shrink-0 rounded-md bg-diplomatic-blue/10 px-3 py-1 text-[11px] font-medium text-diplomatic-blue hover:bg-diplomatic-blue/20">
                  {tip.action}
                </PraxisLink>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Welcome state when user has no situations yet.
 */
const TEMPLATE_SITUATIONS = [
  {
    name: 'Syrian Civil War & Ceasefire Process',
    type: 'international' as const,
    description: 'Monitoring the Syrian conflict including the Astana/Geneva peace processes, HTS governance in northwest Syria, US/Russia/Turkey/Iran dynamics, humanitarian access, and reconstruction debates.',
    region: 'Middle East',
    actors: ['Government of Syria', 'HTS (Hayat Tahrir al-Sham)', 'SDF / AANES', 'Turkey', 'Russia', 'Iran', 'United States', 'UN Special Envoy'],
    userRole: 'analyst' as const,
    sources: ['Wikipedia', 'Reuters', 'Crisis Group', 'UN News', 'Al Jazeera'],
    tag: 'Armed conflict',
  },
  {
    name: 'Myanmar Crisis & Resistance Movement',
    type: 'civil' as const,
    description: 'Tracking the post-coup situation in Myanmar including the National Unity Government (NUG), ethnic armed organizations (EAOs), SAC military operations, humanitarian emergency, and ASEAN response.',
    region: 'Southeast Asia',
    actors: ['State Administration Council (SAC)', 'National Unity Government (NUG)', 'Peoples Defence Force (PDF)', 'Karen National Union (KNU)', 'Arakan Army', 'ASEAN', 'China', 'UN Special Envoy'],
    userRole: 'analyst' as const,
    sources: ['Wikipedia', 'Reuters', 'UCDP', 'The Irrawaddy', 'Crisis Group'],
    tag: 'Armed conflict',
  },
  {
    name: 'EU AI Act Implementation & Digital Governance',
    type: 'political' as const,
    description: 'Monitoring the implementation of the EU Artificial Intelligence Act, its impact on tech companies, compliance timelines, enforcement mechanisms, and the global regulatory ripple effect.',
    region: 'Europe',
    actors: ['European Commission', 'EU AI Office', 'Member States', 'Big Tech (Meta, Google, Microsoft)', 'Civil Society Organizations', 'European Parliament'],
    userRole: 'analyst' as const,
    sources: ['Wikipedia', 'Reuters', 'Financial Times', 'European Commission', 'IAPP'],
    tag: 'Policy/Regulatory',
  },
  {
    name: 'South China Sea Territorial Disputes',
    type: 'international' as const,
    description: 'Tracking competing territorial claims in the South China Sea between China, Philippines, Vietnam, and other ASEAN claimants. Includes UNCLOS arbitration, freedom of navigation operations, and island-building activities.',
    region: 'East Asia',
    actors: ['China (PRC)', 'Philippines', 'Vietnam', 'United States', 'ASEAN', 'Japan', 'Permanent Court of Arbitration'],
    userRole: 'observer' as const,
    sources: ['Wikipedia', 'Reuters', 'IISS', 'Asia Maritime Transparency Initiative', 'Nikkei Asia'],
    tag: 'Geopolitical',
  },
];

/**
 * Welcome state when user has no situations yet.
 */
export function WelcomeState() {
  const router = useRouter();
  const route = usePraxisRoute();
  const { addSituation } = useSituationStore();
  const [creating, setCreating] = useState<string | null>(null);

  const handleCreateTemplate = async (template: typeof TEMPLATE_SITUATIONS[number]) => {
    setCreating(template.name);
    try {
      // Create the situation via API
      const res = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          description: template.description,
          region: template.region,
          actors: template.actors,
          userRole: template.userRole,
          status: 'active',
        }),
      });

      if (res.ok) {
        const { situation } = await res.json();
        addSituation(situation);

        // Kick off comprehensive AI auto-structure research
        fetch('/api/ai/auto-structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            situationName: template.name,
            situationType: template.type,
            region: template.region,
            description: template.description,
            actors: template.actors,
            userRole: template.userRole,
            situationId: situation.id,
          }),
        }).catch(() => {}); // Fire and forget

        router.push(route('/dashboard'));
      } else {
        setCreating(null);
      }
    } catch {
      setCreating(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10">
          <Sparkles className="h-8 w-8 text-gold-600" />
        </div>
        <h1 className="text-2xl font-semibold text-navy-900">Welcome to PRAXIS</h1>
        <p className="mt-3 max-w-lg mx-auto text-sm text-navy-500 leading-relaxed">
          Create a situation to start building conflict intelligence.
          PRAXIS will research, analyze, and help you produce professional intelligence products.
        </p>

        <button
          onClick={() => router.push(route('/situations/new'))}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold-500/20 hover:bg-gold-600"
        >
          <Plus className="h-4 w-4" />
          Create Your Own Situation
        </button>
      </div>

      {/* Template situations */}
      <div className="mt-12">
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-navy-700">Or start with a template</p>
          <p className="mt-1 text-xs text-navy-400">
            AI will create the situation and research it using Wikipedia, Reuters, Crisis Group, and other trusted sources
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATE_SITUATIONS.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => handleCreateTemplate(tpl)}
              disabled={!!creating}
              className="group rounded-xl border border-navy-200 bg-white p-5 text-left transition-all hover:border-gold-500/40 hover:shadow-md disabled:opacity-60"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      tpl.tag === 'Armed conflict' ? 'bg-red-50 text-red-700' :
                      tpl.tag === 'Geopolitical' ? 'bg-blue-50 text-blue-700' :
                      'bg-purple-50 text-purple-700'
                    )}>
                      {tpl.tag}
                    </span>
                    <span className="text-[10px] text-navy-400">{tpl.region}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-navy-900 group-hover:text-gold-700 transition-colors">
                    {creating === tpl.name ? 'Creating...' : tpl.name}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-navy-500 leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
                {creating === tpl.name && (
                  <div className="ml-3 shrink-0">
                    <Sparkles className="h-5 w-5 animate-pulse text-gold-500" />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {tpl.actors.slice(0, 4).map((a) => (
                  <span key={a} className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] text-navy-500">{a}</span>
                ))}
                {tpl.actors.length > 4 && (
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] text-navy-500">+{tpl.actors.length - 4} more</span>
                )}
              </div>
              <p className="mt-2 text-[9px] text-navy-400">
                Sources: {tpl.sources.join(', ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
