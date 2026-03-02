'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, ChevronRight, User, Settings, LogOut } from 'lucide-react';
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
  assistant: 'Assistant',
  'media-compass': 'Media Compass',
  'conflict-graph': 'Conflict Graph',
  'un-toolkit': 'UN Toolkit',
  documents: 'Documents',
  settings: 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

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
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-navy-700/50 bg-navy-950/80 px-6 backdrop-blur-md">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-navy-600" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-navy-100">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-navy-400 transition-colors hover:text-navy-200"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          className="flex items-center gap-2 rounded-md border border-navy-700 bg-navy-800/50 px-3 py-1.5 text-sm text-navy-400 transition-colors hover:border-navy-600 hover:text-navy-300"
          onClick={() => {
            // Search functionality placeholder
          }}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-2 hidden rounded bg-navy-700 px-1.5 py-0.5 text-[10px] font-medium text-navy-400 sm:inline-block">
            Cmd+K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-200">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-500" />
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-navy-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/15 text-xs font-bold text-gold-400">
                {initials}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-navy-100">{user?.name}</p>
                <p className="text-xs text-navy-400">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
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
