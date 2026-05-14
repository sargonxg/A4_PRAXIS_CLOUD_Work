'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { PRIMARY_NAV } from '@/lib/navigation/primary-nav';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Header } from '@/components/app/header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DemoModeBanner } from '@/components/onboarding/demo-mode-banner';
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper';
import { SkipNudgeBanner } from '@/components/onboarding/skip-nudge-banner';
import { GlobalSearch } from '@/components/shared/global-search';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useNotificationStore } from '@/stores/notification-store';
import { Loader2 } from 'lucide-react';
import { FloatingPraxis } from '@/components/app/floating-praxis';
import { MobileBottomNav } from '@/components/app/mobile-bottom-nav';
import { ActivityPanel } from '@/components/app/activity-panel';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { ToolErrorBoundary } from '@/components/praxis/tool-error-boundary';
import { AiErrorToast } from '@/components/praxis/ai-error-toast';
import { CoreContextStrip } from '@/components/app/core-context-strip';
import { LiveContextReadinessCard } from '@/components/app/live-context-readiness-card';
import { CalibrationTransparencyModal } from '@/components/app/calibration-transparency-modal';
import { useSituationStore } from '@/stores/situation-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setUser, setDemoMode, sidebarOpen, setSidebarOpen } = useAppStore();
  const fetchSituations = useSituationStore((state) => state.fetchSituations);
  const router = useRouter();
  const pathname = usePathname();
  const isDemoRoute = pathname.startsWith('/demo');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
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
    if (!loading && !user && !isDemoRoute) {
      router.push('/login');
    }
  }, [isDemoRoute, loading, user, router]);

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
      if (user.isDemo) {
        setDemoMode(true);
        useNotificationStore.getState().seedDemoNotifications();
      } else {
        setDemoMode(false);
      }
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
  const openAsk = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-praxis-chat'));
  }, []);
  const closeOverlay = useCallback(() => {
    setSearchOpen(false);
    setHelpOpen(false);
  }, []);

  useKeyboardShortcuts({
    openSearch: () => openSearch(),
    openAsk,
    openHelp: () => setHelpOpen(true),
    goHome: () => router.push('/app/dashboard'),
    goCores: () => router.push('/app/contexts'),
    goLibrary: () => router.push('/app/workbench'),
    goWrite: () => router.push('/app/write'),
    goCanvas: () => router.push('/app/canvas'),
    goTools: () => router.push('/app/tools'),
    goSettings: () => router.push('/app/settings'),
    closeModal: closeOverlay,
  });

  // Show loading state while Firebase auth is initializing
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-app-bg)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-diplomatic-blue" />
          <p className="text-sm text-navy-500">Loading PRAXIS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-app-bg)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-diplomatic-blue" />
          <p className="text-sm text-navy-500">Loading demo workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="app-light flex h-screen overflow-hidden bg-[var(--color-app-bg)]">
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
              ? `fixed inset-y-0 left-0 z-50 bg-white shadow-2xl shadow-navy-950/20 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : ''
          }
        >
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <DemoModeBanner />
          {!user.isDemo && <SkipNudgeBanner />}
          <Header isMobile={isMobile} onOpenSearch={openSearch} />
          <CoreContextStrip />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
              <ErrorBoundary>
                <ToolErrorBoundary>
                  {children}
                </ToolErrorBoundary>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      {/* Global search overlay */}
      {searchOpen && (
        <GlobalSearch
          key={searchInitialQuery || 'empty-command'}
          onClose={closeSearch}
          initialQuery={searchInitialQuery}
        />
      )}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-navy-950/25 px-4 pt-20 backdrop-blur-sm" onClick={() => setHelpOpen(false)}>
          <div
            className="w-full max-w-md rounded-xl border border-[var(--color-app-border)] bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-navy-900">Shortcuts</h2>
              <p className="text-xs text-navy-500">Use PRAXIS from the keyboard.</p>
            </div>
            <div className="space-y-2">
              <ShortcutRow keys="Cmd+K" label="Ask PRAXIS or search" />
              {PRIMARY_NAV.filter((item): item is typeof item & { shortcut: string } => Boolean(item.shortcut)).map((item) => (
                <ShortcutRow key={item.id} keys={item.shortcut} label={item.label} />
              ))}
              <ShortcutRow keys="Esc" label="Close overlay" />
            </div>
          </div>
        </div>
      )}
      {/* Onboarding: welcome modal + guided walkthrough */}
      <OnboardingWrapper />
      {/* Live Context Readiness — pinned top-right on cores, write, ask. */}
      {(pathname === '/app/contexts' ||
        pathname.startsWith('/app/write') ||
        pathname.startsWith('/app/assistant')) && <LiveContextReadinessCard />}
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
    </TooltipProvider>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-app-surface-alt)] px-3 py-2">
      <span className="text-sm text-navy-700">{label}</span>
      <kbd className="rounded border border-[var(--color-app-border)] bg-white px-2 py-0.5 text-[11px] font-medium text-navy-500">
        {keys}
      </kbd>
    </div>
  );
}
