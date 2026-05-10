import { CheckCircle2, ExternalLink, Info, TriangleAlert } from 'lucide-react';
import type { MethodDefinition } from '@/lib/methods/catalog';
import { STATUS_LABELS } from '@/lib/methods/catalog';

interface PreviewPayload {
  contextId: string;
  prompt: string;
}

export function MethodRunView({ method, preview }: { method: MethodDefinition; preview: PreviewPayload | null }) {
  const canRunNow = method.status !== 'phase-5-runtime' && Boolean(preview?.contextId);

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
                Endpoint: {method.runPath}
              </p>
            )}
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
        {preview && method.status === 'phase-5-runtime' && (
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
            <p>
              {STATUS_LABELS[method.status]}. This page shows the contract and captures inputs, but executable drafting is owned by the next
              Methods wave.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
