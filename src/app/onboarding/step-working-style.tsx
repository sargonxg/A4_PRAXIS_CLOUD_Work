'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { LANGUAGES, ANALYTICAL_STYLES, type AnalystProfile, type Language } from '@/types/analyst-profile';
import { ChipStack } from './chip-stack';
import { cn } from '@/lib/utils/cn';

const SOURCE_CATEGORIES = [
  { id: 'foundational', label: 'Foundational', desc: 'Wikipedia, CIA Factbook' },
  { id: 'conflict-security', label: 'Conflict & Security', desc: 'ICG, ACLED, SIPRI' },
  { id: 'humanitarian', label: 'Humanitarian', desc: 'ReliefWeb, UNHCR, HRW' },
  { id: 'diplomatic-official', label: 'Diplomatic & Official', desc: 'UN News, State, EEAS' },
  { id: 'news-media', label: 'News & Media', desc: 'Reuters, AP, BBC' },
  { id: 'think-tanks', label: 'Think Tanks', desc: 'RAND, Carnegie, Brookings' },
  { id: 'military-intelligence', label: 'Military & Intel', desc: 'Janes, IISS, Bellingcat' },
  { id: 'economic-development', label: 'Economic & Development', desc: 'World Bank, IMF, UNDP' },
];

const LANGUAGE_LABEL: Record<Language, { flag: string; name: string }> = {
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  es: { flag: '🇪🇸', name: 'Español' },
  ar: { flag: '🇸🇦', name: 'العربية' },
  ru: { flag: '🇷🇺', name: 'Русский' },
  zh: { flag: '🇨🇳', name: '中文' },
};

export function StepWorkingStyle({
  profile, onChange, onNext, onBack, saving,
}: {
  profile: AnalystProfile;
  onChange: (patch: Partial<AnalystProfile>) => Promise<void> | void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [redLineChips, setRedLineChips] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/onboarding/chips?field=redLines').then(r => r.json()).then(d => setRedLineChips(d.chips ?? []));
  }, []);

  const setWorkingStyle = (patch: Partial<AnalystProfile['workingStyle']>) =>
    onChange({ workingStyle: { ...profile.workingStyle, ...patch } });

  const toggleSource = (id: string) => {
    const cur = profile.workingStyle.sourceCategories;
    setWorkingStyle({
      sourceCategories: cur.includes(id) ? cur.filter(c => c !== id) : [...cur, id],
    });
  };

  const requestMoreRedLines = async (): Promise<string[]> => {
    try {
      const res = await fetch('/api/onboarding/chips/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: profile.identity.role, field: 'redLines' }),
      });
      const d = await res.json();
      return d.chips ?? [];
    } catch { return []; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-900">Working style</h3>
        <p className="mt-1 text-sm text-navy-500">How you want PRAXIS to produce output.</p>
      </div>

      {/* Source categories */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Default source categories</label>
        <p className="text-[11px] text-navy-500">Used by ARGUS, Daily Brief, and research tools.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SOURCE_CATEGORIES.map(c => {
            const active = profile.workingStyle.sourceCategories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleSource(c.id)}
                aria-pressed={active}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                  active ? 'border-diplomatic-blue bg-diplomatic-blue/5' : 'border-navy-200 hover:border-navy-300',
                )}
              >
                <p className="text-xs font-semibold text-navy-800">{c.label}</p>
                <p className="text-[10px] text-navy-500">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Output language</label>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map(l => {
            const active = profile.workingStyle.language === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setWorkingStyle({ language: l })}
                aria-pressed={active}
                aria-label={LANGUAGE_LABEL[l].name}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                  active
                    ? 'border-diplomatic-blue bg-diplomatic-blue/5 font-semibold text-diplomatic-blue'
                    : 'border-navy-200 text-navy-700 hover:border-navy-300',
                )}
              >
                <span aria-hidden="true">{LANGUAGE_LABEL[l].flag}</span>
                <span>{LANGUAGE_LABEL[l].name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Red lines */}
      <ChipStack
        label="Red lines / house style"
        helper="Hard constraints applied to every drafting tool."
        suggestions={redLineChips}
        value={profile.workingStyle.redLines}
        onChange={next => setWorkingStyle({ redLines: next })}
        max={12}
        placeholder="Add your own rule..."
        onRequestMore={requestMoreRedLines}
      />

      {/* Analytical style */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Analytical style</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {ANALYTICAL_STYLES.map(s => {
            const active = profile.workingStyle.analyticalStyle === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setWorkingStyle({ analyticalStyle: s })}
                aria-pressed={active}
                className={cn(
                  'rounded-lg border px-3 py-3 text-left transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                  active ? 'border-diplomatic-blue bg-diplomatic-blue/5' : 'border-navy-200 hover:border-navy-300',
                )}
              >
                <p className="text-sm font-semibold text-navy-800 capitalize">{s.replace('_', ' ')}</p>
                <p className="text-[11px] text-navy-500">
                  {s === 'rapid_brief' ? 'Short, actionable bullets. Favor speed.' : 'Long-form with caveats and citations.'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-white hover:bg-gold-600 disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-1',
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Review and complete <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </div>
  );
}
