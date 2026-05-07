import { CalendarClock, MapPin, Network, ShieldCheck } from 'lucide-react';
import type { WorkbenchGraphNode } from '@/lib/graph/workbench-case-graph';
import { cn } from '@/lib/utils/cn';

export function GraphEntityPanel({
  node,
  className,
  compact = false,
}: {
  node?: WorkbenchGraphNode | null;
  className?: string;
  compact?: boolean;
}) {
  if (!node) {
    return (
      <aside
        data-testid="graph-entity-panel"
        className={cn('rounded-md border border-slate-200 bg-slate-50 p-4', className)}
      >
        <p className="text-sm font-semibold text-navy-950">Select a graph entity</p>
        <p className="mt-1 text-sm leading-5 text-slate-700">Click a node, timeline item, or map marker to inspect its confidence and receipts.</p>
      </aside>
    );
  }

  return (
    <aside
      data-testid="graph-entity-panel"
      className={cn('rounded-md border border-slate-200 bg-slate-50 p-4', className)}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{node.type}</p>
          <h3 className="mt-1 text-base font-semibold text-navy-950">{node.label}</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          {Math.round(node.confidence * 100)}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{node.description}</p>

      <div className={cn('mt-4 grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        <PanelMetric icon={Network} label="Receipts" value={String(node.provenanceCount)} />
        <PanelMetric icon={CalendarClock} label="When" value={node.occurredAt ? shortDate(node.occurredAt) : 'Undated'} />
        <PanelMetric icon={MapPin} label="Where" value={node.geo?.label ?? 'Not mapped'} wide={!compact} />
      </div>
      {node.geo?.derived ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
          Location is a derived regional anchor, not evidence-grade geocoding.
        </p>
      ) : null}
      {node.metadata?.sanctions?.length ? <SanctionsMatches matches={node.metadata.sanctions} /> : null}
    </aside>
  );
}

function PanelMetric({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: typeof Network;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={cn('rounded-md border border-slate-200 bg-white p-3', wide && 'col-span-full')}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-gold-700" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{label}</p>
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-navy-950">{value}</p>
    </div>
  );
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function SanctionsMatches({ matches }: { matches: NonNullable<WorkbenchGraphNode['metadata']>['sanctions'] }) {
  if (!matches?.length) return null;
  return (
    <div data-testid="graph-sanctions-badge" className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-800">Sanctions: {matches.length} matches</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-800">review</span>
      </div>
      <div className="mt-2 space-y-2">
        {matches.slice(0, 4).map((match, index) => {
          const entityId = match.entity_id ?? match.entityId ?? `match-${index + 1}`;
          const href = match.opensanctions_url ?? match.url ?? '#';
          return (
            <a
              key={`${entityId}-${index}`}
              href={href}
              target={href === '#' ? undefined : '_blank'}
              rel={href === '#' ? undefined : 'noreferrer'}
              className="block rounded-md border border-rose-200 bg-white px-3 py-2 text-xs leading-5 text-navy-950 hover:border-rose-300"
            >
              <span className="font-semibold">OpenSanctions {entityId}</span>
              {typeof match.score === 'number' ? <span className="ml-2 text-rose-800">{Math.round(match.score * 100)}%</span> : null}
              {match.datasets?.length ? <span className="mt-0.5 block text-slate-700">{match.datasets.join(', ')}</span> : null}
            </a>
          );
        })}
      </div>
    </div>
  );
}
