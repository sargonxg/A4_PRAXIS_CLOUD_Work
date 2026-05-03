'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';
import type { SyriaChapterDescriptor } from '@/lib/syria/chapter-flow';
import { cn } from '@/lib/utils/cn';

interface ChapterFrameProps {
  chapter: SyriaChapterDescriptor;
  active: boolean;
  children: ReactNode;
  onOpen: (id: SyriaChapterDescriptor['id']) => void;
}

export function ChapterFrame({ chapter, active, children, onOpen }: ChapterFrameProps) {
  const Icon = active ? ChevronDown : ChevronRight;

  return (
    <section
      id={chapter.id}
      className={cn(
        'scroll-mt-24 rounded-lg border bg-white shadow-sm shadow-navy-950/5 transition',
        active ? 'border-navy-300' : 'border-slate-200 hover:border-navy-200',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(chapter.id)}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left sm:px-5"
        aria-expanded={active}
        aria-controls={`${chapter.id}-panel`}
      >
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm font-semibold',
            active ? 'border-gold-400 bg-gold-50 text-navy-950' : 'border-slate-200 bg-slate-50 text-slate-500',
          )}
        >
          {chapter.number}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-navy-950">{chapter.title}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              {chapter.timeBudget}
            </span>
          </span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{chapter.question}</span>
        </span>
        <Icon className="h-5 w-5 text-slate-400" />
      </button>

      <div
        id={`${chapter.id}-panel`}
        className={cn('border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5', active ? 'block' : 'hidden')}
      >
        {children}
      </div>
    </section>
  );
}
