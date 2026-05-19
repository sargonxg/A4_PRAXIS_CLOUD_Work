'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cog,
  FileText,
  FolderKanban,
  Home,
  LibraryBig,
  LogOut,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { NAV_GROUPS, type PrimaryNavGroup, type PrimaryNavIcon } from '@/lib/navigation/primary-nav';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/stores/app-store';

const ICONS: Record<PrimaryNavIcon, typeof Home> = {
  Home,
  Sparkles,
  FolderKanban,
  LibraryBig,
  FileText,
  Network,
  Wrench,
  Settings,
  Boxes,
  ShieldCheck,
  Cog,
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const isAdmin = user?.role === 'admin';

  const visibleGroups = useMemo(
    () => NAV_GROUPS.filter((g) => (g.adminOnly ? isAdmin : true)),
    [isAdmin],
  );

  // Persist collapse state per group locally so it survives navigation.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of visibleGroups) initial[g.id] = g.defaultOpen;
    return initial;
  });

  // Auto-expand a group when the active route lives inside it.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const g of visibleGroups) {
        if (g.items.some((it) => pathname === it.href || pathname.startsWith(`${it.href}/`))) {
          next[g.id] = true;
        }
      }
      return next;
    });
  }, [pathname, visibleGroups]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col border-r border-[var(--color-app-border)] bg-[var(--color-app-sidebar)] transition-[width] duration-200',
        sidebarOpen ? 'w-72' : 'w-16',
      )}
      aria-label="PRAXIS navigation"
    >
      <div className="flex h-16 items-center gap-3 border-b border-[var(--color-app-border)] px-3">
        <PraxisLink href="/app" className="flex min-w-0 flex-1 items-center gap-3">
          <PraxisBrandChip compact className={sidebarOpen ? '' : '[&>span:last-child]:hidden'} />
        </PraxisLink>
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-navy-400 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </button>
      </div>

      {sidebarOpen ? <ContextCapsulePanel /> : null}

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-4">
        {visibleGroups.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            pathname={pathname}
            sidebarOpen={sidebarOpen}
            open={openGroups[group.id] ?? group.defaultOpen}
            onToggle={() => toggleGroup(group.id)}
          />
        ))}
      </nav>

      <div className="border-t border-[var(--color-app-border)] p-2">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2 text-sm text-navy-500 transition hover:bg-crimson/5 hover:text-crimson',
            sidebarOpen ? 'gap-3 justify-start' : 'justify-center',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {sidebarOpen ? <span>Sign out</span> : null}
        </button>
      </div>
    </aside>
  );
}

function ContextCapsulePanel() {
  const anatomy = [
    ['User', 'who is working'],
    ['Situation', 'what is happening'],
    ['Sources', 'what supports it'],
    ['Time', 'what changed'],
    ['Power', 'who matters'],
    ['Tools', 'what to run'],
    ['Output', 'what to produce'],
    ['Handover', 'who inherits'],
  ] as const;

  return (
    <div className="border-b border-[var(--color-app-border)] px-3 py-3">
      <PraxisLink
        href="/app"
        className="block rounded-lg border border-gold-200 bg-gold-50/70 p-3 text-navy-900 transition hover:border-gold-300 hover:bg-gold-50"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-950 text-white">
            <Target className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-gold-800">
              Active ContextCapsule
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-navy-950">
              Manage context cores
            </span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {anatomy.map(([label, detail]) => (
            <span key={label} className="rounded-md border border-white/80 bg-white/75 px-2 py-1">
              <span className="block text-[11px] font-semibold text-navy-900">{label}</span>
              <span className="block truncate text-[10px] text-navy-500">{detail}</span>
            </span>
          ))}
        </div>
      </PraxisLink>
    </div>
  );
}

function NavGroup({
  group,
  pathname,
  sidebarOpen,
  open,
  onToggle,
}: {
  group: PrimaryNavGroup;
  pathname: string;
  sidebarOpen: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  // When the sidebar is collapsed to icons we ignore the group accordion
  // and just stack every link. The header label is hidden because there's
  // no horizontal room for it.
  if (!sidebarOpen) {
    return (
      <div className="space-y-1">
        {group.items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <PraxisLink
              key={item.id}
              href={item.href}
              title={item.label}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition',
                active
                  ? 'bg-diplomatic-blue/10 text-diplomatic-blue ring-1 ring-diplomatic-blue/30'
                  : 'text-navy-700 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-950',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
            </PraxisLink>
          );
        })}
      </div>
    );
  }

  const isWorkspace = group.id === 'workspace';
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition',
          isWorkspace
            ? 'text-navy-500'
            : 'text-navy-400 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700',
        )}
        aria-expanded={open}
      >
        <span>{group.label}</span>
        {!isWorkspace ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
      {open ? (
        <div className="mt-1 space-y-0.5">
          {group.items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <PraxisLink
                key={item.id}
                href={item.href}
                className={cn(
                  'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-diplomatic-blue/10 text-diplomatic-blue ring-1 ring-diplomatic-blue/30'
                    : 'text-navy-700 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-950',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{item.label}</span>
                    {item.id === 'capsules' ? (
                      <span className="rounded bg-[#fff0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#9f341c]">
                        Factory
                      </span>
                    ) : null}
                  </span>
                  {item.hint ? <span className="mt-0.5 block truncate text-[11px] font-normal text-navy-400">{item.hint}</span> : null}
                </span>
                {item.shortcut ? (
                  <span className="font-mono text-[10px] text-navy-400">{item.shortcut}</span>
                ) : null}
              </PraxisLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
