'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, FileText, FolderKanban, LogOut, Settings, Sparkles, Wrench } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { PRIMARY_NAV } from '@/lib/navigation/primary-nav';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/stores/app-store';

const ICONS = { Sparkles, FolderKanban, FileText, Wrench, Settings };

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const initials = (user?.name || user?.email || 'DA').split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'DA';

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className={cn('flex h-screen shrink-0 flex-col border-r border-[var(--color-app-border)] bg-[var(--color-app-sidebar)] transition-[width] duration-200', sidebarOpen ? 'w-72' : 'w-16')} aria-label="PRAXIS navigation">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--color-app-border)] px-3">
        <PraxisLink href="/app/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-diplomatic-blue text-sm font-bold text-white">P</span>
          {sidebarOpen ? <span className="min-w-0"><span className="block truncate text-sm font-semibold text-navy-950">PRAXIS</span><span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">by TACITUS</span></span> : null}
        </PraxisLink>
        <button type="button" onClick={toggleSidebar} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-navy-400 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700" aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          {sidebarOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {PRIMARY_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <PraxisLink key={item.id} href={item.href} title={!sidebarOpen ? item.label : undefined} className={cn('flex items-center rounded-lg py-2 text-sm font-medium transition', sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2', active ? 'bg-[var(--color-app-surface-alt)] text-navy-950' : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-800')}>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {sidebarOpen ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
              {sidebarOpen ? <span className="font-mono text-[10px] text-navy-400">{item.shortcut}</span> : null}
            </PraxisLink>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-app-border)] p-2">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue text-xs font-bold text-white">{initials}</span>
          {sidebarOpen ? <span className="min-w-0"><span className="block truncate text-sm font-medium text-navy-900">{user?.name ?? 'Analyst'}</span><span className="block truncate text-xs text-navy-400">{user?.isDemo ? 'Example session' : user?.email}</span></span> : null}
        </div>
        <button type="button" onClick={handleLogout} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-sm text-navy-500 transition hover:bg-crimson/5 hover:text-crimson', sidebarOpen ? 'gap-3 justify-start' : 'justify-center')}>
          <LogOut className="h-4 w-4 shrink-0" />
          {sidebarOpen ? <span>Sign out</span> : null}
        </button>
      </div>
    </aside>
  );
}
