'use client';

import { ExternalLink, FileSearch, ShieldCheck } from 'lucide-react';
import type { CanonicalSourceReceipt, SourceReceiptConfidence } from '@/types/source-receipt';
import { normalizeSourceReceipts } from '@/lib/sources/source-receipt-normalizer';
import { cn } from '@/lib/utils/cn';

export interface SourceReceiptListProps {
  receipts?: unknown[] | CanonicalSourceReceipt[];
  maxItems?: number;
  compact?: boolean;
  className?: string;
}

export function SourceReceiptList({
  receipts,
  maxItems = 8,
  compact = false,
  className,
}: SourceReceiptListProps) {
  const normalized = normalizeSourceReceipts(receipts);
  if (normalized.length === 0) return null;

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {normalized.slice(0, maxItems).map((receipt) => (
          <ReceiptChip key={receipt.receiptId} receipt={receipt} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {normalized.slice(0, maxItems).map((receipt) => (
        <article key={receipt.receiptId} className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', confidenceClass(receipt.confidence))}>
                  {receipt.confidence}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {receipt.retrievalMethod.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400">{formatTimestamp(receipt.timestamp)}</span>
              </div>
              <h4 className="mt-1 line-clamp-1 text-xs font-semibold text-slate-900">{receipt.title}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {receipt.source} · reliability {Math.round(receipt.reliabilityScore * 100)}%
              </p>
            </div>
            {receipt.url ? (
              <a
                href={receipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-400">
                Stored <FileSearch className="h-3 w-3" />
              </span>
            )}
          </div>
          {receipt.excerpt ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-600">{receipt.excerpt}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ReceiptChip({ receipt }: { receipt: CanonicalSourceReceipt }) {
  const content = (
    <>
      <ShieldCheck className="h-3 w-3" />
      <span className="max-w-40 truncate">{receipt.name}</span>
      <span className="text-slate-400">{Math.round(receipt.reliabilityScore * 100)}%</span>
    </>
  );
  const className = cn(
    'inline-flex max-w-64 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
    receipt.confidence === 'high'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : receipt.confidence === 'medium'
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-slate-300 bg-slate-50 text-slate-600',
  );

  if (receipt.url) {
    return (
      <a href={receipt.url} target="_blank" rel="noopener noreferrer" title={receipt.excerpt ?? receipt.title} className={className}>
        {content}
      </a>
    );
  }

  return (
    <span title={receipt.excerpt ?? receipt.title} className={className}>
      {content}
    </span>
  );
}

function confidenceClass(confidence: SourceReceiptConfidence): string {
  if (confidence === 'high') return 'bg-emerald-100 text-emerald-700';
  if (confidence === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 10);
}
