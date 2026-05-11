'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Info, Loader2, Play, TriangleAlert } from 'lucide-react';
import type { MethodDefinition } from '@/lib/methods/catalog';
import type { MethodRunOutput } from '@/lib/methods/runtime';

interface PreviewPayload {
  contextId: string;
  prompt: string;
}

export function MethodRunView({ method, preview }: { method: MethodDefinition; preview: PreviewPayload | null }) {
  const canRunNow = Boolean(preview?.contextId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MethodRunOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMethod() {
    if (!preview?.contextId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const response = await fetch(`/api/methods/${encodeURIComponent(method.id)}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: preview.contextId,
        prompt: preview.prompt || `Run ${method.name} against the active context.`,
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setLoading(false);
    if (!response?.ok || !payload?.success) {
      setError(payload?.error ?? 'Method runtime unavailable.');
      return;
    }
    setResult(payload.output as MethodRunOutput);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {canRunNow ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Info className="h-4 w-4 text-navy-600" />}
        <h2 className="text-sm font-semibold text-navy-900">Runtime state</h2>
      </div>
      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm leading-relaxed text-navy-700">
        {!preview && (
          <p>
            Fill the run setup to see whether this method has enough context for the current MVP runtime.
          </p>
        )}
        {preview && canRunNow && (
          <div className="space-y-2">
            <p>
              Ready to start from context <span className="font-semibold text-navy-900">{preview.contextId}</span>. The run will use the mapped
              owner-scoped endpoint and persist reviewable output when the authenticated app session is available.
            </p>
            {method.runPath && (
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600">
                <ExternalLink className="h-3.5 w-3.5" />
                Endpoint: /api/methods/{method.id}/run
              </p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => void runMethod()}
              className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run method
            </button>
          </div>
        )}
        {preview && !preview.contextId && (
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
            <p>
              Select or paste a context ID before running. This prevents methods from executing without a scoped case.
            </p>
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{error}</p>
      ) : null}
      {result ? (
        <section className="mt-3 rounded-md border border-emerald-200 bg-white p-3">
          <p className="text-sm font-semibold text-navy-900">{result.summary}</p>
          <div className="mt-3 grid gap-2">
            {result.findings.map((finding) => (
              <div key={finding.title} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-navy-900">{finding.title}</p>
                <p className="mt-1 text-xs leading-5 text-navy-600">{finding.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.citations.slice(0, 4).map((citation) => (
              <span key={citation.sourceId} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-navy-600">
                {citation.label} · {citation.tier}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-navy-600">
            Persistence: {result.persistence.artifactCollection}
          </p>
        </section>
      ) : null}
    </div>
  );
}
