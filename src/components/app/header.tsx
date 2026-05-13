'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, User, Settings, LogOut, Menu } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { NotificationBell } from '@/components/shared/notifications';
import { TrustShield } from '@/components/app/trust-shield';
import { useAuth } from '@/lib/auth/auth-context';
import { PRIMARY_NAV } from '@/lib/navigation/primary-nav';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function humanizeSegment(segment: string): string {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function breadcrumbLabel(segment: string, href: string): string {
  if (segment === 'app') return 'PRAXIS';
  const primary = PRIMARY_NAV.find((item) => item.href === href);
  if (primary) return primary.label;
  const parentPrimary = PRIMARY_NAV.find((item) => href.startsWith(`${item.href}/`));
  if (parentPrimary && href.split('/').length <= 3) return parentPrimary.label;
  const tool = PRAXIS_CANONICAL_TOOLS.find((item) => item.id === segment);
  if (tool) return tool.shortLabel || tool.name;
  return humanizeSegment(segment);
}

export function Header({
  isMobile,
  onOpenSearch,
}: {
  isMobile?: boolean;
  onOpenSearch?: (query?: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useAppStore();
  const [command, setCommand] = useState('');

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = breadcrumbLabel(segment, currentPath);
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

  function runCommand() {
    const value = command.trim();
    if (!value) {
      onOpenSearch?.();
      return;
    }
    if (value.startsWith('?')) {
      window.dispatchEvent(
        new CustomEvent('open-praxis-chat', {
          detail: { prompt: value.slice(1).trim() },
        }),
      );
      setCommand('');
      return;
    }
    onOpenSearch?.(value);
    setCommand('');
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-[var(--color-app-border)] bg-white/80 px-4 backdrop-blur-md md:px-6">
        {/* Mobile hamburger + Breadcrumbs */}
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="mr-2 rounded-lg p-1.5 text-navy-500 hover:bg-navy-50 hover:text-navy-700"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-navy-400" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="truncate font-medium text-navy-900">{crumb.label}</span>
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

        <form
          className="hidden min-w-0 flex-[1.2] items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-sm shadow-sm transition-colors focus-within:border-diplomatic-blue md:flex"
          onSubmit={(event) => {
            event.preventDefault();
            runCommand();
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-navy-400" />
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Command or ask PRAXIS..."
            className="min-w-0 flex-1 bg-transparent text-sm text-navy-950 placeholder:text-navy-600 focus:outline-none"
            aria-label="Ask PRAXIS or search"
          />
          <kbd className="rounded bg-[var(--color-app-surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-navy-400">
            Ctrl+K
          </kbd>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => onOpenSearch?.()}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-sm text-navy-500 transition-colors hover:border-navy-300 hover:text-navy-700 md:hidden"
            aria-label="Ask PRAXIS or search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Notifications */}
          <TrustShield />
          <NotificationBell />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md border border-[var(--color-app-border)] bg-white px-2 py-1.5 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-300 hover:bg-[var(--color-app-surface-alt)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-diplomatic-blue text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="hidden max-w-28 truncate md:inline">{user?.name ?? 'Account'}</span>
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
              <DropdownMenuItem onClick={() => router.push('/app/cores/user')}>
                <User className="mr-2 h-4 w-4" />
                User Core
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/app/settings')}>
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
  );
}
