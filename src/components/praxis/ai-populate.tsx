'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, X, Settings2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { usePreferencesStore, type DataSourceMode } from '@/stores/preferences-store';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import type { Situation } from '@/types/situation';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface AiPopulateProps {
  /** Unique tool identifier (e.g., 'risk-monitor', 'early-warning') */
  toolId: string;
  /** Human-readable tool name */
  toolName: string;
  /** API endpoint to call for generating data */
  apiEndpoint: string;
  /** Extra body params to send with the API call */
  extraBody?: Record<string, unknown>;
  /** Credit cost for this generation */
  creditCost: number;
  /** Called when generation completes with the response data */
  onDataGenerated: (data: unknown) => void;
  /** Whether data already exists (skip auto-populate if true) */
  hasExistingData: boolean;
  /** Children to render (the actual tool UI) */
  children: React.ReactNode;
}

const SOURCE_MODE_LABELS: Record<DataSourceMode, string> = {
  all: 'All sources (web + documents + AI knowledge)',
  'web-and-docs': 'Web sources + uploaded documents',
  'docs-only': 'Only uploaded documents',
  'llm-only': 'AI knowledge only (no external sources)',
};

/**
 * Wraps a tool page to auto-populate data when first opened.
 * Shows a "PRAXIS is researching..." overlay, then reveals the tool.
 */
export function AiPopulate({
  toolId,
  toolName,
  apiEndpoint,
  extraBody,
  creditCost,
  onDataGenerated,
  hasExistingData,
  children,
}: AiPopulateProps) {
  const { activeSituation } = useSituationStore();
  const { credits } = useAuth();
  const { aiAutoPopulate, getEffectiveMode, setToolOverride } = usePreferencesStore();

  const persisted = usePersistedToolData(toolId, activeSituation?.id);
  const restoredRef = useRef(false);

  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error' | 'skipped'>('idle');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sourceMode = getEffectiveMode(toolId);

  // Check for persisted data before showing the AI generation prompt
  useEffect(() => {
    if (restoredRef.current || persisted.isLoading || hasExistingData) return;
    if (!activeSituation) return;

    if (persisted.data != null && persisted.generatedAt) {
      const age = Date.now() - new Date(persisted.generatedAt).getTime();
      if (age < TWENTY_FOUR_HOURS_MS) {
        restoredRef.current = true;
        onDataGenerated(persisted.data);
        setStatus('done');
        return;
      }
    }
  }, [persisted.isLoading, persisted.data, persisted.generatedAt, hasExistingData, activeSituation, onDataGenerated]);

  // Auto-populate when tool opens for the first time with no data
  useEffect(() => {
    if (hasExistingData) {
      setStatus('skipped');
      return;
    }
    // Wait for persistence check to complete
    if (persisted.isLoading || restoredRef.current) return;
    if (!activeSituation || status !== 'idle') return;

    // Auto-trigger generation on first visit if auto-populate is enabled
    if (aiAutoPopulate) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasExistingData, aiAutoPopulate, activeSituation, persisted.isLoading]);

  const generate = useCallback(async () => {
    if (!activeSituation) return;
    setStatus('generating');
    setErrorMsg('');

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationId: activeSituation.id,
          situation: activeSituation,
          sourceMode,
          ...extraBody,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Generation failed' }));
        setErrorMsg(data.error || `Failed to generate ${toolName} data`);
        setStatus('error');
        return;
      }

      const data = await res.json();
      onDataGenerated(data);
      // Persist the generated data to Firestore
      persisted.save(data);
      setStatus('done');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }, [activeSituation, apiEndpoint, sourceMode, extraBody, toolName, onDataGenerated, persisted]);

  const handleRegenerate = useCallback(async () => {
    restoredRef.current = false;
    await persisted.clear();
    setStatus('idle');
    // Immediately trigger new generation
    generate();
  }, [persisted, generate]);

  // If data exists or user skipped, just show the tool with a Regenerate button
  if (status === 'skipped' || status === 'done' || hasExistingData) {
    return (
      <>
        {(status === 'done' || hasExistingData) && (
          <div className="mb-4 flex items-center justify-end">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-500 transition-colors hover:border-navy-300 hover:text-navy-700"
            >
              <RotateCcw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  // Generating state
  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Sparkles className="h-10 w-10 text-gold-600" />
        </motion.div>
        <h3 className="text-base font-semibold text-navy-900">Populating {toolName} for the first time</h3>
        <p className="mt-2 text-sm text-navy-600">
          PRAXIS is researching &ldquo;{activeSituation?.name}&rdquo; and building your {toolName.toLowerCase()} intelligence...
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-navy-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-600" />
            Searching Wikipedia, GDELT, and web sources for context
          </div>
          <div className="flex items-center gap-2 text-xs text-navy-400">
            <Sparkles className="h-3.5 w-3.5 text-gold-500/50" />
            Extracting actors, relationships, and key dynamics
          </div>
          <div className="flex items-center gap-2 text-xs text-navy-400">
            <Sparkles className="h-3.5 w-3.5 text-gold-500/30" />
            Structuring intelligence into actionable format
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <X className="h-10 w-10 text-red-400" />
        <h3 className="mt-4 text-base font-semibold text-navy-900">Generation Failed</h3>
        <p className="mt-2 text-sm text-navy-500">{errorMsg}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={generate} className="rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90">
            Retry
          </button>
          <button onClick={() => setStatus('skipped')} className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
            Skip — use empty view
          </button>
        </div>
      </div>
    );
  }

  // Prompt state — ask user before generating
  return (
    <div className="space-y-6">
      {/* AI Populate prompt */}
      <div className="rounded-xl border border-gold-500/30 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/10">
            <Sparkles className="h-5 w-5 text-gold-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-navy-900">
              Generate {toolName} for &ldquo;{activeSituation?.name}&rdquo;
            </h3>
            <p className="mt-1 text-xs text-navy-600">
              PRAXIS will analyze your situation data and generate {toolName.toLowerCase()} intelligence.
              This uses {creditCost} credit{creditCost !== 1 ? 's' : ''}.
              You have {credits} credits.
            </p>

            {/* Source mode picker */}
            <div className="mt-3">
              <button
                onClick={() => setShowSourcePicker(!showSourcePicker)}
                className="flex items-center gap-1.5 text-[11px] text-navy-500 hover:text-navy-700"
              >
                <Settings2 className="h-3 w-3" />
                Data sources: {SOURCE_MODE_LABELS[sourceMode]}
              </button>

              <AnimatePresence>
                {showSourcePicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      {(Object.keys(SOURCE_MODE_LABELS) as DataSourceMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setToolOverride(toolId, mode); setShowSourcePicker(false); }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                            sourceMode === mode
                              ? 'border-diplomatic-blue bg-diplomatic-blue/5 text-diplomatic-blue'
                              : 'border-navy-200 text-navy-600 hover:border-navy-300'
                          )}
                        >
                          <div className={cn(
                            'h-3 w-3 rounded-full border',
                            sourceMode === mode ? 'border-diplomatic-blue bg-diplomatic-blue' : 'border-navy-300'
                          )} />
                          {SOURCE_MODE_LABELS[mode]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={generate}
                disabled={credits < creditCost}
                className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-gold-500/20 hover:bg-gold-600 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate {toolName}
              </button>
              <button
                onClick={() => setStatus('skipped')}
                className="text-xs text-navy-500 hover:text-navy-700"
              >
                Skip — I&apos;ll add data manually
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Show empty tool underneath */}
      {children}
    </div>
  );
}
