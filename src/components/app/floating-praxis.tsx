'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Sparkles, X } from 'lucide-react';
import { PraxisChat } from '@/components/app/praxis-chat';
import { AskContextBar } from '@/components/app/ask-context-bar';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { useAppStore } from '@/stores/app-store';
import { useSituationStore } from '@/stores/situation-store';

const TOOL_BY_ROUTE: Array<{ match: string; toolId: string }> = [
  { match: '/app/boardroom', toolId: 'boardroom' },
  { match: '/app/capsules', toolId: 'capsule-workbench' },
  { match: '/app/recent-work', toolId: 'recent-work' },
  { match: '/app/settings', toolId: 'settings' },
];

/**
 * Floating Ask PRAXIS launcher for deep workspace pages.
 *
 * The chat body is intentionally shared with the home cockpit via PraxisChat;
 * this component only owns the launcher, slide-over, and global open event.
 */
export function FloatingPraxis({ hideLauncher = false }: { hideLauncher?: boolean } = {}) {
  const pathname = usePathname();
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const demoMode = useAppStore((state) => state.demoMode);
  const { stack, saveStack, hydrated, persisted } = useActiveContextStack();
  const [isOpen, setIsOpen] = useState(false);
  const [seedPrompt, setSeedPrompt] = useState('');
  const [autoSendNonce, setAutoSendNonce] = useState(0);
  const currentToolId = useMemo(() => {
    const path = pathname ?? '';
    return TOOL_BY_ROUTE.find((entry) => path.startsWith(entry.match))?.toolId;
  }, [pathname]);
  const storageKey = activeSituation
    ? `praxis-floating-chat-${activeSituation.id}`
    : `praxis-floating-chat-${stack.capsuleId ?? stack.contextPackageId ?? 'global'}`;

  useEffect(() => {
    const openHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string; autoSend?: boolean }>).detail;
      if (detail?.prompt) setSeedPrompt(detail.prompt);
      if (detail?.autoSend) setAutoSendNonce((value) => value + 1);
      setIsOpen(true);
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('open-praxis-chat', openHandler as EventListener);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('open-praxis-chat', openHandler as EventListener);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [isOpen]);

  if (pathname === '/app' || pathname?.includes('/assistant')) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && !hideLauncher ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-[60] flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-praxis-emerald-500)]/30 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-float)] ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 md:bottom-6 md:right-6"
            aria-label="Ask PRAXIS"
          >
            <Sparkles className="h-4 w-4 text-[color:var(--color-praxis-emerald-300)]" />
            <span>Ask PRAXIS</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-slate-800 bg-slate-950 shadow-[var(--shadow-modal)] md:bottom-6 md:right-6 md:top-auto md:h-[620px] md:max-h-[82vh] md:w-[440px] md:rounded-[var(--radius-lg)] md:border"
              aria-label="Floating Ask PRAXIS"
            >
              <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-praxis-emerald-500)]/12">
                    <Sparkles className="h-4 w-4 text-[color:var(--color-praxis-emerald-300)]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Ask PRAXIS</h2>
                    <p className="text-[10px] text-slate-400">
                      {activeSituation?.name ?? 'Workspace assistant'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-calibration-modal'))}
                    className="rounded-[var(--radius-md)] p-1.5 text-slate-400 hover:bg-slate-900 hover:text-[color:var(--color-praxis-emerald-300)]"
                    aria-label="Inspect calibration"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-[var(--radius-md)] p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
                    aria-label="Close Ask PRAXIS"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>
              <div className="min-h-0 flex-1">
                <PraxisChat
                  mode="authenticated"
                  activeContextStack={stack}
                  activeSituation={activeSituation}
                  autoFocus
                  autoSendNonce={autoSendNonce}
                  className="h-full"
                  compact
                  contextBar={(
                    <AskContextBar
                      mode="authenticated"
                      stack={stack}
                      saveStack={saveStack}
                      hydrated={hydrated}
                      persisted={persisted}
                      activeSituation={activeSituation}
                      variant="floating"
                    />
                  )}
                  currentPath={pathname}
                  currentToolId={currentToolId}
                  demoMode={demoMode}
                  greeting="Ask about this page, request a source check, or continue the current policy thread."
                  initialPrompt={seedPrompt}
                  storageKey={storageKey}
                  variant="floating"
                />
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
