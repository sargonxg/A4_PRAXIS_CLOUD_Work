'use client';

import { useState } from 'react';
import { Clock, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TEAM_MEMBERS = [
  { name: 'Dr. Sarah Chen', role: 'Lead Analyst', initials: 'SC', caseAssignment: 'Nordalia Crisis', status: 'online' as const, lastAction: 'Updated Situation Report', lastActionTime: '10 min ago', color: '#1B3A5C' },
  { name: 'Marcus Okafor', role: 'Political Officer', initials: 'MO', caseAssignment: 'Nordalia Crisis', status: 'online' as const, lastAction: 'Ran ARGUS query on EMLF financing', lastActionTime: '25 min ago', color: '#10B981' },
  { name: 'Lt. Eva Lindström', role: 'Military Advisor', initials: 'EL', caseAssignment: 'Nordalia Crisis', status: 'away' as const, lastAction: 'Flagged military buildup alert', lastActionTime: '1 hour ago', color: '#E8B931' },
  { name: 'Priya Sharma', role: 'Humanitarian Coord.', initials: 'PS', caseAssignment: 'Ethiopia-Tigray', status: 'online' as const, lastAction: 'Generated impact assessment', lastActionTime: '2 hours ago', color: '#8B5CF6' },
  { name: 'James Whitfield', role: 'Legal Counsel', initials: 'JW', caseAssignment: 'Nordalia Crisis', status: 'offline' as const, lastAction: 'Reviewed ceasefire clause compliance', lastActionTime: '3 hours ago', color: '#C75B39' },
  { name: 'Amara Diallo', role: 'Mediation Specialist', initials: 'AD', caseAssignment: 'Riverside Land Dispute', status: 'online' as const, lastAction: 'Started CONCORDIA session prep', lastActionTime: '4 hours ago', color: '#3B82F6' },
];

const ACTIVITY_FEED = [
  { memberId: 0, action: 'Updated Situation Report for Nordalia Crisis', time: '10 min ago', product: 'PRAXIS' as const },
  { memberId: 1, action: 'Ran ARGUS query: "EMLF financing networks via Marchian Heritage Foundation"', time: '25 min ago', product: 'ARGUS' as const },
  { memberId: 2, action: 'Flagged military buildup alert — 3 battalions redeployed to northern corridor', time: '1 hour ago', product: null },
  { memberId: 3, action: 'Generated humanitarian impact assessment for Ethiopia-Tigray', time: '2 hours ago', product: 'PRAXIS' as const },
  { memberId: 4, action: 'Reviewed ceasefire clause compliance — flagged Article 5 non-compliance', time: '3 hours ago', product: 'ARGUS' as const },
  { memberId: 5, action: 'Started CONCORDIA session prep for Riverside mediation', time: '4 hours ago', product: 'CONCORDIA' as const },
  { memberId: 0, action: 'Generated morning intelligence brief via Dossier Generator', time: '5 hours ago', product: 'PRAXIS' as const },
  { memberId: 1, action: 'Cross-referenced 12 new ARGUS entities with sanctions database', time: '6 hours ago', product: 'ARGUS' as const },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_DOT: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-400',
  offline: 'bg-gray-400',
};

const PRODUCT_BADGE: Record<string, string> = {
  ARGUS: 'bg-emerald-100 text-emerald-700',
  CONCORDIA: 'bg-violet-100 text-violet-700',
  PRAXIS: 'bg-blue-100 text-blue-700',
};

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function MemberCard({ member }: { member: (typeof TEAM_MEMBERS)[number] }) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy-900">{member.name}</p>
          <p className="truncate text-xs text-navy-500">{member.role}</p>
        </div>
      </div>

      {/* Case badge */}
      <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-app-surface-alt)] px-2.5 py-0.5 text-[11px] font-medium text-navy-700">
        {member.caseAssignment}
      </span>

      {/* Status + last action */}
      <div className="mt-auto space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-navy-500">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[member.status])} />
          <span className="capitalize">{member.status}</span>
        </div>
        <p className="text-xs text-navy-400 leading-snug">
          {member.lastAction} &middot; {member.lastActionTime}
        </p>
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: (typeof ACTIVITY_FEED)[number] }) {
  const member = TEAM_MEMBERS[item.memberId];
  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: member.color }}
      >
        {member.initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-navy-700 leading-snug">
          <span className="font-semibold text-navy-900">{member.name}</span>{' '}
          {item.action}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-navy-400">{item.time}</span>
          {item.product && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                PRODUCT_BADGE[item.product],
              )}
            >
              {item.product}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TeamPage() {
  const [notes, setNotes] = useState(
    'Priority items for today:\n- Review overnight ARGUS alerts on EMLF movements\n- Prepare talking points for 14:00 EU FAC briefing\n- Follow up on ceasefire compliance report from Eva',
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6 lg:p-10">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Team Collaboration Hub</h1>
        <p className="mt-1 text-sm text-navy-500">Coordinate analysis across your team in real time.</p>
      </div>

      {/* ---- Section 1: Team Members ---- */}
      <section>
        <div className="mb-4 flex items-center gap-2 text-navy-700">
          <Users className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Team Members</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM_MEMBERS.map((m) => (
            <MemberCard key={m.initials} member={m} />
          ))}
        </div>
      </section>

      {/* ---- Section 2: Activity Feed ---- */}
      <section>
        <div className="mb-4 flex items-center gap-2 text-navy-700">
          <Clock className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Team Activity</h2>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white px-4 divide-y divide-[var(--color-app-border)]">
          {ACTIVITY_FEED.map((item, i) => (
            <ActivityItem key={i} item={item} />
          ))}
        </div>
      </section>

      {/* ---- Section 3: Shared Scratchpad ---- */}
      <section>
        <div className="mb-4 flex items-center gap-2 text-navy-700">
          <FileText className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Shared Scratchpad</h2>
        </div>
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <p className="mt-1.5 text-xs text-navy-400">Changes are not persisted in demo mode</p>
      </section>
    </div>
  );
}
