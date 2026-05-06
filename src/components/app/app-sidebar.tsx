'use client';

import type { ReactNode, ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Boxes,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderKanban,
  GitBranch,
  Library,
  LogOut,
  Plus,
  Search,
  Settings,
  Store,
  UserCircle,
  Users,
  Wrench,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import { useSituationStore } from '@/stores/situation-store';
import { WORKBENCH_TABS } from '@/lib/workbench/tabs';

const TAB_ICONS = {
  chapters: BookOpen,
  desk: Briefcase,
  context: FileText,
  library: Library,
  research: Search,
  ontology: Boxes,
  graph: GitBranch,
  tools: Store,
  boardroom: Users,
  draft: FileText,
} as const;

const ARCHIVE_LINKS = [
  { label: 'Source Scout', href: '/source-scout' },
  { label: 'GraphOps', href: '/graphops' },
  { label: 'Briefing Studio', href: '/briefing' },
  { label: 'Advisor Table', href: '/brainstorming-table' },
  { label: 'Documents', href: '/documents' },
  { label: 'Sanctions', href: '/sanctions' },
  { label: 'Media Compass', href: '/media-compass' },
  { label: 'Methodology', href: '/methodology' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const showArchive = searchParams.get('show_archive') === '1';
  const activeCaseId = activeSituation?.id ?? situations[0]?.id ?? 'syria-2026';
  const initials = (user?.name || user?.email || 'DA')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DA';

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
        <PraxisLink href="/workbench" className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-diplomatic-blue text-sm font-bold text-white">
            P
          </span>
          {sidebarOpen ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-navy-950">PRAXIS</span>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">by TACITUS</span>
            </span>
          ) : null}
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

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <SectionLabel open={sidebarOpen}>Workbench</SectionLabel>
        <NavItem open={sidebarOpen} href="/workbench" label="Workbench" icon={FolderKanban} active={pathname === '/app/workbench'} />
        <div className="space-y-1">
          {WORKBENCH_TABS.map((tab, index) => {
            const Icon = TAB_ICONS[tab.id] ?? BookOpen;
            const href = `/workbench/${activeCaseId}?tab=${tab.id}`;
            const active = pathname.includes('/app/workbench') && searchParams.get('tab') === tab.id;
            return (
              <NavItem
                key={tab.id}
                open={sidebarOpen}
                href={href}
                label={tab.label}
                icon={Icon}
                active={active}
                suffix={String(index + 1)}
                inset
              />
            );
          })}
        </div>

        <SectionLabel open={sidebarOpen}>Cases</SectionLabel>
        <NavItem open={sidebarOpen} href="/workbench" label={`My Cases${situations.length ? ` (${situations.length})` : ''}`} icon={FolderKanban} />
        <NavItem open={sidebarOpen} href="/situations/new" label="New Case" icon={Plus} />

        <SectionLabel open={sidebarOpen}>Account</SectionLabel>
        <NavItem open={sidebarOpen} href="/settings" label="Settings" icon={Settings} active={pathname.startsWith('/app/settings')} />
        <NavItem open={sidebarOpen} href="/profile" label="Profile" icon={UserCircle} active={pathname === '/app/profile'} />

        {showArchive ? (
          <>
            <SectionLabel open={sidebarOpen}>Archive</SectionLabel>
            <NavItem open={sidebarOpen} href="/tools?show_archive=1" label="All legacy tools" icon={Wrench} />
            {ARCHIVE_LINKS.map((item) => (
              <NavItem key={item.href} open={sidebarOpen} href={item.href} label={item.label} icon={Wrench} inset />
            ))}
          </>
        ) : null}
      </nav>

      <div className="border-t border-[var(--color-app-border)] p-2">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue text-xs font-bold text-white">
            {initials}
          </span>
          {sidebarOpen ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-navy-900">{user?.name ?? 'Analyst'}</span>
              <span className="block truncate text-xs text-navy-400">{user?.isDemo ? 'Example session' : user?.email}</span>
            </span>
          ) : null}
        </div>
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

function SectionLabel({ children, open }: { children: ReactNode; open: boolean }) {
  if (!open) return <div className="mx-auto h-px w-8 bg-[var(--color-app-border)]" aria-hidden="true" />;
  return <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">{children}</p>;
}

function NavItem({
  href,
  label,
  icon: Icon,
  active = false,
  open,
  suffix,
  inset = false,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  open: boolean;
  suffix?: string;
  inset?: boolean;
}) {
  return (
    <PraxisLink
      href={href}
      title={!open ? label : undefined}
      className={cn(
        'flex items-center rounded-lg py-2 text-sm font-medium transition',
        open ? 'gap-3 px-3' : 'justify-center px-2',
        inset && open && 'ml-3',
        active ? 'bg-[var(--color-app-surface-alt)] text-navy-950' : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-800',
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {open ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
      {open && suffix ? <span className="font-mono text-[10px] text-navy-400">{suffix}</span> : null}
    </PraxisLink>
  );
}
