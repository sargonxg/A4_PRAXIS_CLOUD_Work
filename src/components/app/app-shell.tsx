'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Header } from '@/components/app/header';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setUser, sidebarOpen } = useAppStore();

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="app-light flex h-screen overflow-hidden bg-[var(--color-app-bg)]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
