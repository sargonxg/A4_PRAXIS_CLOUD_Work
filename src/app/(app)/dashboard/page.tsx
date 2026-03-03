'use client';

import Link from 'next/link';
import {
  FileText,
  MessageSquare,
  Upload,
  Compass,
  ArrowRight,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  FileUp,
  GitBranch,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Activity,
  Bell,
  Lightbulb,
  Zap,
  Globe,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { Badge } from '@/components/ui/badge';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const topMetrics = [
  { label: 'Active Situations', value: '12', change: '+2 this week', icon: Activity, color: 'text-crimson', bg: 'bg-crimson/8', trend: 'up' },
  { label: 'Reports This Month', value: '47', change: '12 pending review', icon: FileText, color: 'text-teal', bg: 'bg-teal/8', trend: 'up' },
  { label: 'Pending Alerts', value: '3', change: '1 critical', icon: AlertTriangle, color: 'text-gold-600', bg: 'bg-gold-500/8', trend: 'neutral' },
  { label: 'Team Online', value: '5', change: 'of 8 members', icon: Users, color: 'text-sage', bg: 'bg-sage/8', trend: 'neutral' },
];

const aiInsights = [
  {
    priority: 'urgent',
    icon: AlertTriangle,
    title: 'Escalation Alert: Nordalia Eastern Provinces',
    summary: 'ACLED data shows 40% spike in armed incidents over the past 72 hours. DRM forces have advanced to the Belara mining complex. Recommend updating the Nordalia Situation Assessment.',
    actions: [
      { label: 'Update Situation Report', href: '/reports/new' },
      { label: 'View Early Warning', href: '/early-warning' },
    ],
  },
  {
    priority: 'action',
    icon: Calendar,
    title: 'Prepare for UNSC Open Debate at 10:00',
    summary: 'Protection of Civilians debate in 2 hours. 3 relevant draft resolutions on the agenda. Pre-brief generated with key talking points and delegation positions.',
    actions: [
      { label: 'View Pre-Brief', href: '/calendar' },
      { label: 'Generate Talking Points', href: '/talking-points' },
    ],
  },
  {
    priority: 'insight',
    icon: Lightbulb,
    title: 'New Pattern Detected: Sahel Arms Flow',
    summary: 'Cross-referencing media reports and Panel of Experts data reveals a potential new supply route through southern Sertania. 78% confidence. Col. Mitchell recommends further analysis.',
    actions: [
      { label: 'View Analysis', href: '/conflict-graph' },
      { label: 'Ask Col. Mitchell', href: '/advisory/col-mitchell' },
    ],
  },
];

const priorityConfig = {
  urgent: { border: 'border-crimson/20', bg: 'bg-crimson/5', iconColor: 'text-crimson', label: 'Urgent', labelBg: 'bg-crimson/10 text-crimson' },
  action: { border: 'border-gold-500/20', bg: 'bg-gold-500/5', iconColor: 'text-gold-600', label: 'Action Required', labelBg: 'bg-gold-500/10 text-gold-700' },
  insight: { border: 'border-teal/20', bg: 'bg-teal/5', iconColor: 'text-teal', label: 'AI Insight', labelBg: 'bg-teal/10 text-teal' },
};

const quickActions = [
  { label: 'New Report', description: 'Create a situation report with AI assistance', href: '/reports/new', icon: FileText, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8', hoverBg: 'hover:bg-diplomatic-blue/12' },
  { label: 'Ask PRAXIS', description: 'AI-powered analysis and research', href: '/assistant', icon: MessageSquare, color: 'text-teal', bg: 'bg-teal/8', hoverBg: 'hover:bg-teal/12' },
  { label: 'Upload Sources', description: 'Ingest documents and cables', href: '/documents', icon: Upload, color: 'text-sage', bg: 'bg-sage/8', hoverBg: 'hover:bg-sage/12' },
  { label: 'Media Scan', description: 'Analyze media landscape', href: '/media-compass', icon: Compass, color: 'text-steel', bg: 'bg-steel/8', hoverBg: 'hover:bg-steel/12' },
];

const todayCalendar = [
  { time: '10:00', title: 'UNSC Open Debate: Protection of Civilians', institution: 'UNSC', color: '#4B92DB', hasBrief: true },
  { time: '11:30', title: 'AU PSC 1187th Meeting: Sahel Situation', institution: 'AU PSC', color: '#E8B931', hasBrief: true },
  { time: '14:00', title: 'EU FAC: Eastern Partnership Review', institution: 'EU', color: '#3D5A80', hasBrief: false },
  { time: '15:30', title: 'ECOWAS Mediation Group: Niger Follow-up', institution: 'ECOWAS', color: '#C75B39', hasBrief: true },
];

const recentReports = [
  { id: 'rpt-001', title: 'Nordalia Situation Assessment Q1 2026', template: 'Situation Report', modified: 'Feb 28, 2026', status: 'draft' as const, aiSuggestion: 'Needs update — new data available' },
  { id: 'rpt-002', title: 'Eastern Marches Mediation Brief', template: 'Mediation Brief', modified: 'Feb 25, 2026', status: 'review' as const, aiSuggestion: null },
  { id: 'rpt-003', title: 'Coastal Territory Risk Matrix', template: 'Risk Assessment', modified: 'Feb 22, 2026', status: 'final' as const, aiSuggestion: null },
  { id: 'rpt-004', title: 'Regional Arms Flow Analysis', template: 'Thematic Brief', modified: 'Feb 18, 2026', status: 'draft' as const, aiSuggestion: 'New PoE data available for cross-reference' },
  { id: 'rpt-005', title: 'Monthly Secretary-General Report Draft', template: 'SG Report', modified: 'Feb 15, 2026', status: 'review' as const, aiSuggestion: null },
];

const statusStyles = {
  draft: { label: 'Draft', bg: 'bg-navy-100', text: 'text-navy-600' },
  review: { label: 'In Review', bg: 'bg-gold-500/10', text: 'text-gold-700' },
  final: { label: 'Final', bg: 'bg-sage/10', text: 'text-sage' },
};

const activeConflicts = [
  { id: 'conf-001', name: 'The Nordalia Crisis', actors: 10, lastEvent: 'Jan 15, 2026', trend: 'escalating' as const, riskScore: 8.2 },
  { id: 'conf-002', name: 'Eastern Marches Dispute', actors: 6, lastEvent: 'Feb 20, 2026', trend: 'de-escalating' as const, riskScore: 5.8 },
  { id: 'conf-003', name: 'Coastal Territory Negotiations', actors: 8, lastEvent: 'Feb 28, 2026', trend: 'stalled' as const, riskScore: 4.5 },
];

const trendConfig = {
  escalating: { label: 'Escalating', icon: TrendingUp, color: 'text-crimson', bg: 'bg-crimson/8' },
  'de-escalating': { label: 'De-escalating', icon: TrendingDown, color: 'text-sage', bg: 'bg-sage/8' },
  stalled: { label: 'Stalled', icon: Minus, color: 'text-gold-600', bg: 'bg-gold-500/8' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">
          {getGreeting()},{' '}
          <span className="text-diplomatic-blue">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          {formatDate(today)} &middot; {user?.orgName}
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {topMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', metric.bg)}>
                  <Icon className={cn('h-5 w-5', metric.color)} />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-navy-900">{metric.value}</div>
                  <p className="text-[11px] text-navy-500">{metric.label}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-navy-400">{metric.change}</p>
            </div>
          );
        })}
      </div>

      {/* AI Intelligence Briefing */}
      <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/3 to-transparent p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10">
            <Sparkles className="h-4 w-4 text-gold-600" />
          </div>
          <h2 className="text-base font-semibold text-navy-900">Morning Intelligence Briefing</h2>
          <span className="text-[10px] text-navy-400">Auto-generated at 06:00 UTC</span>
        </div>
        <div className="space-y-3">
          {aiInsights.map((insight, i) => {
            const config = priorityConfig[insight.priority as keyof typeof priorityConfig];
            const Icon = insight.icon;
            return (
              <div key={i} className={cn('rounded-lg border p-4', config.border, config.bg)}>
                <div className="flex items-start gap-3">
                  <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', config.labelBg)}>{config.label}</span>
                      <h3 className="text-sm font-semibold text-navy-900">{insight.title}</h3>
                    </div>
                    <p className="text-xs text-navy-600 leading-relaxed">{insight.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {insight.actions.map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/30 hover:text-diplomatic-blue"
                        >
                          {action.label}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group relative rounded-xl border border-[var(--color-app-border)] bg-white p-5 transition-all hover:shadow-md hover:shadow-navy-950/5',
                action.hoverBg
              )}
            >
              <div className={cn('mb-3 inline-flex rounded-lg p-2.5', action.bg)}>
                <Icon className={cn('h-5 w-5', action.color)} />
              </div>
              <h3 className="text-sm font-semibold text-navy-900">{action.label}</h3>
              <p className="mt-0.5 text-xs text-navy-500">{action.description}</p>
              <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-navy-300 transition-all group-hover:translate-x-0.5 group-hover:text-navy-500" />
            </Link>
          );
        })}
      </div>

      {/* Calendar + Conflicts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's calendar */}
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-diplomatic-blue" />
              <h2 className="text-sm font-semibold text-navy-900">Today&apos;s Institutional Calendar</h2>
            </div>
            <Link href="/calendar" className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-app-border-light)]">
            {todayCalendar.map((event, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[var(--color-app-surface-alt)]">
                <span className="shrink-0 font-mono text-xs text-navy-400">{event.time}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      style={{ backgroundColor: `${event.color}12`, color: event.color }}
                    >
                      {event.institution}
                    </span>
                    {event.hasBrief && (
                      <span className="flex items-center gap-1 rounded-full bg-gold-500/8 px-1.5 py-0.5 text-[9px] font-medium text-gold-600">
                        <Sparkles className="h-2.5 w-2.5" />
                        Brief Ready
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-navy-700">{event.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Conflicts */}
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-crimson" />
              <h2 className="text-sm font-semibold text-navy-900">Active Conflicts</h2>
            </div>
            <Link href="/early-warning" className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80">
              Early Warning <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 p-4">
            {activeConflicts.map((conflict) => {
              const trend = trendConfig[conflict.trend];
              const TrendIcon = trend.icon;
              const riskColor = conflict.riskScore >= 8 ? 'text-crimson' : conflict.riskScore >= 6 ? 'text-gold-600' : 'text-sage';
              return (
                <Link
                  key={conflict.id}
                  href={`/conflict-graph/${conflict.id}`}
                  className="block rounded-lg border border-[var(--color-app-border)] p-4 transition-all hover:border-navy-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-navy-900">{conflict.name}</h3>
                    <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', trend.bg, trend.color)}>
                      <TrendIcon className="h-3 w-3" />
                      {trend.label}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-navy-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {conflict.actors} actors
                    </span>
                    <span className={cn('flex items-center gap-1 font-semibold', riskColor)}>
                      <Shield className="h-3 w-3" />
                      Risk: {conflict.riskScore}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-navy-900">Recent Reports</h2>
          <Link href="/reports" className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-[var(--color-app-border-light)]">
          {recentReports.map((report) => {
            const style = statusStyles[report.status];
            return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--color-app-surface-alt)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">{report.title}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="rounded-full border border-[var(--color-app-border)] px-2 py-0.5 text-[10px] text-navy-500">{report.template}</span>
                    <span className="flex items-center gap-1 text-xs text-navy-400">
                      <Clock className="h-3 w-3" />
                      {report.modified}
                    </span>
                    {report.aiSuggestion && (
                      <span className="flex items-center gap-1 text-[10px] text-gold-600">
                        <Sparkles className="h-3 w-3" />
                        {report.aiSuggestion}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn('ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium', style.bg, style.text)}>
                  {style.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
