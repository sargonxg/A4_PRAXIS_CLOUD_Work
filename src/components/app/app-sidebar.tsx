'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PraxisLink } from '@/components/shared/praxis-link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  BookOpen,
  MessagesSquare,
  Telescope,
  Target,
  Wrench,
  X,
  ChevronRight,
  ChevronDown,
  Loader2,
  Crown,
  HeartHandshake,
  Users,
  Clock,
  Library,
  PanelsTopLeft,
  PenSquare,
  GraduationCap,
  Shield,
  Compass,
  Newspaper,
  Network,
  Search,
  Layers,
  Gavel,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { SituationSelector } from '@/components/app/situation-selector';
import { useAppStore } from '@/stores/app-store';
import { useSituationStore } from '@/stores/situation-store';
import { roleLabel } from '@/lib/dashboard/role-recommendations';
import { isToolHiddenByPreference, orderedToolIds } from '@/lib/navigation/tool-preferences';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { APP_BUILD_LABEL } from '@/lib/constants/app-version';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { useAllToolStatuses, type ToolHealth } from '@/hooks/use-tool-status';

const CHANGELOG = [
  {
    version: 'v5.3',
    date: '2026.04.05',
    notes: [
      'Security hardening: timing-safe admin auth, CSP tightened, demo rate-limiting, daily credit top-up caps',
      'SEO: sitemap.xml, robots.txt, JSON-LD structured data, OG image metadata, waitlist form on landing page',
      'Login: password strength meter, social proof line, improved signup UX',
      'Onboarding: redesigned no-situation state with value proposition cards',
      '3-state tool health semaphore (green/yellow/red) on 30+ sidebar tools with freshness tracking',
    ],
  },
  {
    version: 'v5.1',
    date: '2026.04.01',
    notes: [
      'ToolInfoPanel on 10 tool pages: framework name, academic citation, methodology, data sources',
      'Auth hardening: syncTokenCookie retry logic (3 attempts, exponential backoff), removed double-render on token refresh',
      'Landing: updated headline, use-case personas (UN PAO, Think Tank, NGO, Academic, Diplomat), social links',
      'Pricing tiers corrected: Analyst $49/5,000 credits/5 situations, Team $199/25,000 credits/25 situations',
      'Login page: credits copy corrected to 5,000 TACITUS Credits',
    ],
  },
  {
    version: 'v5.0',
    date: '2026.03.31',
    notes: [
      '6 new AI tools (22-27): Stakeholder Influence Map, Ceasefire Monitor, Peace Agreement Analyzer, Early Warning Brief, Game Theory Analysis, Protection of Civilians Assessment',
      'System Prompt v5.0: Chain of Analysis, 5-tier Source Hierarchy, Output Quality Checklist',
      'Advisory Panel Discussion mode: parallel multi-advisor synthesis',
      'Context-aware floating PRAXIS with per-page greetings and quick actions',
      'Chat Interface: Standard/Deep Analysis mode selector, Export Chat button',
    ],
  },
  {
    version: 'v4.3',
    date: '2026.03.31',
    notes: [
      '10 reusable visualization components: RiskGauge, RadarChart, EscalationLadder, ForceGraph, TimeSeriesChart, HeatmapGrid, TornadoChart, SankeyFlow, ProbabilityTree, ComplianceTracker',
      'Geospatial Monitor: map-based event visualization with hotspot clustering',
      'Dashboard redesigned as command center with KPI cards, risk radar, live AI insights',
      'Interactive ForceGraph on Stakeholder Map and Conflict Graph pages',
      'D3 v7 force-directed network with type-colored nodes, zoom, drag, click-to-detail',
    ],
  },
  {
    version: 'v4.2',
    date: '2026.03.31',
    notes: [
      'Game Theory tool: payoff matrices, Nash equilibria, Prisoner\'s Dilemma / Stag Hunt / Chicken archetypes',
      'Scenario Planner: 8 sliders, 10 presets, 3 methodology modes (Narrative/Probability Tree/Monte Carlo)',
      'Negotiation Prep: interactive ZOPA visualizer, BATNA matrix, historical precedents',
      'Mediation Design: process architecture timeline, CBMs designer, Stedman spoiler analysis',
    ],
  },
  {
    version: 'v4.0',
    date: '2026.03.31',
    notes: [
      'Full data layer: GDELT, ReliefWeb, HDX, World Bank, UNHCR, UCDP, UN News, grounded Google Search, and private corpus sources',
      'INFORM Risk Index: geometric mean (H×V×C)^(1/3) — rigorous multi-dimensional risk scoring',
      'DBSCAN geospatial clustering, movement detection, geographic spread index',
      'Tool Registry: single source of truth for the 12-tool workspace plus specialist archive',
      '15 fully documented analytical frameworks with academic citations',
    ],
  },
  {
    version: 'v3.10',
    date: '2026.03.30',
    notes: [
      'Deep Research Agent — Vertex AI ADK multi-agent system: Planning → Web Research → Synthesis pipeline',
      'Live agent activity feed showing each sub-agent\'s work in real-time',
      'Session persistence for multi-turn research conversations',
      'New users now start with 5,000 credits (was 100)',
      'Admin bulk credit reset: POST /api/admin/set-all-credits',
      'Debug Panel top-up increased to +1,000 credits',
    ],
  },
  {
    version: 'v3.9',
    date: '2026.03.30',
    notes: [
      'Debug Panel (Ctrl+Shift+D): live API call log, service health, credit counter, self-service top-up',
      'AiPopulate: 90s timeout, elapsed counter, cancel button — no more infinite hangs',
      'buildToolContext() expanded to 25 lines with ACO grammar, Glasl stage, risk labels',
      'All 34 AI routes now receive rich situation context',
      'Timeline and Humanitarian dashboard pages added',
      'New users: 5000 credits, all 34 AI routes secured, 68 total API endpoints',
    ],
  },
  {
    version: 'v3.5',
    date: '2026.03.26',
    notes: [
      'Sources Library: AI-managed trusted source database with nomenclature tracking, reliability scoring, and priority management',
      'Unified Web Crawlers: Google Grounding + Google Search grounding as optional research boosters for all intelligence tools',
      'Compare tool: real situation comparison with Glasl stage, escalation trend, AI-generated analysis',
      'Team Hub: Situation Activity Log showing tool population status, expanded Quick Analysis cards',
      'Alerts: severity-based styling, manual "Check for Updates" with streaming AI response',
      'AI model upgrades: talking-points and media-roundup upgraded to Gemini 2.5 Pro',
      'PRAXIS Documentation page: full 28-tool reference with frameworks, credits, and audit status',
    ],
  },
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
      'ARGUS: Live Web Research tab with Google-grounded deep research',
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
    label: 'Desk',
    items: [
      { label: 'Cockpit', icon: Compass, href: '/cockpit' },
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    label: 'Context',
    items: [
      { label: 'Context Builder', icon: Target, href: '/context-builder' },
      { label: 'Documents', icon: BookOpen, href: '/documents' },
      { label: 'Timeline', icon: Clock, href: '/timeline' },
    ],
  },
  {
    label: 'Library',
    items: [
      { label: 'Document Library', icon: Library, href: '/library' },
      { label: 'Sources Library', icon: Layers, href: '/sources' },
      { label: 'Methodology', icon: GraduationCap, href: '/methodology' },
    ],
  },
  {
    label: 'Research',
    items: [
      { label: 'Source Scout', icon: Telescope, href: '/source-scout' },
      { label: 'Deep Research', icon: Search, href: '/deep-search-agent' },
      { label: 'Media Compass', icon: Newspaper, href: '/media-compass' },
    ],
  },
  {
    label: 'Graph',
    items: [
      { label: 'Conflict Graph', icon: GitBranch, href: '/conflict-graph' },
      { label: 'GraphOps', icon: Wrench, href: '/graphops' },
      { label: 'Stakeholder Map', icon: Users, href: '/stakeholder-map' },
      { label: 'Power Map', icon: Network, href: '/power-map' },
    ],
  },
  {
    label: 'Boardroom',
    items: [
      { label: 'Advisory Council', icon: MessagesSquare, href: '/advisory' },
      { label: 'Brainstorming Table', icon: Sparkles, href: '/brainstorming-table' },
      { label: 'Ask PRAXIS', icon: Sparkles, href: '/assistant' },
    ],
  },
  {
    label: 'Draft',
    items: [
      { label: 'Editor', icon: PenSquare, href: '/editor' },
      { label: 'Briefing Studio', icon: FileText, href: '/briefing' },
      { label: 'Policy Memo', icon: FileText, href: '/policy-memo' },
      { label: 'Talking Points', icon: FileText, href: '/talking-points' },
    ],
  },
  {
    label: 'Specialist Tools',
    items: [
      { label: 'Humanitarian', icon: HeartHandshake, href: '/humanitarian' },
      { label: 'Sanctions Monitor', icon: Shield, href: '/sanctions-explorer' },
      { label: 'Policy Desks', icon: Briefcase, href: '/desks/political-risk' },
      { label: 'All tools', icon: PanelsTopLeft, href: '/tools' },
    ],
  },
];

