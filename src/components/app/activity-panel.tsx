'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Activity, CheckCircle, AlertCircle,
  Loader2, Clock, ChevronDown,
} from 'lucide-react';
import { useActivityStore, type ActiveOperation } from '@/stores/activity-store';
import { cn } from '@/lib/utils/cn';

type FilterMode = 'all' | 'active' | 'failed';

function StatusIcon({ status }: { status: ActiveOperation['status'] }) {
  switch (status) {
    case 'running':
    case 'pending':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />;
    case 'completed':
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
    case 'failed':
      return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
  }
}

function ElapsedTime({ startedAt, completedAt }: { startedAt: string; completedAt?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (completedAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [completedAt]);

  const elapsedAt = completedAt ? new Date(completedAt).getTime() : now;
  return <span className="text-navy-500 tabular-nums">{formatElapsed(startedAt, elapsedAt)}</span>;
}

function formatElapsed(startedAt: string, elapsedAt: number): string {
  const start = new Date(startedAt).getTime();
  const secs = Math.round((elapsedAt - start) / 1000);
  return secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
}

function OperationRow({ op }: { op: ActiveOperation }) {
  const [showError, setShowError] = useState(false);

  return (
    <div
      className={cn(
        'border-b border-navy-800 px-3 py-2 font-mono text-[11px] leading-relaxed',
        op.status === 'failed' ? 'bg-red-950/30' : op.status === 'completed' ? 'bg-emerald-950/10' : '',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          <StatusIcon status={op.status} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] text-gold-400">
              {op.tool}
            </span>
            <span className="text-navy-300 truncate">{op.label}</span>
            <span className="ml-auto shrink-0 text-[10px]">
              <ElapsedTime startedAt={op.startedAt} completedAt={op.completedAt} />
            </span>
          </div>

          {op.progress !== undefined && op.status === 'running' && (
            <div className="mt-1 h-1 w-full rounded-full bg-navy-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${op.progress}%` }}
              />
            </div>
          )}

          {op.error && (
            <button
              onClick={() => setShowError(!showError)}
              className="mt-1 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform', showError && 'rotate-180')} />
              {showError ? 'Hide error' : 'Show error'}
            </button>
          )}
          {showError && op.error && (
            <div className="mt-1 rounded bg-red-900/30 px-2 py-1 text-[10px] text-red-300">
              {op.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityPanel() {
  const operations = useActivityStore((s) => s.operations);
  const isOpen = useActivityStore((s) => s.isOpen);
  const toggle = useActivityStore((s) => s.toggle);
  const clearCompleted = useActivityStore((s) => s.clearCompleted);
  const [filter, setFilter] = useState<FilterMode>('all');

  const activeCount = operations.filter((op) => op.status === 'running' || op.status === 'pending').length;
  const errorCount = operations.filter((op) => op.status === 'failed').length;

  const filtered = operations.filter((op) => {
    if (filter === 'active') return op.status === 'running' || op.status === 'pending';
    if (filter === 'failed') return op.status === 'failed';
    return true;
  });

  return (
    <>
      {/* Floating trigger button — sits to the LEFT of the Ask PRAXIS pill so
          neither overlaps. Ask PRAXIS owns bottom-right (bottom-24 mobile /
          bottom-6 desktop). Activity sits at bottom-6 left-6. */}
      <button
        onClick={toggle}
        title="Activity Panel (running tools + recent failures)"
        aria-label="Open activity panel"
        className={cn(
          'fixed bottom-6 left-6 z-50 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all',
          activeCount > 0
            ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
            : errorCount > 0
              ? 'bg-red-600 text-white ring-2 ring-red-400/40'
              : 'bg-navy-800 text-navy-400 hover:text-white',
        )}
      >
        {activeCount > 0 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Activity className="h-3.5 w-3.5" />
        )}
        {(activeCount > 0 || errorCount > 0) && (
          <span
            className={cn(
              'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white',
              activeCount > 0 ? 'bg-blue-500' : 'bg-red-500',
            )}
          >
            {activeCount > 0 ? activeCount : errorCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-16 left-6 z-50 flex w-[420px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-navy-700 bg-navy-950 shadow-2xl"
            style={{ maxHeight: '60vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-navy-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-gold-500" />
                <span className="text-xs font-semibold text-navy-100">Activity</span>
                {activeCount > 0 && (
                  <span className="rounded bg-blue-800/60 px-1.5 py-0.5 text-[10px] text-blue-300">
                    {activeCount} running
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="rounded bg-red-800/60 px-1.5 py-0.5 text-[10px] text-red-300">
                    {errorCount} failed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearCompleted}
                  title="Clear completed"
                  className="rounded p-1 text-navy-500 hover:text-navy-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={toggle} className="rounded p-1 text-navy-500 hover:text-navy-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-navy-800 bg-navy-900/40 px-3">
              {(['all', 'active', 'failed'] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-medium capitalize transition-colors',
                    filter === mode
                      ? 'border-b-2 border-gold-500 text-gold-400'
                      : 'text-navy-500 hover:text-navy-300',
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Operations list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-navy-500">
                  <Clock className="mb-2 h-6 w-6" />
                  <span className="text-xs">
                    {filter === 'all' ? 'No operations yet' : `No ${filter} operations`}
                  </span>
                </div>
              ) : (
                filtered.map((op) => <OperationRow key={op.id} op={op} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
