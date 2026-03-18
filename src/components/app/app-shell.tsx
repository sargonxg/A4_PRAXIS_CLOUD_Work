'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Header } from '@/components/app/header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DemoModeBanner } from '@/components/onboarding/demo-mode-banner';
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper';
import { GlobalSearch } from '@/components/shared/global-search';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setUser, sidebarOpen } = useAppStore();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useKeyboardShortcuts({
    openSearch,
    newReport: () => router.push('/reports/new'),
    openAssistant: () => router.push('/assistant'),
    openConflictGraph: () => router.push('/conflict-graph'),
    openDashboard: () => router.push('/dashboard'),
    closeModal: () => setSearchOpen(false),
  });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="app-light flex h-screen overflow-hidden bg-[var(--color-app-bg)]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DemoModeBanner />
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      {/* Global search overlay */}
      {searchOpen && <GlobalSearch onClose={closeSearch} />}
      {/* Onboarding: welcome modal + guided walkthrough */}
      <OnboardingWrapper />
    </TooltipProvider>
  );
}
