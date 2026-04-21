'use client';

import { useEffect, useState } from 'react';
import type { UserPreferences } from '@/types/preferences';
import {
  CITATION_STYLES,
  REPORT_LENGTHS,
  CONFIDENCE_LABELLING,
  TIME_HORIZONS,
  DEFAULT_USER_PREFERENCES,
} from '@/types/preferences';
import { LANGUAGES } from '@/types/analyst-profile';
import { ADVISOR_IDS } from '@/types/advisor';

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/preferences')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setPrefs(d); })
      .catch(() => {});
  }, []);

  async function save(patch: Partial<UserPreferences>) {
    setSaving(true);
    try {
      const next = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then(r => r.json());
      if (!next?.error) { setPrefs(next); setSavedAt(new Date().toISOString()); }
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-serif text-navy-900">Preferences</h1>
        <p className="text-sm text-navy-500 mt-1">These settings shape every AI tool output — citation style, report length, language, confidence labelling, time horizon, and your go-to advisor.</p>
      </header>

      <Field label="Citation style" value={prefs.citationStyle} options={[...CITATION_STYLES]} onChange={v => save({ citationStyle: v as UserPreferences['citationStyle'] })} />
      <Field label="Default report length" value={prefs.defaultReportLength} options={[...REPORT_LENGTHS]} onChange={v => save({ defaultReportLength: v as UserPreferences['defaultReportLength'] })} />
      <Field label="Default language" value={prefs.defaultLanguage} options={[...LANGUAGES]} onChange={v => save({ defaultLanguage: v as UserPreferences['defaultLanguage'] })} />
      <Field label="Confidence labelling" value={prefs.confidenceLabelling} options={[...CONFIDENCE_LABELLING]} onChange={v => save({ confidenceLabelling: v as UserPreferences['confidenceLabelling'] })} />
      <Field label="Default time horizon" value={prefs.defaultTimeHorizon} options={[...TIME_HORIZONS]} onChange={v => save({ defaultTimeHorizon: v as UserPreferences['defaultTimeHorizon'] })} />
      <Field label="Preferred advisor" value={prefs.preferredAdvisor ?? ''} options={['', ...ADVISOR_IDS]} onChange={v => save({ preferredAdvisor: (v ? v : null) as UserPreferences['preferredAdvisor'] })} />

      <div className="text-xs text-navy-400 h-4">
        {saving && <span>Saving…</span>}
        {!saving && savedAt && <span className="text-emerald-600">Saved at {new Date(savedAt).toLocaleTimeString()}</span>}
      </div>
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
