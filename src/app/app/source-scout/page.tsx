'use client';

/**
 * Source Scout — agentic workflow #1.
 * UI for the synchronous /api/ai/source-scout route.
 */

import { useCallback, useState } from 'react';
import { Loader2, Compass, Sparkles, AlertTriangle, ExternalLink, BookmarkPlus, ShieldCheck } from 'lucide-react';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { useSituationStore } from '@/stores/situation-store';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { ConfidenceBadge } from '@/components/praxis/confidence-badge';
import { OutputProvenancePanel } from '@/components/praxis/output-provenance-panel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

const RELIABILITY_LABEL: Record<string, string> = {
  tier_a: 'A · primary',
  tier_b: 'B · reputable',
  tier_c: 'C · mainstream',
  tier_d: 'D · unverified',
};

const RELIABILITY_TONE: Record<string, string> = {
  tier_a: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  tier_b: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  tier_c: 'bg-amber-50 text-amber-700 border-amber-200',
  tier_d: 'bg-rose-50 text-rose-700 border-rose-200',
};

interface ProposedSource {
  name: string;
  url: string;
  reason: string;
  reliability: 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d';
  publishedAt?: string;
  corroborated: boolean;
  format: 'report' | 'article' | 'database' | 'speech' | 'document' | 'multimedia' | 'other';
}

interface SourceScoutOutput {
  question: string;
  generatedAt: string;
  searchPlan: {
    keywords: string[];
    excludedDomains?: string[];
    timeframe: '24h' | '7d' | '30d' | '90d' | 'no-limit';
    languages?: string[];
  };
  proposedSources: ProposedSource[];
  duplicatesAvoided: string[];
  intelligenceGaps: string[];
  retrievalTrace?: { layersSearched: string[]; itemCount: number; durationMs: number };
  sourceReceipts?: Array<{
    name: string;
    title: string;
    url?: string;
    provider: string;
    source: string;
    kind: 'web-result' | 'scraped-excerpt' | 'structured-data';
    timestamp: string;
    publishedDate?: string;
    query?: string;
    reliabilityScore: number;
    confidence: 'high' | 'medium' | 'low';
    excerpt?: string;
  }>;
  sourceAudit?: {
    generatedAt: string;
    sourceCount: number;
    providerCounts: Record<string, number>;
    highReliabilityCount: number;
    checkableUrlCount: number;
    scrapedExcerptCount: number;
    structuredDataCount: number;
    confidence: 'high' | 'medium' | 'low';
    gaps: string[];
    notes: string[];
  };
}

const TIMEFRAMES: Array<SourceScoutOutput['searchPlan']['timeframe']> = ['24h', '7d', '30d', '90d', 'no-limit'];

