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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Users, Sparkles, AlertTriangle, ShieldAlert, MessageSquare, ListChecks, Download, FileText, ClipboardList } from 'lucide-react';
import { brainstormingTableToMarkdown, brainstormingTableFilename } from '@/lib/exports/brainstorming-markdown';

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

interface BrainstormingDocument {
  id: string;
  title: string;
  fileType: string;
  status: string;
  chunkCount: number;
}

export default function BrainstormingTablePage() {
  const { isDemo, showGuard, needsOnboarding, situation } = useSituationGuard();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const { data: persisted, hasData } = useToolData<BrainstormingTable>('brainstorming-table');

  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generated, setGenerated] = useState<BrainstormingTable | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [documents, setDocuments] = useState<BrainstormingDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [contextNotice, setContextNotice] = useState('');
  const queryContextAppliedRef = useRef(false);

  const current: BrainstormingTable | null = generated ?? (hasData ? persisted : null);

  useEffect(() => {
    if (!activeSituation?.id || isDemo) return;
    let cancelled = false;
    queryContextAppliedRef.current = false;
    setSelectedDocumentIds([]);
    setDocsLoading(true);
    fetch(`/api/documents?situationId=${encodeURIComponent(activeSituation.id)}`, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : { documents: [] })
      .then((data) => {
        if (!cancelled) setDocuments(Array.isArray(data.documents) ? data.documents : []);
      })
      .catch(() => {
        if (!cancelled) setDocuments([]);
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSituation?.id, isDemo]);

  useEffect(() => {
    if (queryContextAppliedRef.current || docsLoading || documents.length === 0) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requested = (params.get('documents') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (requested.length === 0) return;
    queryContextAppliedRef.current = true;
    const available = new Set(documents.map((doc) => doc.id));
    const matched = requested.filter((id) => available.has(id));
    if (matched.length > 0) {
      setSelectedDocumentIds(matched);
      if (!question.trim()) {
        setQuestion(params.get('question') ?? 'What should the team conclude from these documents, and what should we do next?');
      }
      setContextNotice(`Loaded ${matched.length} document${matched.length === 1 ? '' : 's'} from the Document Vault context pack.`);
    } else {
      setContextNotice('The requested Document Vault context pack was not found for this situation.');
    }
  }, [docsLoading, documents, question]);

  const handleLocalTextFile = useCallback(async (file: File | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'md') {
      setErrorMsg('For PDFs and DOCX files, upload them in Documents first, then select them here.');
      return;
    }
    const text = await file.text();
    setSourceText(text.slice(0, 20000));
    setSourceLabel(file.name);
  }, []);

  const toggleDocument = useCallback((docId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId].slice(0, 5)
    );
  }, []);

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
          sourceText: sourceText.trim() || undefined,
          sourceLabel: sourceLabel.trim() || undefined,
          selectedDocumentIds,
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
  }, [question, activeSituation, selectedDocumentIds, sourceLabel, sourceText]);

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
        {contextNotice ? (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {contextNotice}
          </div>
        ) : null}
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="bt-source-text" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <ClipboardList className="h-4 w-4" />
            Working text for the experts
          </label>
          <input
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="Optional label, e.g. Draft cable, ceasefire text, memo excerpt"
            className="mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <textarea
            id="bt-source-text"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value.slice(0, 20000))}
            rows={7}
            placeholder="Paste a paragraph, draft statement, negotiating text, policy memo, cable excerpt, or field note. The expert table will debate it alongside the situation corpus."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{sourceText.length.toLocaleString()} / 20,000 characters</span>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <FileText className="h-3.5 w-3.5" />
              Load .txt / .md
              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                className="sr-only"
                onChange={(e) => void handleLocalTextFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <FileText className="h-4 w-4" />
              Uploaded documents
            </h2>
            <span className="text-xs text-slate-500">{selectedDocumentIds.length} / 5 selected</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Select PDFs, DOCX, text, or markdown files already uploaded to Documents. Their extracted text and chunks will be high-priority evidence for the expert table.
          </p>
          {docsLoading ? (
            <p className="text-xs text-slate-400">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
              No uploaded documents for this situation yet. Upload PDFs or text files in Documents, then return here to convene experts over them.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {documents.map((doc) => {
                const selected = selectedDocumentIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDocument(doc.id)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left transition',
                      selected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{doc.title}</span>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">{doc.fileType}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {doc.status} · {doc.chunkCount ?? 0} retrieval chunks
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {current && (
        <>
          <BrainstormingTableView data={current} situationName={situation?.name ?? activeSituation?.name} />
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
          No deliberation yet. Frame a question and convene the table. The experts can reason over the active situation, uploaded PDFs/documents, pasted text, and prior PRAXIS outputs.
        </div>
      )}
    </div>
  );
}

function BrainstormingTableView({ data, situationName }: { data: BrainstormingTable; situationName?: string }) {
  const handleDownload = () => {
    const md = brainstormingTableToMarkdown({ ...data, situationName });
    const filename = brainstormingTableFilename({ ...data, situationName }) + '.md';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openDecisionPack = (mode: 'memo' | 'red-team' | 'gaps') => {
    const prompt = buildDecisionPackPrompt(data, mode);
    window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt } }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4" /> Deliberation
          </h2>
          <div className="flex items-center gap-3">
            {data.retrievalTrace && (
              <span className="text-xs text-slate-500">
                {data.retrievalTrace.itemCount} corpus items · layers: {data.retrievalTrace.layersSearched.join(', ')}
              </span>
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Download as Markdown memo"
            >
              <Download className="h-3.5 w-3.5" />
              Download memo
            </button>
          </div>
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

        <div className="mt-4 rounded-lg border border-gold-500/30 bg-gold-500/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-700">Decision Pack</h3>
              <p className="mt-1 text-xs text-slate-600">
                Hand this deliberation to Ask PRAXIS for a briefable next product.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDecisionPack('memo')}
                className="rounded-md border border-gold-500/40 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-gold-50"
              >
                Draft policy memo
              </button>
              <button
                type="button"
                onClick={() => openDecisionPack('red-team')}
                className="rounded-md border border-gold-500/40 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-gold-50"
              >
                Red-team option
              </button>
              <button
                type="button"
                onClick={() => openDecisionPack('gaps')}
                className="rounded-md border border-gold-500/40 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-gold-50"
              >
                Find evidence gaps
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function buildDecisionPackPrompt(data: BrainstormingTable, mode: 'memo' | 'red-team' | 'gaps'): string {
  const options = data.synthesis.optionsForDecision
    .map((opt, i) => `${i + 1}. ${opt.label}: ${opt.tradeoffs}`)
    .join('\n');
  const openQuestions = data.synthesis.openQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  const nextActions = data.synthesis.nextActions
    .map((a, i) => `${i + 1}. ${a.action}${a.owner ? ` (${a.owner})` : ''} [${a.urgency}]`)
    .join('\n');
  const modeInstruction =
    mode === 'memo'
      ? 'Draft a concise policy memo with BLUF, evidence-backed recommendation, risks, and next steps.'
      : mode === 'red-team'
        ? 'Red-team the preferred option, identify weak assumptions, source gaps, and what would change the confidence rating.'
        : 'Identify evidence gaps, missing sources, and a prioritized research plan using Google/open-source search first and premium providers only where justified.';

  return `Use the latest Brainstorming Table output as the primary context and ${modeInstruction}

Question:
${data.question}

BLUF:
${data.synthesis.bluf}

Decision options:
${options || 'No options recorded.'}

Open questions:
${openQuestions || 'No open questions recorded.'}

Next actions:
${nextActions || 'No next actions recorded.'}`;
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