const RECORDING_NAV_HREFS = new Set([
  '/cockpit',
  '/demo-guide',
  '/dashboard',
  '/context-builder',
  '/documents',
  '/timeline',
  '/library',
  '/sources',
  '/methodology',
  '/source-scout',
  '/deep-search-agent',
  '/media-compass',
  '/conflict-graph',
  '/graphops',
  '/stakeholder-map',
  '/power-map',
  '/advisory',
  '/brainstorming-table',
  '/assistant',
  '/editor',
  '/briefing',
  '/policy-memo',
  '/talking-points',
  '/humanitarian',
  '/sanctions-explorer',
  '/desks/political-risk',
  '/desks/us-housing',
  '/tools',
]);

function ChangelogButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 w-full text-center text-[9px] text-navy-300 hover:text-navy-500 transition-colors"
      >
        {APP_BUILD_LABEL}
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

// Map sidebar hrefs to tool-data IDs for status indicators
const HREF_TO_TOOL_ID: Record<string, string> = {
  // Desk
  '/cockpit': 'cockpit',
  '/dashboard': 'dashboard',
  '/dashboard#executive-intelligence': 'situation-intelligence',
  // Context
  '/context-builder': 'context-builder',
  '/documents': 'documents',
  '/library': 'library',
  '/sources': 'sources-library',
  '/methodology': 'methodology',
  // Research
  '/source-scout': 'source-scout',
  '/deep-search-agent': 'deep-search-agent',
  '/media-compass': 'media-compass',
  // Other
  '/timeline': 'timeline',
  '/humanitarian': 'humanitarian',
  '/calendar': 'calendar',
  '/requirements': 'pir',
  '/assistant': 'assistant',
  '/advisory': 'brainstorming-table',
  '/reports': 'report-studio',
  '/cases': 'cases',
  '/team': 'team',
  '/tools': 'tools',
  // Analysis
  '/actors': 'actor-profiles',
  '/risk-monitor': 'risk-monitor',
  '/early-warning': 'early-warning',
  '/conflict-graph': 'conflict-graph',
  '/graphops': 'graphops',
  '/dialectica': 'conflict-graph',
  '/stakeholder-map': 'stakeholder-map',
  '/power-map': 'power-map',
  '/compare': 'compare',
  // Drafting
  '/dossier': 'dossier',
  '/talking-points': 'talking-points',
  '/briefing': 'briefing',
  '/auto-briefings': 'auto-briefing',
  '/policy-memo': 'policy-memo',
  '/un-toolkit': 'un-toolkit',
  // Simulation
  '/scenarios': 'scenarios',
  '/negotiation-prep': 'negotiation-prep',
  '/game-theory': 'game-theory',
  '/mediation-design': 'mediation-design',
  // Intelligence
  '/argus': 'argus',
  '/brainstorming-table': 'brainstorming-table',
  '/media-roundup': 'media-roundup',
  '/info-environment': 'info-environment',
  '/sanctions': 'sanctions',
  '/commitments': 'commitments',
  '/treaty-analyzer': 'treaty-analyzer',
  '/geospatial-monitor': 'geospatial-monitor',
  '/alerts': 'alert-center',
  '/source-monitor': 'source-monitor',
  '/export-center': 'export-center',
  // New tools (v5.0+)
  '/human-rights': 'human-rights',
  '/electoral-risk': 'electoral-risk',
  '/external-actors': 'external-actors',
  '/peacebuilding-index': 'peacebuilding-index',
  '/economic-impact': 'economic-impact',
  '/legal-tracker': 'legal-tracker',
};

