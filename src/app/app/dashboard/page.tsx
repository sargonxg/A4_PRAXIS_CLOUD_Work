'use client';

/**
 * Dashboard — first-touch situation overview.
 *
 * Rebuilt per docs/superpowers/specs/2026-04-21-foundation-hardening-design.md §8.1.
 * Six widgets that compose from cached SKC reads. No blocking AI call on mount.
 * The optional "Daily read" button fires /api/ai/dashboard-summary (1 credit).
 *
 * Each widget lazy-loads and degrades independently; any one failing does not
 * break the page. In demo mode the legacy SituationDashboard is rendered for
 * continuity with prospect content.
 */

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Loader2,
  Network,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { WelcomeState } from '@/components/praxis/situation-dashboard';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { SituationStatusStrip } from '@/components/dashboard/situation-status-strip';
import { ExecutiveIntelligencePanel } from '@/components/dashboard/executive-intelligence-panel';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { ActivityFeed } from '@/components/app/activity-feed';
import { SyriaRecordingRunway } from '@/components/demo/recording-signal-runway';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import { isSyriaWorkspaceCase, SYRIA_DEMO_SITUATION } from '@/lib/constants/syria-demo-case';
import { computeSituationContextHealth } from '@/lib/context/situation-context-health';
import type { Situation } from '@/types/situation';

