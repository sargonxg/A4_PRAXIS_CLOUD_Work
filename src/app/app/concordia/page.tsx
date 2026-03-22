'use client';

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

/* ── Section 1: Mediation Session Planner ───────────────────────────── */

function SessionPlannerSection() {
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [noMatch, setNoMatch] = useState(false);

  const framework = MEDIATION_FRAMEWORKS.find((f) => f.id === selectedFramework);

  function handleGenerate() {
    if (!selectedCase || !selectedFramework) return;
    setLoading(true);
    setNoMatch(false);
    setPlan(null);

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
        disabled={!selectedCase || !selectedFramework || loading}
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

function LiveMediationSection() {
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
            {playing && (
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
        <button
          onClick={handlePlay}
          disabled={playing}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          {visibleCount >= DEMO_MEDIATION_SEQUENCE.length ? 'Replay' : 'Play Demo'}
        </button>
      </div>

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
          visibleTurns.map((turn, i) => (
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
    </section>
  );
}

/* ── Section 3: Settlement Generator ────────────────────────────────── */

function SettlementSection() {
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
      </div>

      {/* Settlement document */}
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
    </section>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */

export default function ConcordiaPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-navy-900">CONCORDIA Mediation</h1>
        <p className="mt-1 text-sm text-navy-500">
          AI-assisted mediation guidance — session planning, live mediation assistant, and
          settlement generation
        </p>
      </div>

      <SessionPlannerSection />

      <div className="h-px bg-[var(--color-app-border)]" />

      <LiveMediationSection />

      <div className="h-px bg-[var(--color-app-border)]" />

      <SettlementSection />

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
