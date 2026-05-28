'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { renderSystemPromptBlock } from '@/lib/context/system-prompt-block';
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import type { AnalystProfile } from '@/types/analyst-profile';
import { recommendToolsForRole } from '@/lib/dashboard/role-recommendations';
import { cn } from '@/lib/utils/cn';
import { LivingContextRail } from '@/components/ui/instrument';

const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ar: 'العربية',
  ru: 'Русский',
  zh: '中文',
};

const AUDIENCE_LABEL: Record<string, string> = {
  myself: 'Myself',
  team: 'My team',
  senior_leadership: 'Senior leadership',
  external_partners: 'External partners',
  public: 'Public',
};

export function LivePreview({ profile }: { profile: AnalystProfile }) {
  const [showRaw, setShowRaw] = useState(false);

  const block = renderSystemPromptBlock({
    profile,
    situation: null,
    retrievedChunks: [],
    preferences: DEFAULT_USER_PREFERENCES,
  });

  const recs = recommendToolsForRole(
    profile.identity.role,
    profile.perspective.primaryDomain,
    4,
  );

  const audience = AUDIENCE_LABEL[profile.perspective.audience] ?? profile.perspective.audience;
  const language = LANGUAGE_LABEL[profile.workingStyle.language] ?? profile.workingStyle.language.toUpperCase();
  const lenses = profile.perspective.lenses.slice(0, 3);
  const regions = profile.perspective.regions.slice(0, 4);
  const redLines = profile.workingStyle.redLines.slice(0, 4);
  const previewRailCells = [
    { id: 'profile', label: 'Profile', value: profile.identity.role || 'Analyst', detail: profile.identity.org || 'Organization pending', state: 'ready' as const },
    { id: 'context', label: 'Context', value: profile.perspective.primaryDomain || 'Policy domain', detail: audience, state: profile.perspective.primaryDomain ? 'active' as const : 'review' as const },
    { id: 'source', label: 'Sources', value: regions.length ? `${regions.length} regions` : 'Open', detail: language, state: regions.length ? 'ready' as const : 'quiet' as const },
    { id: 'output', label: 'Output', value: profile.workingStyle.analyticalStyle || 'Memo', detail: lenses[0]?.replace(/_/g, ' ') ?? 'Lens pending', state: 'quiet' as const },
    { id: 'readiness', label: 'Readiness', value: redLines.length ? 'Guardrails set' : 'Drafting', detail: 'Updates live', state: redLines.length ? 'ready' as const : 'active' as const },
  ];

  return (
    <div className="sticky top-6 space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500">
          Calibration preview
        </h4>
        <p className="mt-0.5 text-[11px] text-navy-400">
          What every PRAXIS tool will know about you. Updates live.
        </p>
      </div>

      <LivingContextRail cells={previewRailCells} compact />

      <div className="space-y-3 rounded-lg border border-navy-200 bg-white p-4">
        <PreviewRow label="Audience tone" value={audience} />
        <PreviewRow label="Output language" value={language} />
        {lenses.length > 0 && (
          <PreviewRow
            label="Primary lenses"
            value={lenses.join(' / ').replace(/_/g, ' ')}
          />
        )}
        {regions.length > 0 && (
          <PreviewRow label="Regions" value={regions.join(', ')} />
        )}
        {redLines.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
              Red lines
            </p>
            <ul className="mt-1 space-y-0.5 text-[11px] text-navy-700">
              {redLines.map((r, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-navy-400">•</span>
                  <span className="leading-snug">{r}</span>
                </li>
              ))}
              {profile.workingStyle.redLines.length > redLines.length && (
                <li className="text-[10px] text-navy-400">
                  +{profile.workingStyle.redLines.length - redLines.length} more
                </li>
              )}
            </ul>
          </div>
        )}
        {recs.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
              Tools we&apos;ll recommend first
            </p>
            <ul className="mt-1 space-y-0.5 text-[11px] text-navy-700">
              {recs.map((r) => (
                <li key={r.toolId} className="flex gap-1.5">
                  <span className="text-navy-400">•</span>
                  <span className="capitalize leading-snug">
                    {r.toolId.replace(/-/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        aria-expanded={showRaw}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-navy-200 bg-white px-3 py-2 text-[11px] font-medium text-navy-600',
          'hover:border-navy-300 hover:text-navy-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40',
        )}
      >
        <span>Proof: view system prompt block</span>
        {showRaw ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {showRaw && (
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-navy-200 bg-navy-900 p-4 text-[11px] leading-relaxed text-emerald-300 whitespace-pre-wrap font-mono">
          {block}
        </pre>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-navy-800">{value}</p>
    </div>
  );
}
