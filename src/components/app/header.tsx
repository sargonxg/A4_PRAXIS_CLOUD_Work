'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { NotificationBell } from '@/components/shared/notifications';
import { AccountProfileButton } from '@/components/app/account-profile-button';
import { breadcrumbsForPath } from '@/lib/navigation/primary-nav';

export function Header({ isMobile, onOpenSearch }: { isMobile?: boolean; onOpenSearch?: (query?: string) => void }) {
  const pathname = usePathname();
  const { toggleSidebar } = useAppStore();
  const breadcrumbs = pathname.startsWith('/app/conversations/') ? [{ label: 'Chat', href: '/app' }] : breadcrumbsForPath(pathname);
  return (
    <header className="praxis-app-header flex min-h-16 shrink-0 items-center gap-2 px-3 sm:px-6">
      {isMobile ? <button type="button" onClick={toggleSidebar} className="praxis-header-control" aria-label="Open navigation"><Menu className="h-5 w-5" /></button> : null}
      <nav className="flex min-w-0 flex-1 items-center gap-2 text-sm" aria-label="Breadcrumb">
        {(isMobile ? breadcrumbs.slice(-1) : breadcrumbs).map((crumb, index, items) => <span key={crumb.href} className="flex min-w-0 items-center gap-2">
          {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-app-text-secondary)]" aria-hidden /> : null}
          {index === items.length - 1 ? <span className="truncate font-medium text-[var(--color-deep-ink)]">{crumb.label}</span> : <Link href={crumb.href} className="truncate text-[var(--color-app-text-secondary)] hover:text-[var(--color-praxis-emerald-700)]">{crumb.label}</Link>}
        </span>)}
      </nav>
      <button type="button" onClick={() => onOpenSearch?.()} className="praxis-header-control gap-2" aria-label="Search workspace"><Search className="h-4 w-4" /><span className="hidden text-xs sm:inline">Search</span><kbd className="hidden rounded border border-[var(--color-app-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-app-text-secondary)] lg:inline">Ctrl K</kbd></button>
      <NotificationBell />
      <AccountProfileButton compact={isMobile} />
    </header>
  );
}
