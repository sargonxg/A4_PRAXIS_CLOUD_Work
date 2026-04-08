'use client';

import { useEffect, useState, Component, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Bug, CheckCircle, AlertCircle, Loader2, Info, RefreshCw, Coins } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDebugStore, type DebugEntry } from '@/stores/debug-store';
import { cn } from '@/lib/utils/cn';

/**
 * Error boundary that catches crashes in the debug panel
 * and shows a minimal recovery UI instead of crashing the whole app.
 */
class DebugErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  state = { hasError: false, errorMsg: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    console.error('[DebugPanel] Crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-red-900/80 px-3 py-2 text-xs text-red-200 shadow-lg">
          <Bug className="h-3.5 w-3.5" />
          <span>Debug panel crashed</span>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            className="rounded bg-red-800 px-2 py-0.5 text-[10px] hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface HealthStatus {
  status: string;
  services: Record<string, boolean>;
  timestamp: string;
}

function EntryIcon({ type }: { type: DebugEntry['type'] }) {
  if (type === 'request') return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />;
  if (type === 'success') return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
  if (type === 'error') return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
  return <Info className="h-3.5 w-3.5 text-navy-400" />;
}

function EntryRow({ entry }: { entry: DebugEntry }) {
  const time = new Date(entry.ts).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={cn(
      'border-b border-navy-800 px-3 py-2 font-mono text-[11px] leading-relaxed',
      entry.type === 'error' ? 'bg-red-950/30' : entry.type === 'success' ? 'bg-emerald-950/20' : ''
    )}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0"><EntryIcon type={entry.type} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-navy-300">
            <span className="text-navy-500">{time}</span>
            {entry.tool && <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] text-gold-400">{entry.tool}</span>}
            {entry.status && <span className={cn('text-[10px]', entry.status >= 400 ? 'text-red-400' : 'text-emerald-400')}>HTTP {entry.status}</span>}
            {entry.elapsed !== undefined && <span className="text-navy-500">{entry.elapsed}s</span>}
          </div>
          {entry.situation && <div className="mt-0.5 text-navy-400">Situation: {entry.situation}</div>}
          {entry.endpoint && <div className="mt-0.5 truncate text-navy-500">{entry.endpoint}</div>}
          {entry.error && <div className="mt-0.5 text-red-300">{entry.error}</div>}
          {entry.message && <div className="mt-0.5 text-navy-300">{entry.message}</div>}
        </div>
      </div>
    </div>
  );
}

function DebugPanelInner() {
  const { entries, isOpen, toggle, clear } = useDebugStore();
  const { credits } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState<string | null>(null);

  const handleTopUp = async () => {
    setTopUpLoading(true);
    setTopUpMsg(null);
    try {
      const res = await fetch('/api/admin/add-credits', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTopUpMsg(`✓ Added credits — balance now ${data.credits}`);
      } else {
        setTopUpMsg(`✗ ${data.error}`);
      }
    } catch {
      setTopUpMsg('✗ Network error');
    } finally {
      setTopUpLoading(false);
    }
  };

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'error', services: {}, timestamp: new Date().toISOString() });
      console.warn('[DebugPanel] Health check failed:', err instanceof Error ? err.message : err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHealth();
  }, [isOpen]);

  // Keyboard shortcut: Ctrl+Shift+D to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  const pendingCount = entries.filter((e) => e.type === 'request').length;
  const errorCount = entries.filter((e) => e.type === 'error').length;

  return (
    <>
      {/* Floating trigger button — bottom-left corner */}
      <button
        onClick={toggle}
        title="Debug Panel (Ctrl+Shift+D)"
        className={cn(
          'fixed bottom-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all',
          errorCount > 0
            ? 'bg-red-600 text-white ring-2 ring-red-400/40'
            : pendingCount > 0
              ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
              : 'bg-navy-800 text-navy-400 hover:text-white'
        )}
      >
        {pendingCount > 0
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Bug className="h-3.5 w-3.5" />}
        {errorCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {errorCount > 9 ? '9+' : errorCount}
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
            className="fixed bottom-14 left-4 z-50 flex w-[420px] flex-col overflow-hidden rounded-xl border border-navy-700 bg-navy-950 shadow-2xl"
            style={{ maxHeight: '60vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-navy-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <Bug className="h-3.5 w-3.5 text-gold-500" />
                <span className="text-xs font-semibold text-navy-100">PRAXIS Debug Console</span>
                <span className="rounded bg-navy-800 px-1.5 py-0.5 text-[10px] text-navy-400">
                  {entries.length} events
                </span>
                {pendingCount > 0 && (
                  <span className="rounded bg-blue-800/60 px-1.5 py-0.5 text-[10px] text-blue-300">
                    {pendingCount} in-flight
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="rounded bg-red-800/60 px-1.5 py-0.5 text-[10px] text-red-300">
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clear} title="Clear logs" className="rounded p-1 text-navy-500 hover:text-navy-200">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={toggle} className="rounded p-1 text-navy-500 hover:text-navy-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Credits + top-up */}
            <div className="flex items-center justify-between border-b border-navy-800 bg-navy-900/40 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-[10px]">
                <Coins className="h-3 w-3 text-gold-500" />
                <span className={cn('font-mono', typeof credits === 'number' && credits < 10 ? 'text-red-400 font-bold' : 'text-navy-300')}>
                  {typeof credits === 'number' ? credits : '…'} credits
                </span>
                {typeof credits === 'number' && credits < 10 && (
                  <span className="text-red-400 font-bold">— LOW!</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {topUpMsg && <span className="text-[10px] text-emerald-400">{topUpMsg}</span>}
                <button
                  onClick={handleTopUp}
                  disabled={topUpLoading}
                  className="flex items-center gap-1 rounded bg-gold-600/20 px-2 py-0.5 text-[10px] text-gold-400 hover:bg-gold-600/30 disabled:opacity-50"
                >
                  {topUpLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Coins className="h-2.5 w-2.5" />}
                  +1000 credits
                </button>
              </div>
            </div>

            {/* Provider health bar */}
            <div className="flex items-center gap-2 border-b border-navy-800 bg-navy-900/60 px-3 py-1.5 flex-wrap">
              {healthLoading && <Loader2 className="h-3 w-3 animate-spin text-navy-500" />}
              {health ? (
                <>
                  {Object.entries(health.services).map(([svc, ok]) => (
                    <span key={svc} className={cn('flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]',
                      ok ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-400' : 'bg-red-400')} />
                      {svc}
                    </span>
                  ))}
                  <button onClick={fetchHealth} className="ml-auto text-navy-600 hover:text-navy-300">
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button onClick={fetchHealth} className="text-[10px] text-navy-500 hover:text-navy-300">
                  Check service health
                </button>
              )}
            </div>

            {/* Log entries */}
            <div className="overflow-y-auto flex-1">
              {entries.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-navy-600">
                  No events yet — trigger a tool generation to see logs
                </div>
              ) : (
                entries.map((entry) => <EntryRow key={entry.id + entry.ts} entry={entry} />)
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-navy-800 px-3 py-1.5 text-[10px] text-navy-600">
              Ctrl+Shift+D to toggle · Shows last {50} API events
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function DebugPanel() {
  return (
    <DebugErrorBoundary>
      <DebugPanelInner />
    </DebugErrorBoundary>
  );
}
