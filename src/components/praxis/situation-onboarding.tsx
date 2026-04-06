'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, Check, Loader2,
  ArrowRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import type { Situation } from '@/types/situation';

interface SituationOnboardingProps {
  situation: Situation;
  onComplete: () => void;
}

type OnboardingStep = 'research' | 'sources' | 'review' | 'done';

/**
 * Interactive onboarding flow that runs after creating a situation.
 * Helps the user populate their situation with real data via AI research.
 */
export function SituationOnboarding({ situation, onComplete }: SituationOnboardingProps) {
  const { credits } = useAuth();
  const { updateSituation } = useSituationStore();

  const [step, setStep] = useState<OnboardingStep>('research');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState('');
  const [researchDone, setResearchDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferredSources, setPreferredSources] = useState<string[]>([]);
  const [customSource, setCustomSource] = useState('');
  const [expanded, setExpanded] = useState(true);

  const SUGGESTED_SOURCES = [
    { id: 'wikipedia', label: 'Wikipedia', desc: 'Canonical names, background, history' },
    { id: 'crisisgroup', label: 'International Crisis Group', desc: 'Conflict analysis, briefings' },
    { id: 'acled', label: 'ACLED', desc: 'Armed conflict data, event tracking' },
    { id: 'reliefweb', label: 'ReliefWeb / OCHA', desc: 'Humanitarian reports, situation updates' },
    { id: 'reuters', label: 'Reuters / AP', desc: 'Wire service news, verified reporting' },
    { id: 'un', label: 'UN News / UNSC', desc: 'Official UN reports, resolutions, briefings' },
    { id: 'statedept', label: 'US State Dept / EU EEAS', desc: 'Government positions, sanctions lists' },
    { id: 'sipri', label: 'SIPRI / IISS', desc: 'Arms transfers, military balance, security analysis' },
    { id: 'aljazeera', label: 'Al Jazeera / BBC', desc: 'International broadcast news, regional coverage' },
    { id: 'academic', label: 'Academic journals', desc: 'Peer-reviewed conflict research' },
  ];

  const toggleSource = (id: string) => {
    setPreferredSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const addCustomSource = () => {
    if (customSource.trim() && !preferredSources.includes(customSource.trim())) {
      setPreferredSources((prev) => [...prev, customSource.trim()]);
      setCustomSource('');
    }
  };

  const runResearch = useCallback(async () => {
    setIsResearching(true);
    setResearchResult('');

    try {
      const res = await fetch('/api/ai/auto-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationName: situation.name,
          situationType: situation.type,
          region: situation.region,
          description: situation.description,
          actors: situation.actors,
          userRole: situation.userRole || 'analyst',
          sourcePreferences: preferredSources,
        }),
      });

      if (!res.ok) {
        setResearchResult('Research unavailable. You can add information manually or try again later.');
        setResearchDone(true);
        setIsResearching(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setResearchResult(fullText);
        }
      }

      setResearchDone(true);

      // Extract a concise description from the research (SITUATION OVERVIEW section)
      // and save it back to the situation so all tools benefit from the richer context.
      try {
        const overviewMatch = fullText.match(/##\s*SITUATION OVERVIEW\s*\n([\s\S]*?)(?=\n##|$)/i);
        const summary = overviewMatch
          ? overviewMatch[1].trim().slice(0, 800)
          : fullText.slice(0, 600).trim();

        if (summary) {
          await fetch(`/api/situations/${situation.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: summary }),
          });
          updateSituation(situation.id, { description: summary });
          setSaved(true);
        }
      } catch {
        // Non-fatal — research still shown, just not persisted
      }
    } catch {
      setResearchResult('Research failed. You can proceed without it and add data later.');
      setResearchDone(true);
    } finally {
      setIsResearching(false);
    }
  }, [situation, preferredSources, updateSituation]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between rounded-xl border border-gold-500/30 bg-gold-500/5 px-5 py-3 text-left transition-colors hover:bg-gold-500/10"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-gold-600" />
          <span className="text-sm font-medium text-navy-900">
            Build your situation — PRAXIS can help populate data
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-navy-400" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gold-500/30 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold-500/20 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
            <Sparkles className="h-4 w-4 text-gold-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Build Your Situation</h3>
            <p className="text-[11px] text-navy-500">Let PRAXIS research and populate &ldquo;{situation.name}&rdquo;</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(false)} className="text-navy-400 hover:text-navy-600">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Sources */}
          {step === 'research' && !researchDone && (
            <motion.div key="sources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-navy-900">What sources should PRAXIS use?</p>
                <p className="mt-1 text-xs text-navy-500">Select your preferred sources. PRAXIS will search these for background on &ldquo;{situation.name}&rdquo;.</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all',
                      preferredSources.includes(source.id)
                        ? 'border-diplomatic-blue bg-diplomatic-blue/5 ring-1 ring-diplomatic-blue/20'
                        : 'border-navy-200 hover:border-navy-300'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      preferredSources.includes(source.id) ? 'border-diplomatic-blue bg-diplomatic-blue text-white' : 'border-navy-300'
                    )}>
                      {preferredSources.includes(source.id) && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-navy-800">{source.label}</p>
                      <p className="text-[10px] text-navy-500">{source.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom source */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSource()}
                  placeholder="Add a custom source (e.g., specific think tank, news outlet)..."
                  className="flex-1 rounded-lg border border-navy-200 px-3 py-2 text-xs text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
                />
                <button onClick={addCustomSource} className="rounded-lg bg-navy-100 px-3 py-2 text-xs text-navy-600 hover:bg-navy-200">Add</button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-navy-400">
                  Research uses 5 credits. {credits} credits available.
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setStep('done'); onComplete(); }} className="text-xs text-navy-500 hover:text-navy-700">
                    Skip — I&apos;ll add data manually
                  </button>
                  <button
                    onClick={runResearch}
                    disabled={isResearching}
                    className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-white hover:bg-gold-600 shadow-md shadow-gold-500/20 disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" />
                    Research &ldquo;{situation.name}&rdquo;
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Research in progress / results */}
          {step === 'research' && (isResearching || researchDone) && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-2">
                {isResearching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
                <span className="text-sm font-medium text-navy-900">
                  {isResearching ? 'Researching...' : 'Research Complete'}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-navy-200 bg-white p-4 text-sm text-navy-800 leading-relaxed">
                {researchResult ? (
                  <MarkdownRenderer content={researchResult} />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-navy-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gathering intelligence from selected sources...
                  </div>
                )}
              </div>

              {researchDone && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-navy-500">
                    {saved
                      ? 'Research saved — all tools will now use this context.'
                      : 'Research complete. Proceed to start working with your situation.'}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={runResearch} className="text-xs text-navy-500 hover:text-navy-700">
                      Research again
                    </button>
                    <button
                      onClick={() => { setStep('done'); onComplete(); }}
                      className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-white hover:bg-gold-600 shadow-md shadow-gold-500/20"
                    >
                      Continue to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-navy-700">Situation ready. Use the tools in the sidebar to analyze &ldquo;{situation.name}&rdquo;.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
