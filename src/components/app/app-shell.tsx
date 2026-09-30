'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Header } from '@/components/app/header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalSearch } from '@/components/shared/global-search';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { MobileBottomNav } from '@/components/app/mobile-bottom-nav';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { ToolErrorBoundary } from '@/components/praxis/tool-error-boundary';
import { AiErrorToast } from '@/components/praxis/ai-error-toast';
import { CalibrationTransparencyModal } from '@/components/app/calibration-transparency-modal';
import { useSituationStore } from '@/stores/situation-store';
import { Skeleton } from '@/components/ui/skeleton';
import { PraxisRouteTransition } from '@/components/ui/praxis-motion';
import { SignedInChrome } from '@/components/app/signed-in-chrome';

type SearchOpenEvent = CustomEvent<{ query?: string }>;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setUser, setDemoMode, sidebarOpen, setSidebarOpen } = useAppStore();
  const fetchSituations = useSituationStore((state) => state.fetchSituations);
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => { setIsMobile(media.matches); if (media.matches) setSidebarOpen(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [setSidebarOpen]);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [pathname, isMobile, setSidebarOpen]);

  useEffect(() => {
    if (loading || user) return;
    const destination = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?${new URLSearchParams({ redirect: destination })}`);
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setUser({ id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId, orgName: user.orgName, isDemo: user.isDemo });
    setDemoMode(false);
    void fetchSituations();
  }, [fetchSituations, user, setUser, setDemoMode]);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>('a,button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSidebarOpen(false); return; }
      if (event.key !== 'Tab' || !drawer) return;
      const controls = [...drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])')].filter((control) => control.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  const openSearch = useCallback((query?: string) => { setSearchInitialQuery(query ?? ''); setSearchOpen(true); }, []);
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchInitialQuery(''); }, []);
  const openAsk = useCallback((prompt?: string) => {
    if (prompt) router.push(`/app?${new URLSearchParams({ prompt })}`);
    else if (pathname !== '/app') router.push('/app');
    else document.querySelector<HTMLTextAreaElement>('[data-testid="marketing-hero-prompt"]')?.focus();
  }, [pathname, router]);

  useEffect(() => {
    const search = (event: Event) => openSearch((event as SearchOpenEvent).detail?.query);
    const ask = (event: Event) => openAsk((event as CustomEvent<{ prompt?: string }>).detail?.prompt);
    window.addEventListener('open-praxis-search', search);
    window.addEventListener('open-praxis-chat', ask);
    return () => { window.removeEventListener('open-praxis-search', search); window.removeEventListener('open-praxis-chat', ask); };
  }, [openAsk, openSearch]);

  useKeyboardShortcuts({ openSearch: () => openSearch(), openAsk: () => openAsk(), openHelp: () => window.dispatchEvent(new CustomEvent('open-praxis-help')), goHome: () => router.push('/app'), goCores: () => router.push('/app/capsules'), goLibrary: () => router.push('/app/capsules'), goWrite: () => router.push('/app?panel=memo'), goCanvas: () => router.push('/app/capsules?lane=inspect'), goTools: () => router.push('/app'), goSettings: () => router.push('/app/settings'), closeModal: closeSearch });

  if (loading || !user) return <AppShellLoadingState label={loading ? 'Loading your workspace…' : 'Opening sign in…'} />;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="app-light praxis-app-surface praxis-workspace flex h-dvh overflow-hidden" data-testid="praxis-one-page-app-shell">
        {isMobile && sidebarOpen ? <button type="button" className="fixed inset-0 z-40 bg-[var(--color-deep-ink)]/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" tabIndex={-1} /> : null}
        <div ref={drawerRef} role={isMobile && sidebarOpen ? 'dialog' : undefined} aria-modal={isMobile && sidebarOpen ? true : undefined} aria-label={isMobile && sidebarOpen ? 'Workspace navigation' : undefined} inert={isMobile && !sidebarOpen} className={isMobile ? `fixed inset-y-0 left-0 z-50 bg-[var(--color-archive-paper)] shadow-[var(--shadow-modal)] transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : ''}><AppSidebar /></div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden" inert={isMobile && sidebarOpen}>
          <Header isMobile={isMobile} onOpenSearch={openSearch} />
          <main id="workspace-main" className="praxis-workspace-main min-h-0 flex-1 overflow-y-auto pb-24 md:pb-6">
            <div className="mx-auto min-w-0 max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
              <ErrorBoundary><ToolErrorBoundary><PraxisRouteTransition>{children}</PraxisRouteTransition></ToolErrorBoundary></ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      {!sidebarOpen || !isMobile ? <MobileBottomNav /> : null}
      <AiErrorToast />
      <CalibrationTransparencyModal />
      {searchOpen ? <GlobalSearch key={searchInitialQuery || 'empty-command'} onClose={closeSearch} initialQuery={searchInitialQuery} /> : null}
      <SignedInChrome showAccountButton={false} />
    </TooltipProvider>
  );
}

function AppShellLoadingState({ label }: { label: string }) {
  return <div className="app-light praxis-app-surface flex min-h-dvh items-center justify-center p-6"><div className="w-full max-w-2xl space-y-5" role="status" aria-label={label}><p className="font-serif text-2xl text-[var(--color-deep-ink)]">{label}</p><Skeleton className="h-4 w-48" /><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-lg" /></div></div>;
}
