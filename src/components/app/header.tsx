'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePraxisRoute } from '@/lib/utils/routes';
import { Search, ChevronRight, User, Settings, LogOut, Sparkles, X, Send, Coins } from 'lucide-react';
import { NotificationBell } from '@/components/shared/notifications';
import { GlobalSearch } from '@/components/shared/global-search';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const routeLabels: Record<string, string> = {
  app: 'Home',
  dashboard: 'Dashboard',
  reports: 'Report Studio',
  new: 'New Report',
  assistant: 'PRAXIS Assistant',
  'media-compass': 'Media Compass',
  'conflict-graph': 'Conflict Graph',
  'un-toolkit': 'UN Toolkit',
  documents: 'Documents',
  settings: 'Settings',
  calendar: 'Calendar Monitor',
  advisory: 'Advisory Council',
  'talking-points': 'Talking Points',
  'stakeholder-map': 'Stakeholder Map',
  'early-warning': 'Early Warning',
  sanctions: 'Sanctions Tracker',
  scenarios: 'Scenario Planner',
  cases: 'Case Library',
  compare: 'Conflict Comparison',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const route = usePraxisRoute();
  const { user, credits, logout } = useAuth();
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistQuery, setAssistQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ label, href: currentPath });
    }

    return crumbs;
  }, [pathname]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  async function handleLogout() {
    try {
      await logout();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-[var(--color-app-border)] bg-white/80 px-6 backdrop-blur-md">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-navy-400" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-navy-900">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-navy-400 transition-colors hover:text-navy-600"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* AI Quick Ask */}
          <button
            onClick={() => setAssistOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-1.5 text-sm text-gold-700 transition-all hover:border-gold-500/40 hover:bg-gold-500/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask PRAXIS</span>
            <kbd className="ml-1 hidden rounded bg-gold-500/10 px-1.5 py-0.5 text-[10px] font-medium text-gold-600 sm:inline-block">
              /
            </kbd>
          </button>

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-sm text-navy-400 transition-colors hover:border-navy-300 hover:text-navy-600"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-2 hidden rounded bg-[var(--color-app-surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-navy-400 sm:inline-block">
              Cmd+K
            </kbd>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--color-app-surface-alt)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-diplomatic-blue text-xs font-bold text-white">
                  {initials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-navy-900">{user?.name}</p>
                  <p className="text-xs text-navy-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="mx-2 my-1.5 rounded-md border border-emerald-200/60 bg-emerald-50/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Credits</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{user?.isDemo ? '∞' : credits}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(route('/settings'))}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(route('/settings'))}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-crimson focus:text-crimson">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search */}
      {searchOpen && <GlobalSearch onClose={closeSearch} />}

      {/* AI Assistant Overlay */}
      {assistOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setAssistOpen(false)}>
          <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
                <Sparkles className="h-4 w-4 text-gold-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-navy-900">Ask PRAXIS Anything</h3>
                <p className="text-[11px] text-navy-500">AI-powered intelligence assistant for your current context</p>
              </div>
              <button onClick={() => setAssistOpen(false)} className="rounded-md p-1 text-navy-400 hover:text-navy-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={assistQuery}
                  onChange={(e) => setAssistQuery(e.target.value)}
                  placeholder='e.g., "Summarize today&apos;s UNSC developments" or "Draft talking points on Sahel"'
                  className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-2 focus:ring-gold-500/10"
                  autoFocus
                />
                <button className="flex h-11 w-11 items-center justify-center rounded-lg bg-diplomatic-blue text-white transition-colors hover:bg-diplomatic-blue/90">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'What are today\'s key developments?',
                  'Brief me on the Nordalia situation',
                  'Draft a cable on Sahel security',
                  'Summarize recent UNSC resolutions',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setAssistQuery(suggestion)}
                    className="rounded-full border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs text-navy-600 transition-colors hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-navy-900"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
