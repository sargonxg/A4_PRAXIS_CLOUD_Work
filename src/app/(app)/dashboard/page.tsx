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
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* Mock data */

const topMetrics = [
  { label: 'Active Situations', value: '12', icon: Activity, color: 'text-crimson', bg: 'bg-crimson/10' },
  { label: 'Reports This Month', value: '47', icon: FileText, color: 'text-teal', bg: 'bg-teal/10' },
  { label: 'Pending Alerts', value: '3', icon: AlertTriangle, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  { label: 'Team Online', value: '5', icon: Users, color: 'text-sage', bg: 'bg-sage/10' },
];

const quickActions = [
  {
    label: 'New Report',
    description: 'Create a situation report',
    href: '/reports/new',
    icon: FileText,
    gradient: 'from-gold-600 to-gold-500',
    iconBg: 'bg-gold-500/20',
    iconColor: 'text-gold-400',
  },
  {
    label: 'Ask Assistant',
    description: 'AI-powered analysis',
    href: '/assistant',
    icon: MessageSquare,
    gradient: 'from-teal to-teal/80',
    iconBg: 'bg-teal/20',
    iconColor: 'text-teal',
  },
  {
    label: 'Upload Documents',
    description: 'Ingest new sources',
    href: '/documents',
    icon: Upload,
    gradient: 'from-sage to-sage/80',
    iconBg: 'bg-sage/20',
    iconColor: 'text-sage',
  },
  {
    label: 'Analyze Media',
    description: 'Media landscape scan',
    href: '/media-compass',
    icon: Compass,
    gradient: 'from-steel to-steel/80',
    iconBg: 'bg-steel/20',
    iconColor: 'text-steel',
  },
];

const todayCalendar = [
  { time: '10:00', title: 'UNSC Open Debate: Protection of Civilians', institution: 'UNSC', color: '#4B92DB' },
  { time: '11:30', title: 'AU PSC 1187th Meeting: Sahel Situation', institution: 'AU PSC', color: '#E8B931' },
  { time: '14:00', title: 'EU FAC: Eastern Partnership Review', institution: 'EU', color: '#3D5A80' },
];

const advisorRecommendations = [
  { advisor: 'Dr. Okafor', color: '#E8B931', message: 'Review the latest ACLED data on Sahel violence trends — 40% spike in attacks this month.' },
  { advisor: 'Col. Mitchell', color: '#3D5A80', message: 'UNMISS force posture report is due — consider pre-drafting the security assessment section.' },
];

const recentReports = [
  { id: 'rpt-001', title: 'Nordalia Situation Assessment Q1 2026', template: 'Situation Report', modified: 'Feb 28, 2026', status: 'draft' as const },
  { id: 'rpt-002', title: 'Eastern Marches Mediation Brief', template: 'Mediation Brief', modified: 'Feb 25, 2026', status: 'review' as const },
  { id: 'rpt-003', title: 'Coastal Territory Risk Matrix', template: 'Risk Assessment', modified: 'Feb 22, 2026', status: 'final' as const },
  { id: 'rpt-004', title: 'Regional Arms Flow Analysis', template: 'Thematic Brief', modified: 'Feb 18, 2026', status: 'draft' as const },
  { id: 'rpt-005', title: 'Monthly Secretary-General Report Draft', template: 'SG Report', modified: 'Feb 15, 2026', status: 'review' as const },
];

const statusStyles = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  review: { label: 'In Review', variant: 'gold' as const },
  final: { label: 'Final', variant: 'sage' as const },
};

const activeConflicts = [
  { id: 'conf-001', name: 'The Nordalia Crisis', actors: 10, lastEvent: 'Jan 15, 2026', trend: 'escalating' as const, riskScore: 8.2 },
  { id: 'conf-002', name: 'Eastern Marches Dispute', actors: 6, lastEvent: 'Feb 20, 2026', trend: 'de-escalating' as const, riskScore: 5.8 },
  { id: 'conf-003', name: 'Coastal Territory Negotiations', actors: 8, lastEvent: 'Feb 28, 2026', trend: 'stalled' as const, riskScore: 4.5 },
];

