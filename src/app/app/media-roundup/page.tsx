'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState, useCallback } from 'react';
import {
  Newspaper, Loader2, Clock, Sparkles, RefreshCw,
  AlertTriangle, Star, ChevronDown, Plus, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { useAuth } from '@/lib/auth/auth-context';
import type { Situation } from '@/types/situation';

const TIME_RANGES = [
  { value: '24h', label: 'Past 24 Hours' },
  { value: '48h', label: 'Past 48 Hours' },
  { value: '7d', label: 'Past Week' },
  { value: '30d', label: 'Past Month' },
];

function MediaRoundupTool({ situation }: { situation: Situation }) {
  const { credits } = useAuth();
  const [timeRange, setTimeRange] = useState('24h');
  const [maxSections, setMaxSections] = useState(8);
  const [customQueries, setCustomQueries] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [roundupContent, setRoundupContent] = useState('');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const addQuery = () => {
    if (queryInput.trim() && customQueries.length < 5) {
      setCustomQueries((prev) => [...prev, queryInput.trim()]);
      setQueryInput('');
    }
  };

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setRoundupContent('');
    setGeneratedAt(null);

    try {
      const res = await fetch('/api/ai/media-roundup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, timeRange, maxSections, customQueries }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed' }));
        setRoundupContent(`**Error**: ${data.error || 'Failed to generate media roundup.'}`);
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setRoundupContent(text);
        }
      }

      setGeneratedAt(new Date().toISOString());
    } catch {
      setRoundupContent('**Error**: Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [situation, timeRange, maxSections, customQueries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-semibold text-navy-900">
            <Newspaper className="h-6 w-6 text-diplomatic-blue" />
            Media Intelligence Roundup
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            AI-compiled media briefing for &ldquo;{situation.name}&rdquo; — scored by source reliability
          </p>
        </div>
        {generatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-navy-400">
            <Clock className="h-3.5 w-3.5" />
            Generated {new Date(generatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Time range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-navy-700">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none"
            >
              {TIME_RANGES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Max sections */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-navy-700">Max Sections</label>
            <select
              value={maxSections}
              onChange={(e) => setMaxSections(Number(e.target.value))}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none"
            >
              {[4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>{n} sections</option>
              ))}
            </select>
          </div>

          {/* Generate button */}
          <div className="flex items-end">
            <button
              onClick={generate}
              disabled={isGenerating || credits < 5}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                isGenerating
                  ? 'bg-gold-500/60 text-white cursor-not-allowed'
                  : 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20'
              )}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Compiling...</>
              ) : roundupContent ? (
                <><RefreshCw className="h-4 w-4" /> Regenerate (5 credits)</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Roundup (5 credits)</>
              )}
            </button>
          </div>
        </div>

        {/* Custom search queries */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-navy-700">Custom Search Queries (optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuery()}
              placeholder={`e.g., "${situation.actors[0] || situation.name} sanctions" or specific topic...`}
              className="flex-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
            />
            <button onClick={addQuery} disabled={customQueries.length >= 5} className="rounded-lg bg-navy-100 px-3 py-2 text-navy-600 hover:bg-navy-200 disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {customQueries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {customQueries.map((q, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-[11px] text-diplomatic-blue">
                  {q}
                  <button onClick={() => setCustomQueries((prev) => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <p className="mt-3 text-[10px] text-navy-400">
          Searches {situation.actors.length > 0 ? `for ${situation.actors.slice(0, 3).join(', ')}` : situation.name} across Reuters, AP, Crisis Group, BBC, UN News, and 30+ sources.
          Results scored by source reliability. Higher-scored items appear first.
        </p>
      </div>

      {/* Results */}
      {isGenerating && !roundupContent && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-gold-600" />
          <p className="mt-4 text-sm font-medium text-navy-900">Compiling Media Intelligence</p>
          <p className="mt-1 text-xs text-navy-500">Searching sources, scoring reliability, organizing by theme...</p>
        </div>
      )}

      {roundupContent && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
          <div className="border-b border-[var(--color-app-border)] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-diplomatic-blue" />
                <div>
                  <h2 className="text-sm font-semibold text-navy-900">
                    Media Roundup: {situation.name}
                  </h2>
                  <p className="text-[11px] text-navy-500">
                    {TIME_RANGES.find((t) => t.value === timeRange)?.label} — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  AI-Generated
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 prose prose-sm max-w-none text-navy-800">
            <MarkdownRenderer content={roundupContent} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MediaRoundupPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  if (isDemo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Newspaper className="h-12 w-12 text-navy-300" />
        <h2 className="mt-4 text-lg font-semibold text-navy-900">Media Roundup</h2>
        <p className="mt-2 text-sm text-navy-500">Available in the full PRAXIS app with live web search.</p>
      </div>
    );
  }

  if (showGuard || !situation) return <NoSituationState />;

  return <MediaRoundupTool situation={situation} />;
}
