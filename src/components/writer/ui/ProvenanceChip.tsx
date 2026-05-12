'use client';

import { CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ProvenanceChip({
  core,
  tool,
  confidence,
  className,
}: {
  core?: string | null;
  tool?: string | null;
  confidence?: string | null;
  className?: string;
}) {
  const label = [
    core ? core.replace(/-/g, ' ') : 'User Core',
    tool ? `via ${tool.replace(/-/g, ' ')}` : null,
    confidence ? confidence : null,
  ].filter(Boolean).join(' · ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600',
        className,
      )}
    >
      <CircleDot className="h-3 w-3 text-diplomatic-blue" />
      {label}
    </span>
  );
}
