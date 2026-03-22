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
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setUser, setDemoMode } = useAppStore();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

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
      if (user.isDemo) setDemoMode(true);
      else setDemoMode(false);
    }
  }, [user, setUser, setDemoMode]);

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

  if (!user) return null;

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
