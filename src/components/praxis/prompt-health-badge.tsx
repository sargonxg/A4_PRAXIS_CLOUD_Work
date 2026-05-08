'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gauge, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PromptHealthReport } from '@/lib/context/prompt-health';

interface PromptHealthBadgeProps {
  situationId?: string | null;
  toolId: string;
  className?: string;
}

export function PromptHealthBadge({ situationId, toolId, className }: PromptHealthBadgeProps) {
  const [report, setReport] = useState<PromptHealthReport | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');

  useEffect(() => {
    if (!situationId) {
      setStatus('unavailable');
      setReport(null);
      return;
    }
    let cancelled = false;
    setStatus('loading');
    fetch(`/api/context/prompt-health?situationId=${encodeURIComponent(situationId)}&toolId=${encodeURIComponent(toolId)}`, {
      cache: 'no-store',
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (cancelled) return;
        const next = payload?.promptHealth as PromptHealthReport | undefined;
        if (next) {
          setReport(next);
          setStatus('ready');
        } else {
          setStatus('unavailable');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [situationId, toolId]);

  const copy = useMemo(() => {
    if (status === 'loading') return { label: 'Checking prompt health', detail: 'Preparing context quality signal.' };
    if (!report) return { label: 'Prompt health unavailable', detail: 'Run remains available; context will be checked server-side.' };
    if (report.state === 'green') return { label: `Prompt health ${report.score}/100`, detail: 'Context is ready for calibrated AI.' };
    if (report.state === 'yellow') return { label: `Prompt health ${report.score}/100`, detail: report.weakLayers[0]?.detail ?? 'Thin context will be caveated in the prompt.' };
    return { label: `Prompt health ${report.score}/100`, detail: 'Add context first, or run anyway with caveats if needed.' };
  }, [report, status]);

  const state = report?.state ?? (status === 'loading' ? 'loading' : 'unavailable');

  return (
    <div className={cn('rounded-lg border px-3 py-2 text-xs', badgeClass(state), className)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{iconForState(state)}</span>
        <span className="min-w-0">
          <span className="block font-semibold">{copy.label}</span>
          <span className="mt-0.5 block leading-snug opacity-90">{copy.detail}</span>
          {report?.missingLayers.length ? (
            <span className="mt-1 block leading-snug opacity-80">
              Missing: {report.missingLayers.slice(0, 3).join(', ')}
              {report.missingLayers.length > 3 ? ` +${report.missingLayers.length - 3}` : ''}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function iconForState(state: PromptHealthReport['state'] | 'loading' | 'unavailable') {
  const className = 'h-3.5 w-3.5';
  if (state === 'loading') return <Loader2 className={cn(className, 'animate-spin')} />;
  if (state === 'green') return <CheckCircle2 className={className} />;
  if (state === 'yellow') return <Gauge className={className} />;
  return <AlertTriangle className={className} />;
}

function badgeClass(state: PromptHealthReport['state'] | 'loading' | 'unavailable'): string {
  if (state === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'yellow') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (state === 'red') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-slate-200 bg-slate-50 text-navy-700';
}
