'use client';

import { CalendarClock, Database, FileSearch, Layers, Server, UserCheck } from 'lucide-react';
import { ConfidenceBadge, type Confidence } from './confidence-badge';
import { cn } from '@/lib/utils/cn';

export interface EvidenceSummaryBarProps {
  confidence?: Confidence | string;
  generatedAt?: string;
  model?: string;
  profileVersion?: number;
  domainVersion?: number;
  sourceCount?: number;
  receiptCount?: number;
  retrievalLayers?: string[];
  calibratedTo?: string;
  className?: string;
}

function formatTimestamp(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}

function SummaryItem({
  icon: Icon,
  label,
  title,
}: {
  icon: typeof Database;
  label: string;
  title?: string;
}) {
  return (
    <span
      className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
      title={title ?? label}
    >
      <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function EvidenceSummaryBar({
  confidence,
  generatedAt,
  model,
  profileVersion,
  domainVersion,
  sourceCount,
  receiptCount,
  retrievalLayers,
  calibratedTo,
  className,
}: EvidenceSummaryBarProps) {
  const timestamp = formatTimestamp(generatedAt);
  const effectiveSourceCount = typeof sourceCount === 'number' ? sourceCount : receiptCount;
  const layerCount = retrievalLayers?.filter(Boolean).length ?? 0;
  const hasSummary =
    !!confidence ||
    !!timestamp ||
    !!model ||
    typeof profileVersion === 'number' ||
    typeof domainVersion === 'number' ||
    typeof effectiveSourceCount === 'number' ||
    layerCount > 0 ||
    !!calibratedTo;

  if (!hasSummary) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2',
        className
      )}
      aria-label="Evidence summary for this output"
    >
      {confidence ? <ConfidenceBadge confidence={confidence} withLabel /> : null}
      {typeof effectiveSourceCount === 'number' ? (
        <SummaryItem
          icon={FileSearch}
          label={`${effectiveSourceCount.toLocaleString()} source${effectiveSourceCount === 1 ? '' : 's'}`}
          title="Number of retrieved, cited, or inspected source items reported by this tool."
        />
      ) : null}
      {layerCount > 0 ? (
        <SummaryItem
          icon={Layers}
          label={`${layerCount} layer${layerCount === 1 ? '' : 's'}`}
          title={retrievalLayers?.join(', ')}
        />
      ) : null}
      {timestamp ? <SummaryItem icon={CalendarClock} label={timestamp} title="Generation timestamp." /> : null}
      {model ? <SummaryItem icon={Server} label={model} title="Model used for this output." /> : null}
      {typeof profileVersion === 'number' ? (
        <SummaryItem icon={UserCheck} label={`profile v${profileVersion}`} title="Analyst profile version used." />
      ) : null}
      {typeof domainVersion === 'number' ? (
        <SummaryItem icon={Database} label={`domain v${domainVersion}`} title="Domain context version used." />
      ) : null}
      {calibratedTo ? (
        <SummaryItem icon={UserCheck} label={`calibrated: ${calibratedTo}`} title="Calibration or doctrine basis." />
      ) : null}
    </div>
  );
}