interface DailyRead {
  headline: string;
  body: string;
  suggestedTools: string[];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { isDemo, needsOnboarding, showGuard, situation, loading } = useSituationGuard();
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), isDemo);
  const demoSituation = isSyriaCase ? SYRIA_DEMO_SITUATION : DEMO_SITUATION;

  if (needsOnboarding) return <OnboardingRequiredState />;

  if (isDemo) {
    return (
      <div className="space-y-4 p-6">
        {isSyriaCase ? <SyriaRecordingRunway density="full" focus="overview" /> : null}
        <RealDashboard situation={demoSituation} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (showGuard || !situation) {
    return <WelcomeState />;
  }

  return <RealDashboard situation={situation} />;
}

function RealDashboard({ situation }: { situation: Situation }) {
  const { user } = useAuth();
  const [dailyRead, setDailyRead] = useState<DailyRead | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setShowCreatedBanner(params.get('created') === '1');
  }, []);

  async function runDailyRead() {
    setReading(true);
    setReadError(null);
    try {
      const res = await fetch('/api/ai/dashboard-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as DailyRead;
      setDailyRead(data);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setReading(false);
    }
  }

  const contextHealth = computeSituationContextHealth({
    situation,
    expectedToolIds: ['documents', 'source-scout', 'graphops', 'policy-memo', 'briefing'],
    profileRequired: false,
  });

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-navy-500">{greeting()} · Policy document workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">{situation.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-navy-600">
              Write a defensible policy product from a structured case file. Sources, documents, graph primitives, and AI
              outputs stay attached to the paragraph they support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PraxisLink
              href="/policy-memo"
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              <PenLine className="h-3.5 w-3.5" />
              Open draft
            </PraxisLink>
            <button
              type="button"
              onClick={runDailyRead}
              disabled={reading}
              className="inline-flex items-center gap-1.5 rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs font-medium text-gold-700 hover:bg-gold-500/20 disabled:opacity-60"
            >
              {reading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {dailyRead ? 'Refresh what changed' : 'What changed?'}
            </button>
          </div>
        </div>

        {dailyRead ? (
          <div className="mt-4 rounded-md border border-gold-500/30 bg-gold-50 p-3">
            <h2 className="text-sm font-semibold text-navy-900">{dailyRead.headline}</h2>
            <div className="prose prose-sm mt-1 max-w-none text-navy-700">
              <MarkdownRenderer content={dailyRead.body} />
            </div>
          </div>
        ) : null}

        {readError ? <p className="mt-3 text-xs text-amber-700">Daily read failed: {readError}</p> : null}
      </header>

      <SituationStatusStrip situation={situation} />

      {showCreatedBanner ? (
        <section className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 shadow-sm shadow-navy-950/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-900">Building your case file</p>
              <p className="mt-1 text-xs leading-relaxed text-navy-600">
                PRAXIS is preparing source extraction, document structure, graph proposals, and first drafting context.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreatedBanner(false)}
              className="rounded-md border border-gold-500/40 px-2 py-1 text-xs font-medium text-gold-700 hover:bg-gold-500/10"
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DocumentWorkbench situation={situation} />
        <TrustBackbone situation={situation} contextScore={contextHealth.score} contextState={contextHealth.state} />
      </section>

      <WorkflowSpine />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ExecutiveIntelligencePanel situation={situation} />
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-500">Activity and saved work</h2>
          <ActivityFeed
            uid={user?.id ?? null}
            situationId={situation.id}
            emptyHint="No saved work yet. Document edits, research runs, graph proposals, and exports will appear here."
          />
        </div>
      </section>

      {/* Empty-state onboarding nudge */}
      {(!situation.graphEntities || situation.graphEntities === 0) &&
      (!situation.documentCount || situation.documentCount === 0) ? (
        <EmptySituationHint situationId={situation.id} />
      ) : null}

      {/* Tool methodology — frameworks, data sources, related tools */}
      <RegistryToolInfo toolId="dashboard" />
    </div>
  );
}

function DocumentWorkbench({ situation }: { situation: Situation }) {
  const docs = situation.documentCount ?? 0;
  const graph = situation.graphEntities ?? 0;
  const actors = situation.actorCount ?? situation.actors.length;

  const actions = [
    {
      title: 'Policy memo',
      detail: 'Draft, improve, save, and export the main written product.',
      href: '/policy-memo',
      icon: <PenLine className="h-4 w-4" />,
    },
    {
      title: 'Document library',
      detail: 'Keep source documents separate from the work product.',
      href: '/documents',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      title: 'Source research',
      detail: 'Ask what changed and attach receipts before editing.',
      href: '/source-scout',
      icon: <Search className="h-4 w-4" />,
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Working document</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-900">Build the brief from the case file</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-navy-600">
            PRAXIS keeps the drafting surface, evidence library, and graph model in one loop: select context, ask a policy
            question, verify source spans, then update the paragraph.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Docs" value={String(docs)} />
          <Metric label="Graph" value={String(graph)} />
          <Metric label="Actors" value={String(actors)} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <PraxisLink
            key={action.href}
            href={action.href}
            className="group rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md bg-white p-2 text-diplomatic-blue">{action.icon}</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-diplomatic-blue" />
            </div>
            <p className="mt-3 text-sm font-semibold text-navy-900">{action.title}</p>
            <p className="mt-1 text-xs leading-5 text-navy-600">{action.detail}</p>
          </PraxisLink>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-3">
        <p className="text-xs font-semibold text-navy-900">Document-first questions</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {[
            'Did this paragraph change after the latest media or corpus refresh?',
            'Where did this factual claim come from?',
            'Which source span supports this recommendation?',
            'What graph path explains this actor commitment?',
          ].map((question) => (
            <p key={question} className="rounded-md bg-white/80 px-3 py-2 text-[11px] leading-4 text-navy-600">
              {question}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBackbone({
  situation,
  contextScore,
  contextState,
}: {
  situation: Situation;
  contextScore: number;
  contextState: string;
}) {
  return (
    <aside className="grid gap-3">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[10px] font-semibold uppercase tracking-wider">Trust backbone</p>
        </div>
        <p className="mt-2 text-sm font-semibold text-emerald-950">Every answer must defend itself.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="Context" value={`${contextScore}%`} />
          <Metric label="State" value={contextState} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
          <Network className="h-3.5 w-3.5" />
          Graph moat
        </p>
        <p className="mt-2 text-xs leading-5 text-navy-600">
          The graph stores actors, claims, interests, constraints, leverage, commitments, events, narratives, dates, and
          provenance. AI can draft, but the graph decides what is reusable institutional memory.
        </p>
        <PraxisLink
          href="/graphops"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-diplomatic-blue hover:text-navy-900"
        >
          Review graph health
          <ArrowRight className="h-3.5 w-3.5" />
        </PraxisLink>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Current scope</p>
        <p className="mt-2 text-sm font-semibold text-navy-900">{situation.region}</p>
        <p className="mt-1 text-xs leading-5 text-navy-600">{situation.description}</p>
      </div>
    </aside>
  );
}

function WorkflowSpine() {
  const steps = [
    ['Ingest', 'Upload prose, URLs, notes, transcripts, and reports.'],
    ['Structure', 'Extract typed primitives and bind claims to source spans.'],
    ['Query', 'Ask policy questions over documents, graph, and saved work.'],
    ['Compare', 'Find contradiction, wording drift, and temporal change.'],
    ['Brief', 'Write cited memos, briefs, talking points, and exports.'],
    ['Inherit', 'Leave the next analyst a graph, not a folder.'],
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Analyst workflow</p>
          <h2 className="mt-1 text-base font-semibold text-navy-900">Ingest → Structure → Query → Compare → Brief → Inherit</h2>
        </div>
        <PraxisLink href="/tools" className="inline-flex items-center gap-1 text-xs font-semibold text-diplomatic-blue">
          Specialist tools
          <ArrowRight className="h-3.5 w-3.5" />
        </PraxisLink>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {steps.map(([title, detail]) => (
          <div key={title} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-navy-900">{title}</p>
            <p className="mt-1 text-[11px] leading-4 text-navy-600">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function EmptySituationHint({ situationId }: { situationId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runPopulate() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/graph/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { nodesAfter?: number; edgesAfter?: number; actorsEnriched?: number; mode?: string };
      setResult(`Prepared ${data.nodesAfter ?? 0} nodes and ${data.edgesAfter ?? 0} edges for review. ${data.actorsEnriched ?? 0} actors enriched. Mode: ${data.mode ?? 'staged'}.`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Graph seeding failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <h3 className="text-sm font-semibold text-navy-900">Get this situation running</h3>
      <ol className="mt-2 flex flex-col gap-1 text-xs text-navy-600 sm:flex-row sm:gap-4">
        <li>1. Ingest sources — upload documents or add URLs.</li>
        <li>2. Build the graph — extract entities and relationships.</li>
        <li>3. Run a risk scan — classify Glasl stage and INFORM composite.</li>
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runPopulate}
          disabled={busy}
          className="rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/20 disabled:opacity-60"
        >
          {busy ? 'Seeding graph…' : 'Seed graph from grounded search + docs'}
        </button>
        {result && <span className="text-xs text-navy-500">{result}</span>}
      </div>
    </section>
  );
}

// Demo mode uses the full SituationDashboard experience with a rich fixture.
const DEMO_SITUATION: Situation = {
  id: 'demo-nordalia',
  name: 'Nordalia — Contested Border Arrangement',
  type: 'international',
  description:
    'Nordalia is a fictional sovereignty dispute used to demonstrate PRAXIS capabilities.',
  region: 'East Asia (fictional)',
  actors: ['Nordalia', 'Sudralia', 'Coastal Consortium'],
  userRole: 'analyst',
  status: 'active',
  riskScore: 72,
  glaslStage: 4,
  escalationTrend: 'escalating',
  actorCount: 8,
  graphEntities: 124,
  documentCount: 9,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
