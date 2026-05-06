'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { usePraxisRoute } from '@/lib/utils/routes';
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
import { DebugPanel } from '@/components/app/debug-panel';
import { ActivityPanel } from '@/components/app/activity-panel';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { ToolErrorBoundary } from '@/components/praxis/tool-error-boundary';
import { AiErrorToast } from '@/components/praxis/ai-error-toast';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setUser, setDemoMode, sidebarOpen, setSidebarOpen } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const route = usePraxisRoute();
  const isDemoRoute = pathname.startsWith('/demo');
  const [searchOpen, setSearchOpen] = useState(false);
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

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useKeyboardShortcuts({
    openSearch,
    newReport: () => router.push(route('/reports/new')),
    openAssistant: () => router.push(route('/assistant')),
    openConflictGraph: () => router.push(route('/conflict-graph')),
    openDashboard: () => router.push(route('/workbench')),
    closeModal: () => setSearchOpen(false),
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

        {/* Sidebar — fixed drawer on mobile, inline on desktop */}
        <div
          className={
            isMobile
              ? `fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : ''
          }
        >
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <DemoModeBanner />
          {!user.isDemo && <SkipNudgeBanner />}
          <Header isMobile={isMobile} />
          <main className="flex-1 overflow-y-auto">
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
      {searchOpen && <GlobalSearch onClose={closeSearch} />}
      {/* Onboarding: welcome modal + guided walkthrough */}
      <OnboardingWrapper />
      {/* Floating Ask PRAXIS button + chat panel */}
      <FloatingPraxis />
      {/* Debug panel — Ctrl+Shift+D to toggle, bottom-left corner */}
      <DebugPanel />
      {/* Activity panel — real-time operation tracking, bottom-right corner */}
      <ActivityPanel />
      {/* Cross-tool AI error toast — consumes the publish channel from
          src/stores/ai-error-store. Every tool's failed fetch can publish
          a structured error and show a consistent retry-able toast here. */}
      <AiErrorToast />
    </TooltipProvider>
  );
}