const trendConfig = {
  escalating: { label: 'Escalating', icon: TrendingUp, color: 'text-crimson', bg: 'bg-crimson/10', border: 'border-crimson/20' },
  'de-escalating': { label: 'De-escalating', icon: TrendingDown, color: 'text-sage', bg: 'bg-sage/10', border: 'border-sage/20' },
  stalled: { label: 'Stalled', icon: Minus, color: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/20' },
};

const recentActivity = [
  { id: 'act-001', icon: FileUp, text: 'Document uploaded: SG Report S/2026/100', time: '2 hours ago' },
  { id: 'act-002', icon: FileText, text: 'Report draft updated: Nordalia Situation Assessment', time: '5 hours ago' },
  { id: 'act-003', icon: GitBranch, text: 'Conflict graph updated: 3 new entities extracted', time: '1 day ago' },
  { id: 'act-004', icon: BarChart3, text: 'Media analysis completed: 12 sources analyzed', time: '2 days ago' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Welcome + metrics */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-50">
            {getGreeting()},{' '}
            <span className="text-gold-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            {formatDate(today)} &middot; {user?.orgName}
          </p>
        </div>
      </div>

      {/* Top metrics bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {topMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex items-center gap-3 rounded-lg border border-navy-700/50 bg-navy-800 p-4"
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', metric.bg)}>
                <Icon className={cn('h-5 w-5', metric.color)} />
              </div>
              <div>
                <div className="text-xl font-semibold text-navy-50">{metric.value}</div>
                <p className="text-[10px] text-navy-400">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-lg border border-navy-700/50 bg-navy-800 p-5 transition-all hover:border-navy-600 hover:bg-navy-800/80 hover:shadow-lg hover:shadow-navy-950/50"
            >
              <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-60 transition-opacity group-hover:opacity-100', action.gradient)} />
              <div className={cn('mb-3 inline-flex rounded-lg p-2.5', action.iconBg)}>
                <Icon className={cn('h-5 w-5', action.iconColor)} />
              </div>
              <h3 className="text-sm font-semibold text-navy-50">{action.label}</h3>
              <p className="mt-0.5 text-xs text-navy-400">{action.description}</p>
              <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-navy-600 transition-all group-hover:translate-x-0.5 group-hover:text-navy-400" />
            </Link>
          );
        })}
      </div>

      {/* Calendar + Advisor Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's calendar */}
        <div className="rounded-lg border border-navy-700/50 bg-navy-800">
          <div className="flex items-center justify-between border-b border-navy-700/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold-400" />
              <h2 className="text-base font-semibold text-navy-50">Today&apos;s Institutional Calendar</h2>
            </div>
            <Link href="/calendar" className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-navy-700/30">
            {todayCalendar.map((event, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <span className="shrink-0 font-mono text-xs text-navy-500">{event.time}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: `${event.color}15`, color: event.color }}>
                      {event.institution}
                    </span>
                  </div>
                  <p className="truncate text-xs text-navy-200">{event.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advisor recommendations */}
        <div className="rounded-lg border border-navy-700/50 bg-navy-800">
          <div className="flex items-center justify-between border-b border-navy-700/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-400" />
              <h2 className="text-base font-semibold text-navy-50">Advisor Recommendations</h2>
            </div>
            <Link href="/advisory" className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
              Council <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-navy-700/30">
            {advisorRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 px-6 py-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${rec.color}15`, color: rec.color, border: `1px solid ${rec.color}30` }}
                >
                  {rec.advisor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-medium text-navy-200">{rec.advisor}</p>
                  <p className="mt-1 text-xs text-navy-400 leading-relaxed">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports + Conflicts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-navy-700/50 bg-navy-800">
          <div className="flex items-center justify-between border-b border-navy-700/50 px-6 py-4">
            <h2 className="text-base font-semibold text-navy-50">Recent Reports</h2>
            <Link href="/reports" className="flex items-center gap-1 text-xs font-medium text-gold-400 transition-colors hover:text-gold-300">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-navy-700/30">
            {recentReports.map((report) => {
              const style = statusStyles[report.status];
              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-navy-700/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-100">{report.title}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{report.template}</Badge>
                      <span className="flex items-center gap-1 text-xs text-navy-500">
                        <Clock className="h-3 w-3" />
                        {report.modified}
                      </span>
                    </div>
                  </div>
                  <Badge variant={style.variant} className="ml-4 shrink-0">{style.label}</Badge>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-navy-700/50 bg-navy-800">
          <div className="flex items-center justify-between border-b border-navy-700/50 px-6 py-4">
            <h2 className="text-base font-semibold text-navy-50">Active Conflicts</h2>
            <Link href="/early-warning" className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
              Alerts <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 p-4">
            {activeConflicts.map((conflict) => {
              const trend = trendConfig[conflict.trend];
              const TrendIcon = trend.icon;
              return (
                <Link
                  key={conflict.id}
                  href={`/conflict-graph/${conflict.id}`}
                  className={cn('block rounded-lg border p-4 transition-all hover:border-navy-600', trend.border, 'bg-navy-900/50')}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-navy-100">{conflict.name}</h3>
                    <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', trend.bg, trend.color)}>
                      <TrendIcon className="h-3 w-3" />
                      {trend.label}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-navy-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {conflict.actors} actors
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Risk: {conflict.riskScore}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-navy-700/50 bg-navy-800">
        <div className="border-b border-navy-700/50 px-6 py-4">
          <h2 className="text-base font-semibold text-navy-50">Recent Activity</h2>
        </div>
        <div className="divide-y divide-navy-700/30">
          {recentActivity.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="relative flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700/50">
                    <Icon className="h-4 w-4 text-navy-300" />
                  </div>
                  {index < recentActivity.length - 1 && (
                    <div className="absolute top-8 h-[calc(100%+0.5rem)] w-px bg-navy-700/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy-200">{activity.text}</p>
                </div>
                <span className="shrink-0 text-xs text-navy-500">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
