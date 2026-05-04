'use client';

/**
 * Live-style agent console for the Syria case file.
 *
 * Shows an agent persona, a "Run" button, and a streamed reasoning trace
 * culminating in a cached canonical answer. The console is demo-safe:
 *   - It does NOT hit any AI route by default (no credit cost, no auth).
 *   - It mimics the production trace UI so a recording reads as live.
 *   - In the future, swap the simulator for a real fetch by passing
 *     `runner={async () => fetch('/api/ai/source-scout', ...)}`.
 *
 * The component is intentionally self-contained so it can drop into any
 * chapter without coupling to the broader app store.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Loader2, Play, RotateCcw, Sparkles, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AgentTraceStep {
  /** Short label rendered as a row in the trace. */
  label: string;
  /** Optional detail rendered below the label. */
  detail?: string;
  /** Milliseconds the step takes before resolving. */
  ms: number;
}

export interface AgentConsoleProps {
  persona: string;
  toolId: string;
  question: string;
  trace: AgentTraceStep[];
  /** Final structured answer rendered when trace completes. */
  answer: {
    headline: string;
    body: string;
    bullets?: string[];
    provenance?: string[];
    confidence?: number;
  };
  /** Optional override callback that replaces the simulator with a real call. */
  runner?: () => Promise<void>;
  className?: string;
  /** When true, the console primary action is disabled — used during recording autoplay. */
  locked?: boolean;
}

type ConsoleState = 'idle' | 'running' | 'done';

export function SyriaAgentConsole({
  persona,
  toolId,
  question,
  trace,
  answer,
  runner,
  className,
  locked = false,
}: AgentConsoleProps) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<ConsoleState>('idle');
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [streamedBody, setStreamedBody] = useState<string>('');
  const cancelRef = useRef<boolean>(false);

  useEffect(() => () => { cancelRef.current = true; }, []);

  async function run() {
    if (state === 'running' || locked) return;
    cancelRef.current = false;
    setState('running');
    setCompletedSteps(0);
    setStreamedBody('');

    if (runner) {
      try {
        await runner();
      } catch (e) {
        // fall through to canned simulator if runner fails
      }
    }

    for (let i = 0; i < trace.length; i += 1) {
      if (cancelRef.current) return;
      // eslint-disable-next-line no-await-in-loop
      await wait(reduceMotion ? 80 : trace[i]!.ms);
      if (cancelRef.current) return;
      setCompletedSteps(i + 1);
    }

    if (reduceMotion) {
      setStreamedBody(answer.body);
    } else {
      const tokens = answer.body.split(/(\s+)/);
      for (let i = 0; i < tokens.length; i += 1) {
        if (cancelRef.current) return;
        // eslint-disable-next-line no-await-in-loop
        await wait(20);
        setStreamedBody((prev) => prev + tokens[i]!);
      }
    }
    setState('done');
  }

  function reset() {
    cancelRef.current = true;
    setTimeout(() => {
      cancelRef.current = false;
      setState('idle');
      setCompletedSteps(0);
      setStreamedBody('');
    }, 40);
  }

  const totalSteps = trace.length;
  const progressPct = state === 'idle' ? 0 : Math.round((completedSteps / Math.max(1, totalSteps)) * 100);

  return (
    <section
      className={cn(
        'rounded-lg border border-navy-200 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-4 text-white shadow-lg',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-500 text-navy-950">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-200">{persona}</p>
            <p className="text-sm font-semibold text-white">Agent · {toolId}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state === 'done' ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
          <button
            type="button"
            onClick={run}
            disabled={state === 'running' || locked}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition',
              state === 'running'
                ? 'bg-white/10 text-blue-100/70'
                : 'bg-gold-500 text-navy-950 hover:bg-gold-400',
              locked ? 'opacity-50' : '',
            )}
          >
            {state === 'running' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                {state === 'done' ? 'Run again' : 'Run agent'}
              </>
            )}
          </button>
        </div>
      </header>

      <p className="mt-3 rounded-md bg-white/5 p-3 text-xs leading-5 text-blue-100/85">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-200">Question</span>{' '}
        <span className="text-white/95">{question}</span>
      </p>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gold-400"
          animate={reduceMotion ? undefined : { width: `${progressPct}%` }}
          initial={false}
          style={{ width: `${progressPct}%` }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ol className="space-y-1.5 rounded-md border border-white/10 bg-black/20 p-3">
          <li className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">
            <Terminal className="h-3 w-3" />
            Reasoning trace
          </li>
          {trace.map((step, idx) => {
            const done = idx < completedSteps;
            const active = state === 'running' && idx === completedSteps;
            return (
              <li
                key={step.label}
                className={cn(
                  'flex items-start gap-2 rounded px-1.5 py-1 text-[11px] leading-4 transition',
                  done ? 'text-emerald-300' : active ? 'text-white' : 'text-blue-100/45',
                )}
              >
                <span className="mt-0.5 inline-flex h-3 w-3 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 animate-spin text-gold-300" />
                  ) : (
                    <span className="h-2 w-2 rounded-full border border-blue-100/30" />
                  )}
                </span>
                <span>
                  <span className="font-mono">{step.label}</span>
                  {step.detail ? <span className="block text-[10px] text-blue-100/55">{step.detail}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          {state === 'idle' ? (
            <p className="text-[11px] leading-5 text-blue-100/55">
              Click <span className="text-gold-200">Run agent</span> to execute the calibrated reasoning recipe and stream
              the answer with provenance.
            </p>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-200">Answer</p>
              <h4 className="mt-1 text-sm font-semibold text-white">{answer.headline}</h4>
              <p className="mt-2 text-[12px] leading-5 text-blue-100/85">
                {streamedBody}
                {state === 'running' && completedSteps === trace.length ? (
                  <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-0.5 animate-pulse bg-gold-300 align-middle" />
                ) : null}
              </p>
              {answer.bullets && state === 'done' ? (
                <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px] leading-4 text-blue-100/85">
                  {answer.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {state === 'done' && answer.provenance ? (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/45">Provenance</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {answer.provenance.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-blue-100/85"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {state === 'done' && typeof answer.confidence === 'number' ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                  Confidence {Math.round(answer.confidence * 100)}%
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
