'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback } from 'react';
import { use } from 'react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { ArrowLeft, BookOpen, Sparkles, Loader2, GitCompare, Users, Calendar, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useConflictDetail, useConflictList } from '@/hooks/use-conflict-data';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { notFound } from 'next/navigation';
import { parseDataStreamChunk } from '@/lib/utils/stream';

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const { id } = use(params);
  const { data: detail, loading, error } = useConflictDetail(id);
  const { data: allCases } = useConflictList();

  const caseData = detail?.meta ?? null;

  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const generateSummary = useCallback(async () => {
    if (isSummarizing || !caseData) return;
    setIsSummarizing(true);
    setSummary('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: caseData.summaryPrompt + '\n\nProvide an executive summary covering: (1) conflict origins and root causes, (2) key actors and their interests, (3) critical junctures and missed opportunities, (4) current status, (5) prospects and key variables. Use a structured format with clear headings. Aim for 600-800 words.' }],
        }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setSummary(accumulated);
      }
    } catch {
      setSummary(`**${caseData.name} — Executive Summary**\n\n${caseData.description}\n\n**Key themes:** ${caseData.keyThemes.join(', ')}\n\n**Primary institutions:** ${caseData.institutions.join(', ')}`);
    } finally {
      setIsSummarizing(false);
    }
  }, [isSummarizing, caseData]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <PraxisLink href="/cases" className="rounded-lg p-2 text-navy-400 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </PraxisLink>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <BookOpen className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-navy-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-navy-100" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <div className="h-4 w-full animate-pulse rounded bg-navy-100 mb-3" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-navy-100 mb-3" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-navy-100" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-navy-100 mb-3" />
              <div className="h-8 w-full animate-pulse rounded bg-navy-100 mb-2" />
              <div className="h-8 w-full animate-pulse rounded bg-navy-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseData) notFound();

  const relatedCases = (allCases ?? []).filter((c) => c.id !== id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PraxisLink href="/cases" className="rounded-lg p-2 text-navy-400 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </PraxisLink>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
          <BookOpen className="h-5 w-5 text-diplomatic-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">{caseData.name}</h1>
          <p className="text-sm text-navy-500">{caseData.region} · {caseData.primaryConflictType}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <PraxisLink
            href={`/compare?a=${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-1.5 text-sm text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
          >
            <GitCompare className="h-4 w-4" />
            Compare
          </PraxisLink>
          <PraxisLink
            href={`/scenarios?conflict=${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-1.5 text-sm text-navy-600 hover:border-gold-500/30 hover:text-gold-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Run Scenario
          </PraxisLink>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-5">
          {/* Metadata */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <p className="mb-4 text-sm text-navy-700 leading-relaxed">{caseData.description}</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-[var(--color-app-border)] pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">Status</p>
                <p className="text-sm font-semibold capitalize text-navy-800">{caseData.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">Risk Level</p>
                <p className={cn('text-sm font-semibold capitalize', {
                  critical: 'text-crimson',
                  high: 'text-orange-600',
                  medium: 'text-gold-600',
                  low: 'text-teal',
                }[caseData.riskLevel])}>{caseData.riskLevel}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">Since</p>
                <p className="font-mono text-sm text-navy-800">{caseData.startYear}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">Actors</p>
                <p className="font-mono text-sm text-navy-800">{caseData.actorCount}</p>
              </div>
            </div>
          </div>

          {/* Key themes */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Key Themes</p>
            <div className="flex flex-wrap gap-2">
              {caseData.keyThemes.map((theme) => (
                <span key={theme} className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-1 text-xs text-navy-700">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="rounded-xl border border-gold-500/15 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-600" />
                <p className="text-sm font-semibold text-navy-900">AI Executive Summary</p>
              </div>
              <button
                onClick={generateSummary}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/10 disabled:opacity-50 transition-colors"
              >
                {isSummarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {summary ? 'Regenerate' : 'Generate Summary'}
              </button>
            </div>
            {summary ? (
              <div className="prose prose-sm max-w-none text-navy-700">
                <MarkdownRenderer content={summary} />
                {isSummarizing && <span className="inline-block h-4 w-0.5 animate-pulse bg-gold-500 ml-0.5" />}
              </div>
            ) : isSummarizing ? (
              <div className="flex items-center gap-2 py-4 text-sm text-navy-400">
                <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                Generating executive summary…
              </div>
            ) : (
              <p className="text-sm text-navy-500">
                Click &ldquo;Generate Summary&rdquo; to produce an AI-powered executive summary of this conflict covering origins, actors, key events, and current status.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Institutions */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-navy-400" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Key Institutions</p>
            </div>
            <div className="space-y-2">
              {caseData.institutions.map((inst) => (
                <div key={inst} className="flex items-center gap-2 rounded-lg bg-[var(--color-app-surface-alt)] px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-diplomatic-blue/50" />
                  <span className="text-xs font-medium text-navy-700">{inst}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Analyze This Case</p>
            <div className="space-y-2">
              <PraxisLink href="/stakeholder-map" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                <Users className="h-3.5 w-3.5" />
                View Stakeholder Map
              </PraxisLink>
              <PraxisLink href="/conflict-graph" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Open Conflict Graph
              </PraxisLink>
              <PraxisLink href="/calendar" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                Related Calendar Events
              </PraxisLink>
            </div>
          </div>

          {/* Related cases */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Other Cases</p>
            <div className="space-y-2">
              {relatedCases.map((c) => (
                <PraxisLink
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[var(--color-app-surface-alt)] transition-colors"
                >
                  <div className={cn('h-2 w-2 rounded-full shrink-0', {
                    active: 'bg-teal',
                    escalating: 'bg-crimson',
                    frozen: 'bg-navy-400',
                    resolved: 'bg-sage',
                  }[c.status])} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-navy-800 truncate">{c.name}</p>
                    <p className="text-[10px] text-navy-400">{c.region}</p>
                  </div>
                </PraxisLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
