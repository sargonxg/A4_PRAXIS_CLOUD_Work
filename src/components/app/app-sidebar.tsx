'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Compass,
  GitBranch,
  Building2,
  FolderOpen,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  Users,
  Calendar,
  Shield,
  AlertTriangle,
  Sparkles,
  GitCompare,
  BookOpen,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppStore } from '@/stores/app-store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavSection {
  label: string;
  items: { label: string; icon: React.ComponentType<{ className?: string }>; href: string; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    label: 'Situation Room',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Early Warning', icon: AlertTriangle, href: '/early-warning', badge: '3' },
      { label: 'Conflict Graph', icon: GitBranch, href: '/conflict-graph' },
      { label: 'Stakeholder Map', icon: Users, href: '/stakeholder-map' },
    ],
  },
  {
    label: 'Analysis & Drafting',
    items: [
      { label: 'PRAXIS Assistant', icon: MessageSquare, href: '/assistant' },
      { label: 'Report Studio', icon: FileText, href: '/reports' },
      { label: 'Talking Points', icon: MessageCircle, href: '/talking-points' },
      { label: 'Scenario Planner', icon: GitCompare, href: '/scenarios', badge: 'NEW' },
      { label: 'Negotiation Prep', icon: Scale, href: '/negotiation-prep', badge: 'NEW' },
    ],
  },
  {
    label: 'Intelligence Tools',
    items: [
      { label: 'Media Compass', icon: Compass, href: '/media-compass' },
      { label: 'Sanctions Tracker', icon: Shield, href: '/sanctions' },
      { label: 'Calendar Monitor', icon: Calendar, href: '/calendar' },
      { label: 'UN Toolkit', icon: Building2, href: '/un-toolkit' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Documents', icon: FolderOpen, href: '/documents' },
      { label: 'Case Library', icon: BookOpen, href: '/cases', badge: 'NEW' },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();

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
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-full flex-col border-r border-[var(--color-app-border)] bg-white"
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-[var(--color-app-border)]">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-diplomatic-blue">
            <span className="font-serif text-sm font-bold text-white">P</span>
          </div>
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <span className="font-serif text-lg text-diplomatic-blue tracking-wider whitespace-nowrap" style={{ fontVariant: 'small-caps' }}>
                  praxis
                </span>
                <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-widest text-navy-400">by tacitus</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            {/* Section label */}
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-diplomatic-blue/8 text-diplomatic-blue'
                      : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-diplomatic-blue"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive ? 'text-diplomatic-blue' : 'text-navy-400 group-hover:text-navy-600'
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 truncate whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Badge */}
                  {item.badge && sidebarOpen && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson/10 px-1.5 text-[10px] font-bold text-crimson">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 rounded-full bg-crimson/10 px-1.5 py-0.5 text-[10px] text-crimson">
                          {item.badge}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{linkContent}</div>;
            })}
          </div>
        ))}

        {/* Advisory Council - special item */}
        <div className="mt-2 border-t border-[var(--color-app-border)] pt-3">
          {(() => {
            const isActive = pathname.startsWith('/advisory');
            const linkContent = (
              <Link
                href="/advisory"
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gold-500/8 text-gold-700'
                    : 'text-gold-600/70 hover:bg-gold-500/5 hover:text-gold-700'
                )}
              >
                <Sparkles
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    isActive ? 'text-gold-600' : 'text-gold-500/70'
                  )}
                />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate whitespace-nowrap"
                    >
                      Advisory Council
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Advisory Council
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })()}
        </div>

        {/* Settings */}
        <div className="mt-1">
          {(() => {
            const isActive = pathname === '/settings';
            const linkContent = (
              <Link
                href="/settings"
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[var(--color-app-surface-alt)] text-navy-900'
                    : 'text-navy-400 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-600'
                )}
              >
                <Settings className="h-[18px] w-[18px] shrink-0 text-navy-400 group-hover:text-navy-500" />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate whitespace-nowrap"
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Settings
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })()}
        </div>
      </nav>

      {/* Keyboard shortcut hint */}
      {sidebarOpen && (
        <div className="px-4 py-2">
          <p className="text-[10px] text-navy-400 text-center tracking-wide">
            <kbd className="rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-navy-400">&#8984;K</kbd>
            <span className="ml-1.5">to search</span>
          </p>
        </div>
      )}

      {/* Bottom section */}
      <div className="border-t border-[var(--color-app-border)] p-2">
        {/* User info */}
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue text-xs font-bold text-white">
            {initials}
          </div>
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-navy-900">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-navy-500">
                  {user?.orgName}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        {sidebarOpen ? (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-400 transition-colors hover:bg-crimson/5 hover:text-crimson"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-navy-400 transition-colors hover:bg-crimson/5 hover:text-crimson"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        )}

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="mt-1 flex w-full items-center justify-center rounded-lg py-2 text-navy-400 transition-colors hover:bg-[var(--color-app-surface-alt)] hover:text-navy-600"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronsLeft className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
