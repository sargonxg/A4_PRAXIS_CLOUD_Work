'use client';

import { useState, type ReactNode } from 'react';
import { Sparkles, Unlock } from 'lucide-react';
import { computeContextHealthScore } from '@/lib/context/context-health-score';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function ToolGate({ children, toolId = 'workbench-tool' }: { children: ReactNode; toolId?: string }) {
  const { situation } = useWorkbenchScope();
  const [overrideText, setOverrideText] = useState('');
  const [overridden, setOverridden] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const report = computeContextHealthScore({
    situation,
  });

  if (report.score >= 60 || overridden) return <>{children}</>;

  async function recordOverride() {
    setOverrideError(null);
    try {
      if (!situation?.id) throw new Error('No active case id is available.');
      const response = await fetch(`/api/situations/${encodeURIComponent(situation.id)}/context-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification: overrideText.trim(), toolId, score: report.score }),
      });
      if (!response.ok) throw new Error(`Override log failed with ${response.status}`);
      const payload = await response.json().catch(() => null) as { overrideHash?: string } | null;
      if (payload?.overrideHash) {
        window.sessionStorage.setItem(`praxis-context-override:${situation.id}`, payload.overrideHash);
      }
      setOverridden(true);
    } catch (error) {
      setOverrideError(error instanceof Error ? error.message : 'Could not log the override decision.');
    }
  }

  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 text-rose-700" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-rose-950">Context is thin; this tool will run with advisories</h2>
          <p className="mt-1 text-sm leading-6 text-rose-800">
            Current context health is {report.score}/100. The weakest dimension is {report.lowestDimension.label.toLowerCase()}.
            PRAXIS no longer blocks tool runs on this score; add a note if you want the low-context decision recorded.
          </p>
          <textarea
            value={overrideText}
            onChange={(event) => setOverrideText(event.target.value)}
            className="mt-3 min-h-24 w-full rounded-md border border-rose-200 bg-white p-3 text-sm text-slate-800"
            placeholder="Type a justification of at least 50 characters to continue..."
          />
          <button
            type="button"
            disabled={overrideText.trim().length < 50}
            onClick={recordOverride}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-rose-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Unlock className="h-3.5 w-3.5" />
            Record context note
          </button>
          {overrideError ? <p className="mt-2 text-xs font-semibold text-rose-800">{overrideError}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
