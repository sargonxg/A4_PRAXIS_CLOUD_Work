'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, Menu } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { NotificationBell } from '@/components/shared/notifications';
import { TrustPostureChip } from '@/components/app/trust-posture-chip';
import { CapsuleStripHeader } from '@/components/app/capsule-strip-header';
import { AccountProfileButton } from '@/components/app/account-profile-button';
import { breadcrumbsForPath, PRIMARY_NAV } from '@/lib/navigation/primary-nav';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';

export function Header({
  isMobile,
  onOpenSearch,
}: {
  isMobile?: boolean;
  onOpenSearch?: (query?: string) => void;
}) {
  const pathname = usePathname();
  const { toggleSidebar } = useAppStore();
  const [command, setCommand] = useState('');

  const breadcrumbs = useMemo(() => {
    return breadcrumbsForPath(pathname);
  }, [pathname]);
  const commandSurfaceReady = PRIMARY_NAV.length > 0 && PRAXIS_CANONICAL_TOOLS.length > 0;

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
    <header className="praxis-app-header flex h-14 items-center gap-3 px-4 md:px-6">
        {/* Mobile hamburger + Breadcrumbs */}
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="mr-2 rounded-[var(--radius-md)] p-1.5 text-navy-500 hover:bg-navy-50 hover:text-navy-700"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {/* On mobile, render only the current page label (last
              breadcrumb) so the header never overflows when nav titles
              are long. Full breadcrumb chain appears at md+. */}
          {isMobile ? (
            breadcrumbs.length > 0 && (
              <span className="truncate font-medium text-navy-900">
                {breadcrumbs[breadcrumbs.length - 1].label}
              </span>
            )
          ) : (
            breadcrumbs.map((crumb, index) => (
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
            ))
          )}
        </nav>

        <form
          className="hidden min-w-0 flex-[1.2] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-card)] transition-colors focus-within:border-diplomatic-blue md:flex"
          onSubmit={(event) => {
            event.preventDefault();
            runCommand();
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-navy-400" />
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder={commandSurfaceReady ? 'Command or ask PRAXIS from the active ContextCapsule...' : 'Command or ask PRAXIS...'}
            className="min-w-0 flex-1 bg-transparent text-sm text-navy-950 placeholder:text-navy-600 focus:outline-none"
            aria-label="Ask PRAXIS or search"
          />
          <kbd className="rounded-[var(--radius-sm)] bg-[var(--color-app-surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-navy-400">
            Ctrl+K
          </kbd>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => onOpenSearch?.()}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-sm text-navy-500 transition-colors hover:border-navy-300 hover:text-navy-700 md:hidden"
            aria-label="Ask PRAXIS or search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Capsule strip + trust posture + notifications */}
          <CapsuleStripHeader />
          <TrustPostureChip />
          <NotificationBell />
          <AccountProfileButton compact={isMobile} />
        </div>
      </header>
  );
}