// Unified tool status — uses the shared hook that combines dashboard-snapshot
// with research-status for consistent semaphores across sidebar and tool pages

const PLAN_LABELS: Record<string, string> = {
  free: 'Free Plan',
  analyst: 'Analyst',
  team: 'Team',
  enterprise: 'Enterprise',
};

function formatDomainLabel(domain: string): string {
  return domain
    .split('-')
    .map((word) => (word[0]?.toUpperCase() ?? '') + word.slice(1))
    .join(' ');
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, analystProfile } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { activeSituationId, setActiveSituation } = useSituationStore();
  const recordingMode = user?.isDemo === true && searchParams.get('recording') === '1';
  const recordingCase = searchParams.get('case');
  // Sticky case selection — when the user has chosen a demo template (case=...)
  // every sidebar link preserves it so navigation stays inside that template.
  const stickyCase = searchParams.get('case');
  const allToolStatuses = useAllToolStatuses(activeSituationId);
  const { preferences } = useUserPreferences({ enabled: Boolean(user && !user.isDemo) });
  const sidebarOrder = orderedToolIds(preferences);
  const orderIndex = new Map(sidebarOrder.map((toolId, index) => [toolId, index]));
  const isToolHidden = (toolId?: string) => Boolean(toolId && isToolHiddenByPreference(preferences, toolId));

  // Keep the default shell intentionally quiet. Role-specific tools still exist
  // in the specialist workspace and dashboard actions, but the sidebar should
  // read like one policy-document workflow.
  const forYou: Array<{ toolId: string; href: string }> = [];
  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: [...section.items]
        .filter((item) => !recordingMode || RECORDING_NAV_HREFS.has(item.href))
        .filter((item) => !isToolHidden(HREF_TO_TOOL_ID[item.href]))
        .sort((a, b) => {
          const aIndex = orderIndex.get(HREF_TO_TOOL_ID[a.href] ?? '') ?? Number.MAX_SAFE_INTEGER;
          const bIndex = orderIndex.get(HREF_TO_TOOL_ID[b.href] ?? '') ?? Number.MAX_SAFE_INTEGER;
          return aIndex - bIndex;
        }),
    }))
    .filter((section) => section.items.length > 0);
  // Extract simple health map for backward compat with semaphore rendering
  const toolHealthMap: Record<string, ToolHealth> = {};
  for (const [id, info] of Object.entries(allToolStatuses)) {
    toolHealthMap[id] = info.health;
  }

  // Collapsible sections — all open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(navSections.map((s) => [s.label, true]))
  );
  const toggleSection = (label: string) =>
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

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
  const analystType = roleLabel(analystProfile?.identity.role);
  const analystDomain = analystProfile?.perspective.primaryDomain
    ? formatDomainLabel(analystProfile.perspective.primaryDomain)
    : null;
  const orgLine = analystProfile?.identity.team
    || analystProfile?.identity.org
    || user?.orgName
    || 'PRAXIS workspace';

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
        <PraxisLink href="/cockpit" className="flex items-center gap-2 overflow-hidden">
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
        {/* "For you" anchor — surfaces top-3 role-tuned tools above the
            section list. Mirrors the dashboard's RecommendedToolsWidget so
            sidebar and dashboard agree on first-look priority. */}
        {forYou.length > 0 && (
          <div className="mb-3">
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="mb-1 flex items-center gap-1.5 px-3 py-0.5"
                >
                  <Sparkles className="h-3 w-3 text-gold-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700">
                    For you
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {forYou.map((rec) => {
              const isActive = barePath === rec.href;
              const inner = (
                <PraxisLink
                  href={rec.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gold-500/10 text-gold-700'
                      : 'text-navy-600 hover:bg-gold-500/5 hover:text-gold-700',
                  )}
                >
                  <Sparkles
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive ? 'text-gold-600' : 'text-gold-500/70 group-hover:text-gold-600',
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
                        {rec.toolId
                          .split('-')
                          .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
                          .join(' ')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </PraxisLink>
              );
              if (!sidebarOpen) {
                return (
                  <Tooltip key={rec.toolId}>
                    <TooltipTrigger asChild>{inner}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      <span className="font-semibold">For you:</span>{' '}
                      {rec.toolId
                        .split('-')
                        .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
                        .join(' ')}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={rec.toolId}>{inner}</div>;
            })}
            <div className="mx-3 mt-2 mb-1 h-px bg-[var(--color-app-border)]" />
          </div>
        )}

        {visibleNavSections.map((section) => {
          const isSectionOpen = openSections[section.label] ?? true;
          return (
          <div key={section.label} className="mb-3">
            {/* Section label — clickable to collapse when sidebar is open */}
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => toggleSection(section.label)}
                  className="mb-1 flex w-full items-center justify-between px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 hover:text-navy-600 transition-colors"
                >
                  {section.label}
                  <ChevronDown
                    className={cn('h-3 w-3 transition-transform duration-200', !isSectionOpen && '-rotate-90')}
                  />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {(isSectionOpen || !sidebarOpen) && (
                <motion.div
                  key="section-items"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
            {section.items.map((item) => {
              const itemKey = `${section.label}:${item.href}:${item.label}`;
              const itemPath = item.href.split('#')[0] || item.href;
              const isActive =
                barePath === itemPath || barePath.startsWith(itemPath + '/');
              const Icon = item.icon;
              const href = (() => {
                const [path, hash] = item.href.split('#');
                const params = new URLSearchParams();
                if (recordingMode) params.set('recording', '1');
                if (recordingCase) params.set('case', recordingCase);
                else if (stickyCase) params.set('case', stickyCase);
                const qs = params.toString();
                return `${path}${qs ? `?${qs}` : ''}${hash ? `#${hash}` : ''}`;
              })();

              const linkContent = (
                <PraxisLink
                  href={href}
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
                  {/* Tool health semaphore: green=ready, yellow=stale, red=not ready, pulsing=researching */}
                  {sidebarOpen && HREF_TO_TOOL_ID[item.href] && activeSituationId && (() => {
                    const tid = HREF_TO_TOOL_ID[item.href];
                    const info = allToolStatuses[tid];
                    const health = toolHealthMap[tid];
                    const isResearching = info?.isResearching;

                    if (isResearching) {
                      return (
                        <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center" title="Researching — gathering live intelligence...">
                          <Loader2 className="h-3 w-3 animate-spin text-gold-500" />
                        </span>
                      );
                    }

                    return (
                      <span
                        className={cn(
                          'ml-auto h-2 w-2 shrink-0 rounded-full',
                          {
                            'bg-emerald-500': health === 'green',
                            'bg-amber-400': health === 'yellow',
                            'bg-navy-300': health === 'red',
                          }
                        )}
                        title={
                          health === 'green' ? 'Ready — data is fresh' :
                          health === 'yellow' ? 'Stale — data may need updating' :
                          'Not ready — no data yet'
                        }
                      />
                    );
                  })()}
                  {/* Badge */}
                  {item.badge && sidebarOpen && !HREF_TO_TOOL_ID[item.href] && (
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
                  <Tooltip key={itemKey}>
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

              return <div key={itemKey}>{linkContent}</div>;
            })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          );
        })}

        {/* Settings */}
        {!recordingMode && <div className="mt-1">
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
        </div>}

      </nav>

      {/* Keyboard shortcut hint — navy-200 keeps it readable at 10px small caps */}
      {sidebarOpen && (
        <div className="px-4 py-2">
          <p className="text-[10px] text-navy-500 text-center tracking-wide">
            <kbd className="rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-navy-700">&#8984;K</kbd>
            <span className="ml-1.5">to search</span>
          </p>
        </div>
      )}

      {/* Bottom section */}
      <div className="border-t border-[var(--color-app-border)] p-2">
        {/* Plan badge — public surface shows monthly plan only; internal credit metering is private */}
        {sidebarOpen ? (
          <PraxisLink
            href="/settings"
            className="mb-2 mx-2 block rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-3 py-2 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  {user?.isDemo ? 'Case Access' : (PLAN_LABELS[user?.subscription || 'free'] || 'Free Plan')}
                </span>
              </div>
              {!user?.isDemo && user?.subscription === 'free' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Upgrade
                </span>
              )}
            </div>
          </PraxisLink>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <PraxisLink
                href="/settings"
                className="mb-2 flex items-center justify-center rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-2 py-2 transition-colors hover:border-emerald-300"
              >
                <Crown className="h-3.5 w-3.5 text-emerald-600" />
              </PraxisLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              {user?.isDemo ? 'Case Access' : (PLAN_LABELS[user?.subscription || 'free'] || 'Free Plan')}
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
                  {analystType}{analystDomain ? ` · ${analystDomain}` : ''}
                </p>
                <p className="truncate text-[11px] text-navy-400">
                  {orgLine}
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
