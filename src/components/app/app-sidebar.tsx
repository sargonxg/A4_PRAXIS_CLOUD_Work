'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PraxisLink } from '@/components/shared/praxis-link';
import { usePraxisRoute } from '@/lib/utils/routes';
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
  Network,
  BookMarked,
  FileCheck,
  BarChart3,
  UserCircle,
  UsersRound,
  Presentation,
  Newspaper,
  Bell,
  Radio,
  Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { SituationSelector } from '@/components/app/situation-selector';
import { useAppStore } from '@/stores/app-store';
import { useSituationStore } from '@/stores/situation-store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Coins, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const CHANGELOG = [
  {
    version: 'v3.4',
    date: '2026.03.25',
    notes: [
      'Full situation creation → tool population pipeline: user context (URLs, docs, notes) flows to all 27 tools',
      'Situation Initializer: auto-seeds actor profiles, risk monitor, early warning, conflict graph, stakeholder map',
      'Media Compass: situation-specific AI-researched sources plotted alongside global outlets',
      'PRAXIS AI assistant: enhanced guardrails, TACITUS product awareness, full data interaction',
      'All 27 AI routes secured with withAuth, live GDELT/ReliefWeb intel feeds wired to 4 tools',
      'Vitest smoke tests (35 tests), end-to-end TOOL_AUDIT.md — 27/27 Working',
    ],
  },
  {
    version: 'v3.3',
    date: '2026.03.24',
    notes: [
      'Onboarding research now saved to situation context (all tools benefit immediately)',
      'ARGUS: Live Web Research tab with Firecrawl-powered deep research',
      'Media Compass: Live News Search powered by grounded web search',
      'Situation-driven context propagated to all 35+ tool pages',
    ],
  },
  {
    version: 'v3.2',
    date: '2024.03.24',
    notes: [
      'AiPopulate pattern — auto-generates structured data on first tool visit',
      'Pro model pipeline (gemini-2.5-pro) for all analytical tools',
      'Daily Intelligence Brief with cron-based auto-generation',
      'Floating Ask PRAXIS chat (all pages, / shortcut)',
    ],
  },
  {
    version: 'v3.1',
    date: '2024.02.01',
    notes: [
      'Mobile-responsive sidebar with drawer overlay',
      'CONCORDIA Mediation Designer and Mediation process flow',
      'Actor Profiles with AI-generated profiles per situation',
    ],
  },
];

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
      { label: 'Risk Monitor', icon: BarChart3, href: '/risk-monitor', badge: '8' },
      { label: 'Conflict Graph', icon: GitBranch, href: '/conflict-graph' },
      { label: 'Stakeholder Map', icon: Users, href: '/stakeholder-map' },
      { label: 'Actor Profiles', icon: UserCircle, href: '/actors' },
    ],
  },
  {
    label: 'Analysis & Drafting',
    items: [
      { label: 'PRAXIS Assistant', icon: MessageSquare, href: '/assistant' },
      { label: 'Report Studio', icon: FileText, href: '/reports' },
      { label: 'Dossier Generator', icon: BookMarked, href: '/dossier', badge: 'NEW' },
      { label: 'Talking Points', icon: MessageCircle, href: '/talking-points' },
      { label: 'Scenario Planner', icon: GitCompare, href: '/scenarios', badge: 'NEW' },
      { label: 'Negotiation Prep', icon: Scale, href: '/negotiation-prep', badge: 'NEW' },
      { label: 'CONCORDIA Mediation', icon: Scale, href: '/concordia', badge: 'TACITUS' },
      { label: 'Mediation Designer', icon: Handshake, href: '/mediation-design', badge: 'NEW' },
      { label: 'Briefing Room', icon: Presentation, href: '/briefing', badge: 'NEW' },
      { label: 'Daily Brief', icon: Newspaper, href: '/auto-briefings', badge: 'NEW' },
    ],
  },
  {
    label: 'Intelligence Tools',
    items: [
      { label: 'ARGUS Intelligence', icon: Network, href: '/argus', badge: 'TACITUS' },
      { label: 'Media Compass', icon: Compass, href: '/media-compass' },
      { label: 'Media Roundup', icon: Newspaper, href: '/media-roundup', badge: 'NEW' },
      { label: 'Info Environment', icon: Radio, href: '/info-environment', badge: 'NEW' },
      { label: 'Commitment Tracker', icon: FileCheck, href: '/commitments', badge: 'NEW' },
      { label: 'Treaty Analyzer', icon: BookMarked, href: '/treaty-analyzer', badge: 'NEW' },
      { label: 'Sanctions Tracker', icon: Shield, href: '/sanctions' },
      { label: 'Calendar Monitor', icon: Calendar, href: '/calendar' },
      { label: 'Alert Center', icon: Bell, href: '/alerts' },
      { label: 'UN Toolkit', icon: Building2, href: '/un-toolkit' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Documents', icon: FolderOpen, href: '/documents' },
      { label: 'Case Library', icon: BookOpen, href: '/cases', badge: 'NEW' },
      { label: 'Team Hub', icon: UsersRound, href: '/team' },
    ],
  },
];

function ChangelogButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 w-full text-center text-[9px] text-navy-300 hover:text-navy-500 transition-colors"
      >
        PRAXIS v3.4 · Build 2026.03.25
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-navy-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">PRAXIS Changelog</h3>
                <p className="text-[11px] text-navy-500">Release history</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-5 space-y-5">
              {CHANGELOG.map((release) => (
                <div key={release.version}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[11px] font-semibold text-gold-700">{release.version}</span>
                    <span className="text-[11px] text-navy-400">{release.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {release.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[12px] text-navy-700">
                        <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-navy-400" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const route = usePraxisRoute();
  const { user, credits, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { activeSituationId, setActiveSituation } = useSituationStore();

  // Strip /app or /demo prefix for active matching against nav hrefs
  const barePath = pathname.replace(/^\/(app|demo)/, '') || '/';

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
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-full flex-col border-r border-[var(--color-app-border)] bg-white"
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-[var(--color-app-border)]">
        <PraxisLink href="/dashboard" className="flex items-center gap-2 overflow-hidden">
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
        </PraxisLink>
      </div>

      {/* Situation selector for production users */}
      <SituationSelector
        collapsed={!sidebarOpen}
        activeSituationId={activeSituationId}
        onSelect={setActiveSituation}
      />

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
                barePath === item.href || barePath.startsWith(item.href + '/');
              const Icon = item.icon;

              const linkContent = (
                <PraxisLink
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
                    <span className={cn(
                      'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      item.badge === 'TACITUS'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-crimson/10 text-crimson'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </PraxisLink>
              );

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                      {item.badge && (
                        <span className={cn(
                          'ml-2 rounded-full px-1.5 py-0.5 text-[10px]',
                          item.badge === 'TACITUS'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-crimson/10 text-crimson'
                        )}>
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
            const isActive = barePath.startsWith('/advisory');
            const linkContent = (
              <PraxisLink
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
              </PraxisLink>
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
            const isActive = barePath === '/settings';
            const linkContent = (
              <PraxisLink
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
              </PraxisLink>
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
        {/* Credits display */}
        {sidebarOpen ? (
          <div className="mb-2 mx-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">TACITUS Credits</span>
              </div>
              <span className="text-sm font-bold text-emerald-700">{user?.isDemo ? '∞' : credits}</span>
            </div>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-2 flex items-center justify-center rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-2 py-2">
                <span className="text-xs font-bold text-emerald-700">{user?.isDemo ? '∞' : credits}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              TACITUS Credits: {user?.isDemo ? 'Unlimited (Demo)' : credits}
            </TooltipContent>
          </Tooltip>
        )}

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

        {/* Build version + changelog */}
        {sidebarOpen && <ChangelogButton />}

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
