'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useEffect, useRef } from 'react';
import {
  Scale,
  Play,
  FileDown,
  Share2,
  FileText,
  ExternalLink,
  ChevronDown,
  Loader2,
  Mic,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import { CASE_REGISTRY } from '@/lib/constants/case-registry';
import {
  MEDIATION_FRAMEWORKS,
  DEMO_SESSION_PLANS,
  DEMO_MEDIATION_SEQUENCE,
  DEMO_SETTLEMENT,
} from '@/lib/constants/concordia-demo';
import type { SessionPlan, MediationTurn } from '@/lib/constants/concordia-demo';

const CASE_OPTIONS = Object.entries(CASE_REGISTRY).map(([id, c]) => ({
  id,
  name: c.meta.name,
}));

const SPEAKER_STYLES: Record<string, string> = {
  mediator: 'bg-gray-50 border-gray-200',
  party_a: 'bg-blue-50 border-blue-200',
  party_b: 'bg-amber-50 border-amber-200',
  system: 'bg-violet-50 border-violet-300',
};

const SPEAKER_LABEL_STYLES: Record<string, string> = {
  mediator: 'text-gray-700',
  party_a: 'text-blue-700',
  party_b: 'text-amber-700',
  system: 'text-violet-700',
};

// ─── NEW: Hero Intro Section ──────────────────────────────────────────────────

function ConcordiaHeroSection({ situation }: { situation?: import('@/types/situation').Situation | null }) {
  return (
    <section className="space-y-5">
      {/* Title block */}
      <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-violet-600" />
              <h1 className="font-serif text-3xl font-normal text-navy-900">CONCORDIA</h1>
            </div>
            <p className="text-sm italic text-navy-500 max-w-lg">
              &ldquo;Real-time AI-assisted mediation using voice, language understanding, and structured dialogue techniques&rdquo;
            </p>

            {/* Description card */}
            <div className="rounded-xl border border-violet-100 bg-white/80 p-4 max-w-xl">
              <p className="text-xs leading-relaxed text-navy-600">
                CONCORDIA is TACITUS&apos;s voice-native mediation assistant. It listens to real negotiation sessions, provides
                real-time suggestions to mediators, tracks emotional tone, and generates structured summaries. Powered by
                Gemini Live API.
              </p>
            </div>
          </div>

          {/* Launch button */}
          <div className="shrink-0">
            <a
              href="https://concordia.tacitus.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-diplomatic-blue px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:opacity-90"
            >
              Launch CONCORDIA
              <ExternalLink className="h-4 w-4" />
            </a>
            {situation && (
              <p className="mt-2 text-center text-[10px] text-navy-400">
                Grounded in {situation.name}
              </p>
            )}
          </div>
        </div>

        {/* Three feature cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Mic className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-800">Live Transcription</p>
              <p className="mt-0.5 text-[11px] text-navy-500">Streams and analyzes conversation in real time</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Brain className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-800">Mediator Coaching</p>
              <p className="mt-0.5 text-[11px] text-navy-500">Suggests reframes, de-escalation tactics, and questions</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <FileText className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-800">Session Documentation</p>
              <p className="mt-0.5 text-[11px] text-navy-500">Auto-generates structured post-session summaries</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── NEW: Feature Comparison Table ───────────────────────────────────────────

const COMPARISON_ROWS = [
  { feature: 'Input format',       praxis: 'Text / documents',         concordia: 'Voice / real-time'          },
  { feature: 'Response speed',     praxis: 'Minutes (generation)',      concordia: 'Real-time (<2s)'            },
  { feature: 'Session tracking',   praxis: 'Async post-session',        concordia: 'Live during session'        },
  { feature: 'Mediator coaching',  praxis: 'Pre-session strategy',      concordia: 'In-session prompts'         },
  { feature: 'Use case',           praxis: 'Preparation & analysis',    concordia: 'Active mediation sessions'  },
];

function FeatureComparisonTable() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-400">
        CONCORDIA vs PRAXIS Text Tools
      </h2>
      <div className="overflow-hidden rounded-xl border border-[var(--color-app-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-app-border)] bg-navy-50/80">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                Feature
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                PRAXIS Text Tools
              </th>
              <th className="bg-violet-50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                CONCORDIA
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-[var(--color-app-border)] last:border-0',
                  i % 2 === 0 ? 'bg-white' : 'bg-navy-50/40',
                )}
              >
                <td className="px-4 py-3 text-xs font-medium text-navy-700">{row.feature}</td>
                <td className="px-4 py-3 text-xs text-navy-500">{row.praxis}</td>
                <td className="bg-violet-50/60 px-4 py-3 text-xs font-medium text-violet-800">
                  {row.concordia}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── NEW: Integration Status Section ─────────────────────────────────────────

const INTEGRATION_ITEMS = [
  { label: 'Session recordings',   status: 'Available after session',         dot: 'bg-emerald-500' },
  { label: 'Actor sentiment data', status: 'Syncs to Risk Monitor',            dot: 'bg-emerald-500' },
  { label: 'Agreement drafts',     status: 'Available in Report Studio',       dot: 'bg-emerald-500' },
  { label: 'Live coaching',        status: 'CONCORDIA-native only',            dot: 'bg-amber-400'   },
];

function IntegrationStatusSection() {
  return (
    <section className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-navy-900">CONCORDIA ↔ PRAXIS Integration</h2>
        <p className="mt-1 text-[11px] text-navy-500">
          Data generated in CONCORDIA sessions automatically enriches your PRAXIS situation analysis
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {INTEGRATION_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-app-border)] bg-navy-50/30 px-3 py-2.5">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.dot)} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-navy-700 truncate">{item.label}</p>
              <p className="text-[10px] text-navy-400">{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Section 1: Mediation Session Planner ───────────────────────────── */

function SessionPlannerSection({ situation }: { situation?: import('@/types/situation').Situation | null }) {
  const isReal = !!situation;
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [noMatch, setNoMatch] = useState(false);

  const framework = MEDIATION_FRAMEWORKS.find((f) => f.id === selectedFramework);

  async function handleGenerate() {
    if (!selectedFramework) return;
    // Demo mode: require case selection and use local lookup
    if (!isReal && !selectedCase) return;
    setLoading(true);
    setNoMatch(false);
    setPlan(null);

    if (isReal) {
      // Real mode: call /api/ai/mediation with action 'plan'
      try {
        const frameworkObj = MEDIATION_FRAMEWORKS.find((f) => f.id === selectedFramework);
        const res = await fetch('/api/ai/mediation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'plan',
            conflictContext: `${situation.name}: ${situation.description}. Region: ${situation.region}. Actors: ${situation.actors.join(', ')}`,
            parties: situation.actors,
            issues: [frameworkObj?.name ?? selectedFramework],
          }),
        });
        if (!res.ok) {
          setNoMatch(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        // Map API response to SessionPlan shape
        setPlan({
          title: `${situation.name} — ${frameworkObj?.name ?? 'Mediation'} Plan`,
          caseName: situation.name,
          framework: data.framework ?? frameworkObj?.name ?? selectedFramework,
          estimatedDuration: data.timeline ?? 'AI-generated timeline',
          phases: (data.phases ?? []).map((p: { name: string; objectives: string[]; keyQuestions?: string[]; riskFactors?: string[] }) => ({
            name: p.name,
            duration: '',
            objectives: p.objectives ?? [],
            mediatorNotes: (p.riskFactors ?? []).join('; ') || 'See risk factors below',
          })),
          keyQuestions: (data.phases ?? []).flatMap((p: { keyQuestions?: string[] }) => p.keyQuestions ?? []),
          riskFactors: (data.phases ?? []).flatMap((p: { riskFactors?: string[] }) => p.riskFactors ?? []),
        });
      } catch {
        setNoMatch(true);
      } finally {
        setLoading(false);
      }
    } else {
      // Demo mode: use pre-computed plans
      const key = `${selectedCase}+${selectedFramework}`;
      setTimeout(() => {
        const match = DEMO_SESSION_PLANS[key];
        if (match) {
          setPlan(match);
        } else {
          setNoMatch(true);
        }
        setLoading(false);
      }, 1500);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-navy-900">Mediation Session Planner</h2>
        <p className="mt-1 text-sm text-navy-500">
          Select a case and mediation framework to generate a structured session plan
        </p>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isReal ? (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-400">
            Active Situation
          </label>
          <div className="rounded-lg border border-violet-200 bg-violet-50/30 py-2.5 pl-3 pr-3 text-sm text-navy-800">
            {situation.name}
          </div>
        </div>
        ) : (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-400">
            Case
          </label>
          <div className="relative">
            <select
              value={selectedCase}
              onChange={(e) => {
                setSelectedCase(e.target.value);
                setPlan(null);
                setNoMatch(false);
              }}
              className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2.5 pl-3 pr-8 text-sm text-navy-800 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
            >
              <option value="">Select a case...</option>
              {CASE_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          </div>
        </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-400">
            Framework
          </label>
          <div className="relative">
            <select
              value={selectedFramework}
              onChange={(e) => {
                setSelectedFramework(e.target.value);
                setPlan(null);
                setNoMatch(false);
              }}
              className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2.5 pl-3 pr-8 text-sm text-navy-800 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
            >
              <option value="">Select a framework...</option>
              {MEDIATION_FRAMEWORKS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          </div>
        </div>
      </div>

      {/* Framework info card */}
      {framework && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <h3 className="text-sm font-semibold text-violet-800">{framework.name}</h3>
          <p className="mt-1 text-[13px] text-violet-700">{framework.shortDescription}</p>
          <p className="mt-2 text-[12px] text-violet-600">
            <span className="font-semibold">Best for:</span> {framework.bestFor}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {framework.keySteps.map((step, i) => (
              <span
                key={i}
                className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-600"
              >
                {i + 1}. {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={(!isReal && !selectedCase) || !selectedFramework || loading}
        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating Session Plan...
          </span>
        ) : (
          'Generate Session Plan'
        )}
      </button>

      {/* Shimmer loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse rounded-lg bg-violet-100/50"
            />
          ))}
        </div>
      )}

      {/* No match */}
      {noMatch && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-6 text-center">
          <Scale className="mx-auto mb-3 h-8 w-8 text-violet-400" />
          <p className="text-sm text-violet-700">
            No pre-built plan for this combination. In production, CONCORDIA generates plans on-demand for any case + framework pair.
          </p>
          <a
            href="https://concordia.tacitus.me"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
          >
            Try CONCORDIA <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Plan display */}
      {plan && (
        <div className="rounded-xl border border-[var(--color-app-border)] border-l-4 border-l-violet-500 bg-white p-6">
          <h3 className="font-serif text-lg text-navy-900">{plan.title}</h3>
          <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-navy-500">
            <span>Framework: {plan.framework}</span>
            <span>Duration: {plan.estimatedDuration}</span>
          </div>

          {/* Phases */}
          <div className="mt-5 space-y-4">
            {plan.phases.map((phase, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-navy-800">{phase.name}</h4>
                  <span className="text-[11px] text-navy-400">{phase.duration}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {phase.objectives.map((obj, j) => (
                    <li key={j} className="text-[12px] text-navy-600">
                      &bull; {obj}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 rounded border border-violet-100 bg-violet-50/50 px-3 py-1.5 text-[11px] italic text-violet-700">
                  Mediator note: {phase.mediatorNotes}
                </p>
              </div>
            ))}
          </div>

          {/* Key Questions */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Key Questions
            </h4>
            <ul className="space-y-1.5">
              {plan.keyQuestions.map((q, i) => (
                <li key={i} className="text-[12px] text-navy-600">
                  {i + 1}. {q}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Factors */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">
              Risk Factors
            </h4>
            <ul className="space-y-1.5">
              {plan.riskFactors.map((r, i) => (
                <li key={i} className="text-[12px] text-red-600">
                  &bull; {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Section 2: Live Mediation Assistant (Preview) ──────────────────── */

function LiveMediationSection({ situation }: { situation?: import('@/types/situation').Situation | null }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    if (visibleCount >= DEMO_MEDIATION_SEQUENCE.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [playing, visibleCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleCount]);

  function handlePlay() {
    if (visibleCount >= DEMO_MEDIATION_SEQUENCE.length) {
      setVisibleCount(0);
    }
    setPlaying(true);
    if (visibleCount === 0) {
      setVisibleCount(1);
    }
  }

  const visibleTurns = DEMO_MEDIATION_SEQUENCE.slice(0, visibleCount);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl text-navy-900">Live Mediation Assistant</h2>
            {!situation && playing && (
              <span className="flex items-center gap-1 text-[11px] text-violet-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                Live Preview
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Real-time AI guidance during mediation sessions — analysis, suggestions, and risk alerts
          </p>
        </div>
        {!situation && (
          <button
            onClick={handlePlay}
            disabled={playing}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {visibleCount >= DEMO_MEDIATION_SEQUENCE.length ? 'Replay' : 'Play Demo'}
          </button>
        )}
      </div>

      {situation ? (
        <div className="rounded-xl border border-diplomatic-blue/15 bg-diplomatic-blue/4 p-6 text-center">
          <Scale className="mx-auto h-8 w-8 text-diplomatic-blue/50" />
          <h3 className="mt-3 text-sm font-semibold text-navy-800">Live Mediation Assistant</h3>
          <p className="mt-1 text-xs text-navy-500">
            Connect to CONCORDIA for live AI-assisted mediation sessions grounded in {situation.name}.
            Session plans above are generated from your situation data.
          </p>
          <a
            href="https://concordia.tacitus.me"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
          >
            Launch CONCORDIA
          </a>
        </div>
      ) : (
        <>
          {/* Chat display */}
          <div className="max-h-[500px] space-y-3 overflow-y-auto rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            {visibleTurns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Scale className="mb-3 h-10 w-10 text-navy-300" />
                <p className="text-sm text-navy-400">
                  Click &quot;Play Demo&quot; to see a simulated mediation session
                </p>
              </div>
            ) : (
              visibleTurns.map((turn: MediationTurn, i: number) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    SPEAKER_STYLES[turn.speaker],
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[11px] font-bold uppercase tracking-wider',
                        SPEAKER_LABEL_STYLES[turn.speaker],
                      )}
                    >
                      {turn.name}
                    </span>
                    {turn.speaker === 'system' && (
                      <span className="rounded border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
                        AI ANALYSIS
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-[13px] leading-relaxed',
                      turn.speaker === 'system'
                        ? 'font-mono text-[12px] text-violet-800'
                        : 'text-navy-700',
                    )}
                  >
                    {turn.text}
                  </p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* CTA */}
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 text-center">
            <p className="text-[12px] text-violet-700">
              In production, CONCORDIA provides real-time AI analysis during live mediation sessions —
              detecting interests, suggesting questions, and flagging risks as the conversation unfolds.
            </p>
            <a
              href="https://concordia.tacitus.me"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-violet-600 hover:text-violet-700"
            >
              Learn more about CONCORDIA Live <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Section 3: Settlement Generator ────────────────────────────────── */

function SettlementSection({ situation }: { situation?: import('@/types/situation').Situation | null }) {
  const s = DEMO_SETTLEMENT;

  function handleExport(format: string) {
    alert(`${format} export available in production`);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-navy-900">Settlement Generator</h2>
          <p className="mt-1 text-sm text-navy-500">
            AI-drafted settlement agreements based on session outcomes and international legal
            standards
          </p>
        </div>
        {!situation && (
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('PDF')}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
            >
              <FileDown className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              onClick={() => handleExport('DOCX')}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
            >
              <FileText className="h-3.5 w-3.5" /> DOCX
            </button>
            <button
              onClick={() => handleExport('Share Link')}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        )}
      </div>

      {situation ? (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-navy-300" />
          <h3 className="mt-3 text-sm font-semibold text-navy-800">Settlement Drafting</h3>
          <p className="mt-1 text-xs text-navy-500">
            Generate situation-specific settlement frameworks via CONCORDIA, grounded in the session plans and negotiation analysis for {situation.name}.
          </p>
        </div>
      ) : (
        /* Settlement document */
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8">
          {/* Title */}
          <h3 className="text-center font-serif text-lg font-bold text-navy-900">{s.title}</h3>
          <div className="mx-auto mt-3 h-px w-24 bg-violet-300" />

          {/* Preamble */}
          <p className="mt-6 text-[13px] italic leading-relaxed text-navy-600">{s.preamble}</p>

          {/* Clauses */}
          <div className="mt-6 space-y-4">
            {s.clauses.map((clause) => (
              <div key={clause.number} className="border-b border-[var(--color-app-border)] pb-4 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-navy-800">
                    Article {clause.number}: {clause.title}
                  </h4>
                  <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                    {clause.responsibleParty}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-600">{clause.text}</p>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="mt-8 border-t border-[var(--color-app-border)] pt-6">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Signatories
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.signatures.map((sig, i) => (
                <div key={i} className="rounded-lg border border-[var(--color-app-border)] p-3">
                  <div className="mb-6 border-b border-dashed border-navy-300" />
                  <p className="text-[12px] font-semibold text-navy-800">{sig.name}</p>
                  <p className="text-[11px] text-navy-500">{sig.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Effective date */}
          <p className="mt-6 text-center text-[11px] italic text-navy-400">
            Effective: {s.effectiveDate}
          </p>
        </div>
      )}
    </section>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */

function DemoConcordiaPage({ situation }: { situation?: import('@/types/situation').Situation | null }) {

  return (
    <div className="space-y-10">
      {/* NEW: Hero intro + launch button */}
      <ConcordiaHeroSection situation={situation} />

      {/* NEW: Feature comparison table */}
      <FeatureComparisonTable />

      {/* NEW: Integration status */}
      <IntegrationStatusSection />

      <div className="h-px bg-[var(--color-app-border)]" />

      <SessionPlannerSection situation={situation} />

      <div className="h-px bg-[var(--color-app-border)]" />

      <LiveMediationSection situation={situation} />

      <div className="h-px bg-[var(--color-app-border)]" />

      <SettlementSection situation={situation} />

      {/* Footer */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-app-border)] bg-white px-6 py-4">
        <EcosystemBadge product="CONCORDIA" size="md" />
        <div className="text-center">
          <p className="text-[12px] text-navy-500">
            Connect CONCORDIA for live mediation assistance, AI-generated session plans, and
            settlement drafting
          </p>
          <p className="mt-1 text-[10px] italic text-navy-400">
            DEMO — Session plans are pre-computed. Connect CONCORDIA for live generation.
          </p>
        </div>
        <a
          href="https://concordia.tacitus.me"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
        >
          Open CONCORDIA <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <PoweredByTacitus />
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

export default function ConcordiaPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoConcordiaPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  // Real mode — pass situation so SessionPlannerSection calls the real API
  return (
    <DemoConcordiaPage situation={situation} />
  );
}
