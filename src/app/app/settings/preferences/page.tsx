'use client';

import type { UserPreferences } from '@/types/preferences';
import {
  CITATION_STYLES,
  REPORT_LENGTHS,
  CONFIDENCE_LABELLING,
  TIME_HORIZONS,
} from '@/types/preferences';
import { LANGUAGES } from '@/types/analyst-profile';
import { ADVISOR_IDS } from '@/types/advisor';
import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  CUSTOMIZABLE_SIDEBAR_TOOLS,
  hiddenToolSet,
  orderedToolIds,
} from '@/lib/navigation/tool-preferences';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export default function PreferencesPage() {
  const { preferences: prefs, isSaving, savedAt, error, save } = useUserPreferences();

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-serif text-navy-900">Preferences</h1>
        <p className="text-sm text-navy-500 mt-1">These settings shape every AI tool output and the workspace tools you keep in view.</p>
      </header>

      <Field label="Citation style" value={prefs.citationStyle} options={[...CITATION_STYLES]} onChange={v => save({ citationStyle: v as UserPreferences['citationStyle'] })} />
      <Field label="Default report length" value={prefs.defaultReportLength} options={[...REPORT_LENGTHS]} onChange={v => save({ defaultReportLength: v as UserPreferences['defaultReportLength'] })} />
      <Field label="Default language" value={prefs.defaultLanguage} options={[...LANGUAGES]} onChange={v => save({ defaultLanguage: v as UserPreferences['defaultLanguage'] })} />
      <Field label="Confidence labelling" value={prefs.confidenceLabelling} options={[...CONFIDENCE_LABELLING]} onChange={v => save({ confidenceLabelling: v as UserPreferences['confidenceLabelling'] })} />
      <Field label="Default time horizon" value={prefs.defaultTimeHorizon} options={[...TIME_HORIZONS]} onChange={v => save({ defaultTimeHorizon: v as UserPreferences['defaultTimeHorizon'] })} />
      <Field label="Preferred advisor" value={prefs.preferredAdvisor ?? ''} options={['', ...ADVISOR_IDS]} onChange={v => save({ preferredAdvisor: (v ? v : null) as UserPreferences['preferredAdvisor'] })} />

      <ToolLayoutPreferences prefs={prefs} save={save} />

      <div className="text-xs text-navy-400 h-4">
        {isSaving && <span>Saving...</span>}
        {!isSaving && savedAt && <span className="text-emerald-600">Saved at {new Date(savedAt).toLocaleTimeString()}</span>}
      </div>
      {error && <p className="text-xs text-red-600">Save failed: {error}</p>}
    </div>
  );
}

function Field({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-navy-400 mb-1">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded border border-[var(--color-app-border)] px-3 py-2 text-sm bg-white">
        {options.map(o => <option key={o || 'none'} value={o}>{o || '— none —'}</option>)}
      </select>
    </label>
  );
}

function ToolLayoutPreferences({
  prefs,
  save,
}: {
  prefs: UserPreferences;
  save: (patch: Partial<UserPreferences>) => Promise<void>;
}) {
  const order = orderedToolIds(prefs);
  const hidden = hiddenToolSet(prefs);
  const byId = new Map(CUSTOMIZABLE_SIDEBAR_TOOLS.map((tool) => [tool.toolId, tool]));
  const orderedTools = order.map((id) => byId.get(id)).filter(Boolean) as typeof CUSTOMIZABLE_SIDEBAR_TOOLS;

  function move(toolId: string, direction: -1 | 1) {
    const index = order.indexOf(toolId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    void save({ toolOrder: next });
  }

  function toggleHidden(toolId: string) {
    const next = hidden.has(toolId)
      ? prefs.hiddenToolIds.filter((id) => id !== toolId)
      : [...prefs.hiddenToolIds, toolId];
    void save({ hiddenToolIds: next });
  }

  return (
    <section className="rounded border border-[var(--color-app-border)] bg-white">
      <div className="border-b border-[var(--color-app-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-navy-900">Workspace tools</h2>
        <p className="mt-1 text-xs text-navy-500">Hide tools you do not use and move high-value tools closer to the top of each sidebar section.</p>
      </div>
      <div className="divide-y divide-[var(--color-app-border)]">
        {orderedTools.map((tool, index) => {
          const isHidden = hidden.has(tool.toolId);
          return (
            <div
              key={tool.toolId}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                isHidden && 'bg-slate-50 text-navy-400'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-900">{tool.label}</p>
                <p className="truncate text-xs text-navy-500">{tool.section}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(tool.toolId, -1)}
                  disabled={index === 0}
                  className="rounded p-1.5 text-navy-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`Move ${tool.label} up`}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(tool.toolId, 1)}
                  disabled={index === orderedTools.length - 1}
                  className="rounded p-1.5 text-navy-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`Move ${tool.label} down`}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleHidden(tool.toolId)}
                  className={cn(
                    'rounded p-1.5 hover:bg-slate-100',
                    isHidden ? 'text-amber-600' : 'text-navy-500'
                  )}
                  aria-label={isHidden ? `Show ${tool.label}` : `Hide ${tool.label}`}
                  title={isHidden ? 'Show' : 'Hide'}
                >
                  {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
