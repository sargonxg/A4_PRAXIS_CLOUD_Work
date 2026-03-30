'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Settings2, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { usePreferencesStore, type DataSourceMode } from '@/stores/preferences-store';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { useDebugStore } from '@/stores/debug-store';
import type { Situation } from '@/types/situation';

// Hard cap: abort after 90 seconds to avoid infinite hangs
const GENERATION_TIMEOUT_MS = 90_000;

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
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { log: debugLog } = useDebugStore();

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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const generate = useCallback(async () => {
    if (!activeSituation) return;
    setStatus('generating');
    setErrorMsg('');
    setElapsed(0);

    // AbortController: cancel the fetch after GENERATION_TIMEOUT_MS
    const abort = new AbortController();
    abortRef.current = abort;

    // Elapsed-time counter (updates every second)
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Hard timeout: abort after 90s
    const timeoutId = setTimeout(() => abort.abort(), GENERATION_TIMEOUT_MS);

    const requestId = `${toolId}-${Date.now()}`;
    debugLog({ id: requestId, type: 'request', tool: toolId, endpoint: apiEndpoint, situation: activeSituation.name, ts: new Date().toISOString() });

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          situationId: activeSituation.id,
          situation: activeSituation,
          sourceMode,
          ...extraBody,
        }),
      });

      clearTimeout(timeoutId);
      if (timerRef.current) clearInterval(timerRef.current);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Generation failed' }));
        const errMsg = data.error || `Failed to generate ${toolName} data (HTTP ${res.status})`;
        debugLog({ id: requestId, type: 'error', tool: toolId, status: res.status, error: errMsg, ts: new Date().toISOString() });
        setErrorMsg(errMsg);
        setStatus('error');
        return;
      }

      const data = await res.json();
      debugLog({ id: requestId, type: 'success', tool: toolId, elapsed: Math.floor((Date.now() - startTime) / 1000), ts: new Date().toISOString() });
      onDataGenerated(data);
      persisted.save(data);
      setStatus('done');
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (timerRef.current) clearInterval(timerRef.current);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = isAbort
        ? `Generation timed out after ${GENERATION_TIMEOUT_MS / 1000}s — the AI model took too long. Try again or check your GOOGLE_AI_API_KEY.`
        : 'Network error. Please check your connection and try again.';
      debugLog({ id: requestId, type: 'error', tool: toolId, error: errMsg, aborted: isAbort, ts: new Date().toISOString() });
      setErrorMsg(errMsg);
      setStatus('error');
    }
  }, [activeSituation, apiEndpoint, sourceMode, extraBody, toolName, toolId, onDataGenerated, persisted, debugLog]);

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
    const step = elapsed < 10 ? 0 : elapsed < 30 ? 1 : elapsed < 55 ? 2 : 3;
    const steps = [
      'Sending request to PRAXIS AI...',
      `Gemini Pro analyzing "${activeSituation?.name}"...`,
      'Structuring intelligence into actionable format...',
      'Almost done — finalizing output...',
    ];
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Sparkles className="h-10 w-10 text-gold-600" />
        </motion.div>
        <h3 className="text-base font-semibold text-navy-900">Generating {toolName}</h3>
        <p className="mt-2 text-sm text-navy-600 max-w-sm text-center">
          {steps[step]}
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-navy-50 px-4 py-1.5 text-xs text-navy-500">
          <Clock className="h-3 w-3" />
          {elapsed}s elapsed · up to 60s for complex situations
        </div>
        <div className="mt-4 space-y-2">
          {[
            { label: 'Analysing situation context & actors', done: elapsed >= 5 },
            { label: 'Applying conflict grammar framework', done: elapsed >= 20 },
            { label: 'Structuring structured output', done: elapsed >= 45 },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-navy-500">
              {done
                ? <span className="h-3.5 w-3.5 text-emerald-500">✓</span>
                : <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-600" />}
              {label}
            </div>
          ))}
        </div>
        <button
          onClick={() => { abortRef.current?.abort(); }}
          className="mt-6 text-xs text-navy-400 underline hover:text-navy-600"
        >
          Cancel
        </button>
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
