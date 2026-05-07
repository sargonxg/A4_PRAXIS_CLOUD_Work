'use client';

import { BookOpen, GitBranch, Lightbulb, Wrench } from 'lucide-react';
import type { Citation } from '@/types/boardroom';

const icons = {
  corpus: BookOpen,
  graph: GitBranch,
  tool: Wrench,
  opinion: Lightbulb,
};

export function CitationPill({ citation }: { citation: Citation }) {
  const Icon = icons[citation.sourceType];
  return (
    <span
      title={citation.excerpt ?? citation.label}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-650"
    >
      <Icon className="h-3 w-3 shrink-0 text-gold-600" />
      <span className="truncate">{citation.label}</span>
    </span>
  );
}
