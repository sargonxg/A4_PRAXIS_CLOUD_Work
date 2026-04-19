'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export function AnalystProfileCard({ compact = false }: { compact?: boolean }) {
  const { analystProfile, onboardingComplete } = useAuth();

  if (!onboardingComplete || !analystProfile) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs">
        <p className="font-semibold text-yellow-800">No analyst profile set</p>
        <Link
          href="/onboarding"
          className="mt-1 inline-block text-slate-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 rounded"
        >
          Complete onboarding
        </Link>
      </div>
    );
  }

  const p = analystProfile;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {p.identity.seniority} {p.identity.role} · {p.identity.org}
          </p>
          {!compact && (
            <>
              <p className="mt-1 line-clamp-2 text-slate-600">{p.perspective.mandate}</p>
              <p className="mt-2 text-[10px] text-slate-500">
                Lens: {p.perspective.lenses.slice(0, 3).join(' · ')} · Audience:{' '}
                {p.perspective.audience.replace('_', ' ')} · {p.workingStyle.language.toUpperCase()}
              </p>
            </>
          )}
        </div>
        <Link
          href="/app/settings?tab=profile"
          aria-label="Edit analyst profile"
          className="shrink-0 text-slate-400 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 rounded"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
