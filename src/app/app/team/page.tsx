'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import { Clock, FileText, UserPlus, Users } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TeamPage() {
  const { showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;

  const [notes, setNotes] = useState('');

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6 lg:p-10">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Team Collaboration Hub</h1>
        <p className="mt-1 text-sm text-navy-500">
          Coordinate analysis across your team in real time.
        </p>
      </div>

      {/* ---- Section 1: Team Members ---- */}
      <section>
        <div className="mb-4 flex items-center gap-2 text-navy-700">
          <Users className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Team Members</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Invite prompt card */}
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-app-border)] bg-white/50 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-navy-700">
              Invite team members to collaborate on{' '}
              <span className="font-semibold text-navy-900">
                {situation?.name ?? 'this situation'}
              </span>
            </p>
            <p className="max-w-sm text-xs text-navy-400">
              Team collaboration is coming soon. You will be able to invite analysts,
              advisors, and coordinators to work together on shared situations.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Section 2: Activity Feed ---- */}
      <section>
        <div className="mb-4 flex items-center gap-2 text-navy-700">
          <Clock className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Team Activity</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-app-border)] bg-white px-4 py-12 text-center">
          <Clock className="mb-3 h-8 w-8 text-navy-300" />
          <p className="text-sm font-medium text-navy-600">Team activity will appear here</p>
          <p className="mt-1 max-w-xs text-xs text-navy-400">
            When team members take actions -- running queries, generating reports, or
            updating situations -- their activity will be logged here in real time.
          </p>
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
          placeholder="Jot down priority items, coordination notes, or talking points for your team..."
          className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <p className="mt-1.5 text-xs text-navy-400">
          Scratchpad contents are local to this session and are not yet persisted.
        </p>
      </section>
    </div>
  );
}
