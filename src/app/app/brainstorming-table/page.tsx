'use client';

/**
 * Brainstorming Table — multi-persona expert deliberation.
 *
 * Synchronous MVP per docs/AGENTIC_SYSTEM.md:
 *   - User picks a question.
 *   - Six expert personas debate; one row per persona, plus an extra
 *     red-team challenge row when warranted.
 *   - Synthesis chair (the orchestrator) consolidates BLUF, consensus,
 *     divergences, decision options, open questions, and next actions.
 *   - Output is persisted to `tools/brainstorming-table` so Briefing Room,
 *     Report Studio, and Ask PRAXIS can pull from it.
 */

import { useCallback, useState } from 'react';
import { Loader2, Users, Sparkles, AlertTriangle, ShieldAlert, MessageSquare, ListChecks } from 'lucide-react';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { useSituationStore } from '@/stores/situation-store';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { ConfidenceBadge } from '@/components/praxis/confidence-badge';
import { OutputProvenancePanel } from '@/components/praxis/output-provenance-panel';

const PERSONA_LABELS: Record<string, string> = {
  mediator: 'Mediator',
  humanitarian: 'Humanitarian Lead',
  legal: 'Legal Analyst',
  media: 'Media Analyst',
  security: 'Security/Risk Analyst',
  'red-team': 'Red Team Critic',
};

const PERSONA_TONE: Record<string, string> = {
  mediator: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  humanitarian: 'bg-rose-50 text-rose-700 border-rose-200',
  legal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  security: 'bg-slate-100 text-slate-800 border-slate-300',
  'red-team': 'bg-red-50 text-red-700 border-red-200',
};

interface EvidenceItem {
  sourceType: string;
  sourceId?: string;
  excerpt: string;
}

interface BrainstormingTurn {
  turnId: string;
  persona: string;
  claim: string;
  evidence: EvidenceItem[];
  critique?: string;
  recommendation?: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'proposed' | 'challenged' | 'accepted' | 'rejected';
}

interface BrainstormingSynthesis {
  bluf: string;
  consensusPoints: string[];
  divergences: string[];
  optionsForDecision: { label: string; tradeoffs: string; preferredBy?: string[] }[];
  openQuestions: string[];
  nextActions: { action: string; owner?: string; urgency: 'immediate' | 'short-term' | 'medium-term' }[];
}

interface BrainstormingTable {
  question: string;
  generatedAt: string;
  personas: string[];
  turns: BrainstormingTurn[];
  synthesis: BrainstormingSynthesis;
  retrievalTrace?: { layersSearched: string[]; itemCount: number; durationMs: number };
}

