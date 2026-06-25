'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Header } from '@/components/app/header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper';
import { SkipNudgeBanner } from '@/components/onboarding/skip-nudge-banner';
import { OnboardingBanner } from '@/components/shared/onboarding-banner';
import { GlobalSearch } from '@/components/shared/global-search';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { FloatingPraxis } from '@/components/app/floating-praxis';
import { MobileBottomNav } from '@/components/app/mobile-bottom-nav';
import { ActivityPanel } from '@/components/app/activity-panel';
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
  const isOnePageCockpit =
    pathname === '/app' ||
    pathname === '/app/capsules' ||
    pathname === '/app/recent-work' ||
    pathname === '/app/settings' ||
    pathname.startsWith('/app/conversations/');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setSidebarOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile, setSidebarOpen]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        orgName: user.orgName,
        isDemo: user.isDemo,
      });
      setDemoMode(false);
    }
  }, [user, setUser, setDemoMode]);

  useEffect(() => {
    if (user) void fetchSituations();
  }, [fetchSituations, user]);

  const openSearch = useCallback((query?: string) => {
    setSearchInitialQuery(query ?? '');
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchInitialQuery('');
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const searchEvent = event as SearchOpenEvent;
      openSearch(searchEvent.detail?.query);
    };
    window.addEventListener('open-praxis-search', handler);
    return () => window.removeEventListener('open-praxis-search', handler);
  }, [openSearch]);

  const openAsk = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-praxis-chat'));
  }, []);
  const closeOverlay = useCallback(() => {
    setSearchOpen(false);
  }, []);

  useKeyboardShortcuts({
    openSearch: () => openSearch(),
    openAsk,
    openHelp: () => window.dispatchEvent(new CustomEvent('open-praxis-help')),
    goHome: () => router.push('/app'),
    goCores: () => router.push('/app'),
    goLibrary: () => router.push('/app'),
    goWrite: () => router.push('/app'),
    goCanvas: () => router.push('/app'),
    goTools: () => router.push('/app'),
    goSettings: () => router.push('/app/settings'),
    closeModal: closeOverlay,
  });

  // Show loading state while Firebase auth is initializing
  if (loading) {
    return <AppShellLoadingState label="Loading PRAXIS..." />;
  }

  if (!user) {
    return <AppShellLoadingState label="Loading demo workspace..." />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <>
      {isOnePageCockpit ? (
        <div className="app-light praxis-app-surface h-screen overflow-y-auto" data-testid="praxis-one-page-app-shell">
          <ErrorBoundary>
            <ToolErrorBoundary>
              <PraxisRouteTransition>
                {children}
              </PraxisRouteTransition>
            </ToolErrorBoundary>
          </ErrorBoundary>
          <AiErrorToast />
        </div>
      ) : (
      <>
      <div className="app-light praxis-app-surface flex h-screen overflow-hidden">
        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — fixed drawer on mobile, inline on desktop. The mobile
            wrapper carries its own solid background + shadow so the drawer
            always reads as opaque even before the AppSidebar surface var
            resolves. */}
        <div
          className={
            isMobile
              ? `fixed inset-y-0 left-0 z-50 bg-white shadow-[var(--shadow-modal)] transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : ''
          }
        >
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <OnboardingBanner />
          {!user.isDemo && <SkipNudgeBanner />}
          <Header isMobile={isMobile} onOpenSearch={openSearch} />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
              <ErrorBoundary>
                <ToolErrorBoundary>
                  <PraxisRouteTransition>
                    {children}
                  </PraxisRouteTransition>
                </ToolErrorBoundary>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      {/* Onboarding: welcome modal + guided walkthrough */}
      <OnboardingWrapper />
      {/* Calibration transparency modal — what's about to run */}
      <CalibrationTransparencyModal />
      {/* Floating Ask PRAXIS button + chat panel */}
      <FloatingPraxis />
      <MobileBottomNav />
      {/* Activity panel — real-time operation tracking, bottom-right corner */}
      <ActivityPanel />
      {/* Cross-tool AI error toast — consumes the publish channel from
          src/stores/ai-error-store. Every tool's failed fetch can publish
          a structured error and show a consistent retry-able toast here. */}
      <AiErrorToast />
      </>
      )}
      {/* Global search overlay */}
      {searchOpen && (
        <GlobalSearch
          key={searchInitialQuery || 'empty-command'}
          onClose={closeSearch}
          initialQuery={searchInitialQuery}
        />
      )}
      <SignedInChrome showAccountButton={isOnePageCockpit} />
      </>
    </TooltipProvider>
  );
}

function AppShellLoadingState({ label }: { label: string }) {
  return (
    <div className="app-light praxis-app-surface flex min-h-screen items-center justify-center p-6">
      <div className="praxis-enter w-full max-w-4xl space-y-5" role="status" aria-label={label}>
        <span className="sr-only">{label}</span>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-72 max-w-full rounded" />
          </div>
        </div>
        <div className="praxis-enter-stagger grid gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="specimen-card grid min-h-64 gap-3 rounded-lg p-4">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="receipt-slip rounded-md p-3">
                <Skeleton className="praxis-skeleton-dark h-3 w-24 rounded" />
                <Skeleton className="praxis-skeleton-dark mt-2 h-3 w-full rounded" />
                <Skeleton className="praxis-skeleton-dark mt-2 h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

