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
    label: 'Intelligence',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Report Studio', icon: FileText, href: '/reports' },
      { label: 'PRAXIS Assistant', icon: MessageSquare, href: '/assistant' },
      { label: 'Conflict Graph', icon: GitBranch, href: '/conflict-graph' },
      { label: 'Early Warning', icon: AlertTriangle, href: '/early-warning', badge: '3' },
      { label: 'Sanctions Tracker', icon: Shield, href: '/sanctions' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { label: 'Media Compass', icon: Compass, href: '/media-compass' },
      { label: 'Talking Points', icon: MessageCircle, href: '/talking-points' },
      { label: 'Calendar Monitor', icon: Calendar, href: '/calendar' },
      { label: 'Stakeholder Map', icon: Users, href: '/stakeholder-map' },
      { label: 'Documents', icon: FolderOpen, href: '/documents' },
      { label: 'UN Toolkit', icon: Building2, href: '/un-toolkit' },
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
      className="relative flex h-full flex-col border-r border-navy-700/50 bg-navy-900"
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <motion.span
            initial={false}
            animate={{ width: sidebarOpen ? 'auto' : 'auto' }}
            className="font-serif text-xl text-gold-500 tracking-widest"
            style={{ fontVariant: 'small-caps' }}
          >
            {sidebarOpen ? 'TACITUS' : 'T'}
          </motion.span>
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto">
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
                  className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-500"
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
                    'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-navy-700/60 text-white'
                      : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-gold-500"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 shrink-0',
                      isActive ? 'text-gold-500' : 'text-navy-400 group-hover:text-navy-300'
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
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-crimson/20 text-[10px] font-bold text-crimson">
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
                        <span className="ml-2 rounded-full bg-crimson/20 px-1.5 py-0.5 text-[10px] text-crimson">
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
        <div className="mt-2 border-t border-navy-700/50 pt-3">
          {(() => {
            const isActive = pathname.startsWith('/advisory');
            const linkContent = (
              <Link
                href="/advisory"
                className={cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gold-500/10 text-gold-400'
                    : 'text-gold-500/70 hover:bg-gold-500/5 hover:text-gold-400'
                )}
              >
                <Sparkles
                  className={cn(
                    'h-4.5 w-4.5 shrink-0',
                    isActive ? 'text-gold-400' : 'text-gold-500/70'
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
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-navy-700/60 text-white'
                    : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
                )}
              >
                <Settings className="h-4.5 w-4.5 shrink-0 text-navy-400 group-hover:text-navy-300" />
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

      {/* Bottom section */}
      <div className="border-t border-navy-700/50 p-2">
        {/* User info */}
        <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-bold text-gold-400">
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
                <p className="truncate text-sm font-medium text-navy-100">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-navy-400">
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
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-navy-400 transition-colors hover:bg-navy-800 hover:text-crimson"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-md px-3 py-2 text-navy-400 transition-colors hover:bg-navy-800 hover:text-crimson"
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
          className="mt-1 flex w-full items-center justify-center rounded-md py-2 text-navy-500 transition-colors hover:bg-navy-800 hover:text-navy-300"
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