export default function SourceScoutPage() {
  const { isDemo, showGuard, needsOnboarding, situation } = useSituationGuard();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const { data: persisted, hasData } = useToolData<SourceScoutOutput>('source-scout');

  const [question, setQuestion] = useState('');
  const [timeframe, setTimeframe] = useState<SourceScoutOutput['searchPlan']['timeframe']>('7d');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generated, setGenerated] = useState<SourceScoutOutput | null>(null);

  const current: SourceScoutOutput | null = generated ?? (hasData ? persisted : null);

  const generate = useCallback(async () => {
    if (!question.trim() || !activeSituation) return;
    setGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/source-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationId: activeSituation.id,
          situation: activeSituation,
          question: question.trim(),
          timeframe,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || `Generation failed (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setGenerated(data as SourceScoutOutput);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [question, activeSituation, timeframe]);

  if (needsOnboarding) return <OnboardingRequiredState />;
  if (!isDemo && (showGuard || !situation)) return <NoSituationState />;

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="source-scout" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="ss-question" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
          <Compass className="h-4 w-4" />
          What sources do you still need?
        </label>
        <textarea
          id="ss-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder={'e.g. "What primary sources cover the Kessara corridor closure this week, beyond OCHA?"'}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Timeframe:</span>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] transition',
                  timeframe === tf
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={generating || !question.trim()}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition',
              generating || !question.trim() ? 'cursor-not-allowed bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Scouting…' : current ? 'Re-scout' : 'Find sources'}
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
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Search plan</h2>
              <Badge variant="outline" className="uppercase tracking-wide">
                {current.searchPlan.timeframe}
              </Badge>
            </header>
            <div className="flex flex-wrap gap-1 text-xs">
              {current.searchPlan.keywords.map((kw) => (
                <span key={kw} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                  {kw}
                </span>
              ))}
            </div>
            {current.searchPlan.languages && current.searchPlan.languages.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Languages: {current.searchPlan.languages.join(', ')}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              Proposed sources <span className="text-xs text-slate-500">({current.proposedSources.length})</span>
            </header>
            <ul className="space-y-3">
              {current.proposedSources.map((src, i) => (
                <li key={`${i}-${src.url}`} className="rounded border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', RELIABILITY_TONE[src.reliability])}>
                      {RELIABILITY_LABEL[src.reliability]}
                    </span>
                    <Badge variant="outline" className="uppercase tracking-wide">{src.format}</Badge>
                    {src.corroborated && <ConfidenceBadge confidence="medium" withLabel={false} />}
                    {src.publishedAt && <span className="text-xs text-slate-500">· {src.publishedAt}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{src.name}</h3>
                  <p className="mt-1 text-xs text-slate-700">{src.reason}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => navigator.clipboard?.writeText(`${src.name}\n${src.url}\n${src.reason}`)}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700"
                      title="Copy source details to clipboard"
                    >
                      <BookmarkPlus className="h-3 w-3" /> Copy for Sources Library
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {current.sourceAudit && (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                  <ShieldCheck className="h-4 w-4" />
                  Source receipt audit
                </h3>
                <ConfidenceBadge confidence={current.sourceAudit.confidence} />
              </header>
              <div className="grid gap-2 text-xs text-emerald-950 sm:grid-cols-4">
                <AuditMetric label="Receipts" value={current.sourceAudit.sourceCount} />
                <AuditMetric label="Checkable URLs" value={current.sourceAudit.checkableUrlCount} />
                <AuditMetric label="High reliability" value={current.sourceAudit.highReliabilityCount} />
                <AuditMetric label="Scraped text" value={current.sourceAudit.scrapedExcerptCount} />
              </div>
              {current.sourceAudit.notes.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-emerald-900">
                  {current.sourceAudit.notes.slice(0, 3).map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
              {current.sourceReceipts && current.sourceReceipts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {current.sourceReceipts.slice(0, 10).map((receipt) => (
                    <a
                      key={`${receipt.provider}-${receipt.url ?? receipt.title}`}
                      href={receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        receipt.confidence === 'high'
                          ? 'border-emerald-300 bg-white text-emerald-700'
                          : receipt.confidence === 'medium'
                            ? 'border-amber-300 bg-white text-amber-700'
                            : 'border-slate-300 bg-white text-slate-600',
                        !receipt.url && 'pointer-events-none'
                      )}
                      title={receipt.excerpt}
                    >
                      {receipt.name}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {current.duplicatesAvoided.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Duplicates avoided</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {current.duplicatesAvoided.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </section>
          )}

          {current.intelligenceGaps.length > 0 && (
            <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-amber-900">Intelligence gaps</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                {current.intelligenceGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </section>
          )}

          <OutputProvenancePanel
            toolId="source-scout"
            generatedAt={current.generatedAt}
            confidence={current.sourceAudit?.confidence}
            sourceCount={current.sourceAudit?.sourceCount ?? current.retrievalTrace?.itemCount}
            sourceReceipts={current.sourceReceipts?.map((receipt) => ({
              name: receipt.name,
              timestamp: receipt.timestamp,
              url: receipt.url,
            }))}
            retrievalQuery={current.question}
            retrievalLayers={current.retrievalTrace?.layersSearched}
          />
        </>
      )}

      {!current && !generating && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          <Compass className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          No scout run yet. Frame the question — Source Scout will propose 3–8 fresh sources you do not already have.
        </div>
      )}
    </div>
  );
}

function AuditMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-white/70 px-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="text-sm font-semibold text-emerald-950">{value}</p>
    </div>
  );
}
