'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Sparkles, Wrench } from 'lucide-react';

interface FeedCapabilityMatrix {
  availableProviders: string[];
  missingProviders: Array<{ provider: string; label: string; tagline: string; signupUrl: string | null; unlocks: string[] }>;
  coverageScore: number;
  fallback: string;
}

/**
 * Subtle banner above the dashboard widget grid showing how many sources the
 * user has configured and offering a link to Settings → API Keys when the
 * coverage is incomplete. Never errors-out: on fetch failure it simply renders
 * nothing so the dashboard remains unblocked.
 */
export function SourceCoverageBanner() {
  const [matrix, setMatrix] = useState<FeedCapabilityMatrix | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let aborted = false;
    fetch('/api/capabilities', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!aborted && m && typeof m === 'object') setMatrix(m as FeedCapabilityMatrix);
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      aborted = true;
    };
  }, []);

  if (!matrix || dismissed) return null;

  const missing = matrix.missingProviders ?? [];
  const score = matrix.coverageScore ?? 0;

  // 100% coverage — tiny celebratory note, dismissable
  if (missing.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="flex-1">All {matrix.availableProviders.length} data sources are live for this workspace.</span>
        <button className="text-emerald-300 hover:text-emerald-100" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <Database className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium">
          Source coverage: {matrix.availableProviders.length} / {matrix.availableProviders.length + missing.length}
          {' '}
          <span className="text-slate-500">({score}%)</span>
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">
          Free-tier grounded web search is active. Unlock more by adding keys:
        </span>
        <Link
          href="/app/settings/api-keys"
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-0.5 text-slate-200 hover:border-slate-500"
        >
          <Wrench className="h-3 w-3" /> Configure
        </Link>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {missing.map((p) => (
          <li key={p.provider} className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300">
            + {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
