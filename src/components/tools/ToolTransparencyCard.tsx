import { Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import { buildToolTransparencyCard } from '@/lib/tools/marketplace/transparency';
import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

export function ToolTransparencyCard({ tool }: { tool: MarketplaceToolDefinition }) {
  const card = buildToolTransparencyCard(tool);

  return (
    <details className="mt-3 rounded-md border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-diplomatic-blue" />
          <span className="text-xs font-semibold text-navy-900">Transparency card</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            {card.costClass}
          </span>
        </span>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Updated {card.lastUpdated}
        </span>
      </summary>

      <div className="border-t border-slate-200 px-3 py-3">
        <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Info className="h-3 w-3" />
              Methodology
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-650">{card.methodology}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Evaluation posture</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {card.evaluationMetrics.map((metric) => (
                <div key={metric.label} className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{metric.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-navy-950">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <TriangleAlert className="h-3 w-3" />
              Limitations
            </p>
            <ul className="mt-1 space-y-1">
              {card.limitations.map((item) => (
                <li key={item} className="text-xs leading-5 text-slate-650">- {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected error modes</p>
            <ul className="mt-1 space-y-1">
              {card.expectedErrorModes.map((item) => (
                <li key={item} className="text-xs leading-5 text-slate-650">- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </details>
  );
}