export default function BrainstormingTablePage() {
  const { isDemo, showGuard, needsOnboarding, situation } = useSituationGuard();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const { data: persisted, hasData } = useToolData<BrainstormingTable>('brainstorming-table');

  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generated, setGenerated] = useState<BrainstormingTable | null>(null);

  const current: BrainstormingTable | null = generated ?? (hasData ? persisted : null);

  const generate = useCallback(async () => {
    if (!question.trim() || !activeSituation) return;
    setGenerating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/brainstorming-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationId: activeSituation.id,
          situation: activeSituation,
          question: question.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || `Generation failed (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setGenerated(data as BrainstormingTable);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [question, activeSituation]);

  if (needsOnboarding) return <OnboardingRequiredState />;
  if (!isDemo && (showGuard || !situation)) return <NoSituationState />;

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="brainstorming-table" />

      {isDemo && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Demo mode — generation calls are disabled. The table below is fixture content.
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="bt-question" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
          <MessageSquare className="h-4 w-4" />
          Frame the question for the table
        </label>
        <textarea
          id="bt-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder={'e.g. "Should the mission publicly attribute the corridor closure or pursue a quiet 72-hour pause first?"'}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Six personas will deliberate over the situation corpus. Red-team critic is always present.
          </span>
          <button
            onClick={generate}
            disabled={generating || isDemo || !question.trim()}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition',
              generating || isDemo || !question.trim()
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Deliberating…' : current ? 'Regenerate' : 'Convene the table'}
          </button>
        </div>
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </section>

      {current && (
        <>
          <BrainstormingTableView data={current} />
          <OutputProvenancePanel
            toolId="brainstorming-table"
            generatedAt={current.generatedAt}
            sourceCount={current.retrievalTrace?.itemCount}
            retrievalQuery={current.question}
            retrievalLayers={current.retrievalTrace?.layersSearched}
          />
        </>
      )}

      {!current && !generating && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          <Users className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          No deliberation yet. Frame a question and convene the table — six expert personas will reason over the situation corpus and propose decision options.
        </div>
      )}
    </div>
  );
}

function BrainstormingTableView({ data }: { data: BrainstormingTable }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4" /> Deliberation
          </h2>
          {data.retrievalTrace && (
            <span className="text-xs text-slate-500">
              {data.retrievalTrace.itemCount} corpus items · layers: {data.retrievalTrace.layersSearched.join(', ')}
            </span>
          )}
        </header>
        <p className="mb-4 text-sm text-slate-700"><strong>Question:</strong> {data.question}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3">Persona</th>
                <th className="pb-2 pr-3">Claim</th>
                <th className="pb-2 pr-3">Evidence</th>
                <th className="pb-2 pr-3">Critique / Recommendation</th>
                <th className="pb-2 pr-3">Confidence</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.turns.map((turn) => (
                <tr key={turn.turnId} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        PERSONA_TONE[turn.persona] ?? 'bg-slate-50 text-slate-700 border-slate-200'
                      )}
                    >
                      {PERSONA_LABELS[turn.persona] ?? turn.persona}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-800">{turn.claim}</td>
                  <td className="py-3 pr-3 text-xs text-slate-600">
                    {turn.evidence.length > 0 ? (
                      <ul className="space-y-1">
                        {turn.evidence.map((e, i) => (
                          <li key={i}>
                            <Badge variant="outline" className="mr-1 align-middle">{e.sourceType}</Badge>
                            <span>{e.excerpt}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="italic text-slate-400">no corpus evidence</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-700">
                    {turn.critique && (
                      <p className="mb-1 flex items-start gap-1">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>{turn.critique}</span>
                      </p>
                    )}
                    {turn.recommendation && <p>↪ {turn.recommendation}</p>}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    <ConfidenceBadge confidence={turn.confidence} />
                  </td>
                  <td className="py-3 text-xs uppercase tracking-wide text-slate-500">{turn.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListChecks className="h-4 w-4" /> Synthesis
        </header>
        <p className="mb-4 text-sm font-medium text-slate-900">{data.synthesis.bluf}</p>

        {data.synthesis.consensusPoints.length > 0 && (
          <SynthesisBlock title="Consensus" items={data.synthesis.consensusPoints} />
        )}
        {data.synthesis.divergences.length > 0 && (
          <SynthesisBlock title="Divergences" items={data.synthesis.divergences} />
        )}
        {data.synthesis.openQuestions.length > 0 && (
          <SynthesisBlock title="Open questions" items={data.synthesis.openQuestions} />
        )}

        {data.synthesis.optionsForDecision.length > 0 && (
          <div className="mb-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Options for decision</h3>
            <ul className="space-y-2">
              {data.synthesis.optionsForDecision.map((opt, i) => (
                <li key={i} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                  <p className="font-medium text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-600">{opt.tradeoffs}</p>
                  {opt.preferredBy && opt.preferredBy.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Preferred by: {opt.preferredBy.map((p) => PERSONA_LABELS[p] ?? p).join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.synthesis.nextActions.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Next actions</h3>
            <ul className="space-y-1 text-sm text-slate-800">
              {data.synthesis.nextActions.map((a, i) => (
                <li key={i}>
                  <Badge variant="outline" className="mr-1 align-middle">{a.urgency}</Badge>
                  {a.action}
                  {a.owner ? <span className="ml-1 text-xs text-slate-500">({a.owner})</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function SynthesisBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-3">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
