'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Bot, Command, Paperclip } from 'lucide-react';
import { classifyAskIntent, type AskIntentPlan } from '@/lib/ai/ask/intent-classifier';
import type { AskMode } from '@/lib/ai/ask/slash-commands';
import { AgentPlanPreview } from '@/components/ask/AgentPlanPreview';
import { CaptureLoop } from '@/components/ask/CaptureLoop';
import { FileAttachment } from '@/components/ask/FileAttachment';
import { StreamingResponse } from '@/components/ask/StreamingResponse';
import { cn } from '@/lib/utils/cn';

const MODES: Array<{ id: AskMode; label: string }> = [
  { id: 'quick', label: 'Quick' },
  { id: 'deep', label: 'Deep' },
  { id: 'research', label: 'Research' },
  { id: 'memo', label: 'Memo' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'auto', label: 'Auto' },
];

const EXAMPLES = [
  'What changed since the last update?',
  '/research find the strongest sourced evidence',
  '/memo turn this into a board-ready brief',
];

export function AskBar({ activeContextName, hasContext }: { activeContextName: string; hasContext: boolean }) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<AskMode>('quick');
  const [plan, setPlan] = useState<AskIntentPlan | null>(null);
  const [responsePlan, setResponsePlan] = useState<AskIntentPlan | null>(null);
  const [routeNote, setRouteNote] = useState<string | null>(null);

  const placeholder = useMemo(() => EXAMPLES[Math.min(mode === 'memo' ? 2 : mode === 'research' ? 1 : 0, EXAMPLES.length - 1)], [mode]);

  function previewPlan() {
    const nextPlan = classifyAskIntent({ prompt: prompt || placeholder, explicitMode: mode, hasContext });
    setPlan(nextPlan);
    setResponsePlan(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-navy-800" />
          <h2 className="text-base font-semibold text-navy-900">Ask PRAXIS</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                'rounded-md border px-3 py-2 text-xs font-semibold',
                mode === item.id ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-slate-50 text-navy-700 hover:bg-white',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block" htmlFor="ask-praxis-input">
          <span className="sr-only">Ask PRAXIS input</span>
          <textarea
            id="ask-praxis-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) previewPlan();
            }}
            rows={5}
            placeholder={placeholder}
            className="w-full resize-none rounded-md border border-slate-200 px-3 py-3 text-sm leading-relaxed outline-none focus:border-navy-400"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-navy-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              <Command className="h-3.5 w-3.5" />
              /research /memo /brief /ach /scenarios
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              <Paperclip className="h-3.5 w-3.5" />
              Files route through reviewed ingestion
            </span>
          </div>
          <button
            type="button"
            onClick={previewPlan}
            className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Preview plan
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <FileAttachment onRoute={setRouteNote} />
      {routeNote && <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-700">{routeNote}</p>}

      {plan && (
        <AgentPlanPreview
          plan={plan}
          onCancel={() => setPlan(null)}
          onConfirm={() => {
            setResponsePlan(plan);
            setPlan(null);
          }}
        />
      )}

      {responsePlan && (
        <>
          <StreamingResponse plan={responsePlan} contextName={activeContextName} />
          <CaptureLoop />
        </>
      )}
    </div>
  );
}
