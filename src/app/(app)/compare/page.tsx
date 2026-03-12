'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GitCompare, ChevronDown, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DEMO_CASES, type DemoCase } from '@/lib/constants/demo-cases';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

const statusColors: Record<string, string> = {
  active: 'text-teal',
  escalating: 'text-crimson',
  frozen: 'text-navy-500',
  resolved: 'text-sage',
};

const riskColors: Record<string, string> = {
  critical: 'text-crimson font-bold',
  high: 'text-orange-600 font-semibold',
  medium: 'text-gold-700',
  low: 'text-teal',
};

function ComparisonRow({ label, a, b, highlight }: { label: string; a: React.ReactNode; b: React.ReactNode; highlight?: boolean }) {
  return (
    <tr className={cn('border-b border-[var(--color-app-border-light)]', highlight && 'bg-gold-500/3')}>
      <td className="py-2.5 pr-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 whitespace-nowrap w-36">{label}</td>
      <td className="py-2.5 pr-4 text-sm text-navy-800">{a}</td>
      <td className="py-2.5 text-sm text-navy-800">{b}</td>
    </tr>
  );
}

function ComparePageInner() {
  const searchParams = useSearchParams();
  const initialA = searchParams.get('a') ?? '';
  const initialB = searchParams.get('b') ?? '';

  const [caseAId, setCaseAId] = useState(initialA || DEMO_CASES[0].id);
  const [caseBId, setCaseBId] = useState(initialB || (DEMO_CASES[1]?.id ?? ''));
  const [comparison, setComparison] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  const caseA = DEMO_CASES.find((c) => c.id === caseAId);
  const caseB = DEMO_CASES.find((c) => c.id === caseBId);

  const runComparison = useCallback(async () => {
    if (!caseA || !caseB || isComparing) return;
    setIsComparing(true);
    setComparison('');

    try {
      const prompt = `Compare and contrast these two conflict cases for a senior conflict analyst:

CASE A: ${caseA.name} (${caseA.region})
${caseA.description}
Type: ${caseA.primaryConflictType}
Key themes: ${caseA.keyThemes.join(', ')}
Institutions: ${caseA.institutions.join(', ')}

CASE B: ${caseB.name} (${caseB.region})
${caseB.description}
Type: ${caseB.primaryConflictType}
Key themes: ${caseB.keyThemes.join(', ')}
Institutions: ${caseB.institutions.join(', ')}

Provide a structured comparative analysis covering:

## Structural Similarities
What core conflict dynamics are shared? What makes these conflicts structurally analogous?

## Key Differences
Where do they diverge most significantly — in causes, actors, internationalization, or resolution prospects?

## Analogous Actors
Identify actors in Case A that have structural equivalents in Case B (e.g., "the DRM in Case A plays a role analogous to X in Case B").

## Applicable Lessons
What lessons from one case — especially any that moved toward resolution or de-escalation — could inform the other?

## Unique Risk Factors
What makes each case particularly difficult or distinctive that resists cross-case learning?

Be analytically specific, cite conflict resolution theory where relevant, and avoid generic observations.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setComparison(accumulated);
      }
    } catch {
      setComparison(`**Comparison: ${caseA.name} vs ${caseB.name}**\n\nBoth conflicts involve ${caseA.primaryConflictType === caseB.primaryConflictType ? 'similar conflict typologies' : 'distinct conflict dynamics'} but operate in different regional contexts. Further analysis requires AI connectivity.`);
    } finally {
      setIsComparing(false);
    }
  }, [caseA, caseB, isComparing]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
          <GitCompare className="h-5 w-5 text-steel" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Conflict Comparison</h1>
          <p className="text-sm text-navy-500">Side-by-side structural analysis with AI-generated comparative insights.</p>
        </div>
      </div>

      {/* Case selectors */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Case A</label>
          <div className="relative">
            <select
              value={caseAId}
              onChange={(e) => setCaseAId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm font-medium text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none"
            >
              {DEMO_CASES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center justify-center pb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
            <ArrowRight className="h-4 w-4 text-navy-400" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Case B</label>
          <div className="relative">
            <select
              value={caseBId}
              onChange={(e) => setCaseBId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm font-medium text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none"
            >
              {DEMO_CASES.filter((c) => c.id !== caseAId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Side-by-side data table */}
      {caseA && caseB && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
          <div className="grid grid-cols-[144px_1fr_1fr] border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-5 py-3">
            <div />
            <div>
              <p className="text-xs font-bold text-navy-900">{caseA.name}</p>
              <p className="text-[11px] text-navy-400">{caseA.region}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900">{caseB.name}</p>
              <p className="text-[11px] text-navy-400">{caseB.region}</p>
            </div>
          </div>
          <div className="px-5 py-2">
            <table className="w-full">
              <tbody>
                <ComparisonRow label="Status" a={<span className={cn('capitalize font-semibold', statusColors[caseA.status])}>{caseA.status}</span>} b={<span className={cn('capitalize font-semibold', statusColors[caseB.status])}>{caseB.status}</span>} />
                <ComparisonRow label="Risk Level" a={<span className={cn('capitalize', riskColors[caseA.riskLevel])}>{caseA.riskLevel}</span>} b={<span className={cn('capitalize', riskColors[caseB.riskLevel])}>{caseB.riskLevel}</span>} highlight />
                <ComparisonRow label="Since" a={<span className="font-mono">{caseA.startYear}</span>} b={<span className="font-mono">{caseB.startYear}</span>} />
                <ComparisonRow label="Actor Count" a={<span className="font-mono font-semibold">{caseA.actorCount}</span>} b={<span className="font-mono font-semibold">{caseB.actorCount}</span>} />
                <ComparisonRow label="Event Count" a={<span className="font-mono">{caseA.eventCount}</span>} b={<span className="font-mono">{caseB.eventCount}</span>} />
                <ComparisonRow label="Conflict Type" a={<span className="text-xs">{caseA.primaryConflictType}</span>} b={<span className="text-xs">{caseB.primaryConflictType}</span>} highlight />
                <ComparisonRow
                  label="Key Themes"
                  a={<div className="flex flex-wrap gap-1">{caseA.keyThemes.slice(0, 2).map((t) => <span key={t} className="rounded-full bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border-light)] px-2 py-0.5 text-[9px]">{t}</span>)}</div>}
                  b={<div className="flex flex-wrap gap-1">{caseB.keyThemes.slice(0, 2).map((t) => <span key={t} className="rounded-full bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border-light)] px-2 py-0.5 text-[9px]">{t}</span>)}</div>}
                />
                <ComparisonRow
                  label="Institutions"
                  a={<span className="text-xs">{caseA.institutions.slice(0, 2).join(', ')}</span>}
                  b={<span className="text-xs">{caseB.institutions.slice(0, 2).join(', ')}</span>}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Comparison */}
      <div className="rounded-xl border border-gold-500/15 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-600" />
            <p className="text-sm font-semibold text-navy-900">AI Structural Comparison</p>
          </div>
          <button
            onClick={runComparison}
            disabled={isComparing || !caseA || !caseB || caseAId === caseBId}
            className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/10 disabled:opacity-50 transition-colors"
          >
            {isComparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {comparison ? 'Regenerate' : 'Generate Comparison'}
          </button>
        </div>
        {comparison ? (
          <div className="prose prose-sm max-w-none text-navy-700">
            <MarkdownRenderer content={comparison} />
            {isComparing && <span className="inline-block h-4 w-0.5 animate-pulse bg-gold-500 ml-0.5" />}
          </div>
        ) : isComparing ? (
          <div className="flex items-center gap-2 py-6 text-sm text-navy-400">
            <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
            Generating structural comparison…
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--color-app-border)] p-6 text-center">
            <p className="text-sm text-navy-500">Select two cases and click &ldquo;Generate Comparison&rdquo; to receive an AI-powered structural analysis highlighting similarities, differences, analogous actors, and applicable lessons.</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Link href="/cases" className="text-sm text-navy-400 hover:text-navy-600 transition-colors">
          ← Back to Case Library
        </Link>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-navy-400">Loading…</div>}>
      <ComparePageInner />
    </Suspense>
  );
}
