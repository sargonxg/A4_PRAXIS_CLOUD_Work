'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { WorkbenchChapterDescriptor } from '@/lib/workbench/chapter-flow';
import { cn } from '@/lib/utils/cn';

interface WorkbenchChapterShellProps {
  chapter: WorkbenchChapterDescriptor;
  active: boolean;
  locked?: boolean;
  children: ReactNode;
  onOpen: (id: WorkbenchChapterDescriptor['id']) => void;
}

export function WorkbenchChapterShell({ chapter, active, locked = false, children, onOpen }: WorkbenchChapterShellProps) {
  const Icon = active ? ChevronDown : ChevronRight;
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={chapter.id}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'scroll-mt-24 rounded-lg border bg-white shadow-sm shadow-navy-950/5 transition-colors',
        active ? 'border-navy-300 shadow-md' : 'border-slate-200 hover:border-navy-200',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(chapter.id)}
        disabled={locked}
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
              {chapter.group}
            </span>
            {locked ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                always on
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{chapter.question}</span>
        </span>
        <span className={locked ? 'text-slate-300' : 'text-slate-500'}>
          <Icon className="h-5 w-5" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key="panel"
            id={`${chapter.id}-panel`}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="px-4 pb-5 pt-4 sm:px-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
