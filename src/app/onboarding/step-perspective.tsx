'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { AUDIENCES, type AnalystProfile, type Audience, type AnalystDomainId } from '@/types/analyst-profile';
import { LensReorder } from './lens-reorder';
import { ChipStack } from './chip-stack';
import { DomainPicker } from '@/components/domain/domain-picker';
import { cn } from '@/lib/utils/cn';

const REGIONS = [
  'Middle East', 'Sub-Saharan Africa', 'Eastern Europe', 'South Asia',
  'Central Asia', 'East Asia', 'Southeast Asia', 'North Africa',
  'Latin America', 'Western Balkans', 'Horn of Africa', 'Sahel',
  'South Caucasus', 'Caribbean', 'Pacific Islands',
];

const AUDIENCE_LABEL: Record<Audience, { title: string; desc: string }> = {
  myself: { title: 'Myself', desc: 'Personal research and learning' },
  team: { title: 'My team', desc: 'Internal sharing inside my unit' },
  senior_leadership: { title: 'Senior leadership', desc: 'Formal briefings for principals' },
  external_partners: { title: 'External partners', desc: 'Cross-organization products' },
  public: { title: 'Public', desc: 'Published or broadcast' },
};

export function StepPerspective({
  profile, onChange, onNext, onBack, saving,
}: {
  profile: AnalystProfile;
  onChange: (patch: Partial<AnalystProfile>) => Promise<void> | void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [mandateChips, setMandateChips] = useState<string[]>([]);
  const [mandateText, setMandateText] = useState(profile.perspective.mandate);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [suggestingMore, setSuggestingMore] = useState(false);

  const primaryDomain = (profile.perspective.primaryDomain ?? 'generic') as AnalystDomainId;
  const secondaryDomains = (profile.perspective.secondaryDomains ?? []) as AnalystDomainId[];

  useEffect(() => {
    fetch(`/api/onboarding/chips?field=mandate&role=${profile.identity.role}`)
      .then(r => r.json())
      .then(d => setMandateChips(d.chips ?? []));
  }, [profile.identity.role]);

  const addChip = (chip: string) => {
    const next = mandateText.trim() ? `${mandateText.trim()} ${chip}` : chip;
    setMandateText(next);
    onChange({ perspective: { ...profile.perspective, mandate: next } });
  };

  const setPerspective = (patch: Partial<AnalystProfile['perspective']>) =>
    onChange({ perspective: { ...profile.perspective, ...patch } });

  const requestMoreMandate = async (): Promise<string[]> => {
    try {
      const res = await fetch('/api/onboarding/chips/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: profile.identity.role, field: 'mandate', currentText: mandateText }),
      });
      const d = await res.json();
      return d.chips ?? [];
    } catch {
      return [];
    }
  };

  const valid =
    mandateText.trim().length >= 30 &&
    profile.perspective.lenses.length >= 1 &&
    profile.perspective.regions.length >= 1 &&
    !!profile.perspective.audience;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-900">Your perspective</h3>
        <p className="mt-1 text-sm text-navy-500">
          This is the payload. Every tool reads these to calibrate its output to you.
        </p>
      </div>

      {/* Mandate */}
      <div className="space-y-2">
        <label htmlFor="mandate-textarea" className="text-xs font-medium text-navy-700">
          Mandate — what you do, for whom
        </label>
        <p className="text-[11px] text-navy-500">
          Click chips to stack, or write your own. Injected into every tool&apos;s AI prompt.
        </p>
        <textarea
          id="mandate-textarea"
          aria-label="Mandate — what you do, for whom"
          value={mandateText}
          onChange={e => setMandateText(e.target.value)}
          onBlur={() => onChange({ perspective: { ...profile.perspective, mandate: mandateText } })}
          placeholder="e.g., I brief the SG weekly on prevention in Central Africa. Policy-neutral, IHL-anchored."
          rows={3}
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none resize-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {mandateChips.map(c => (
            <button
              key={c}
              onClick={() => addChip(c)}
              className={cn(
                'rounded-full border border-navy-200 bg-white px-2.5 py-1 text-[11px] text-navy-600 hover:border-navy-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
              )}
            >
              + {c.length > 60 ? c.slice(0, 60) + '\u2026' : c}
            </button>
          ))}
          <button
            aria-label="Suggest more mandate ideas"
            disabled={suggestingMore}
            aria-busy={suggestingMore}
            onClick={async () => {
              if (suggestingMore) return;
              setSuggestingMore(true);
              try {
                const more = await requestMoreMandate();
                setMandateChips(prev => [...prev, ...more]);
              } finally {
                setSuggestingMore(false);
              }
            }}
            className={cn(
              'flex items-center gap-1 rounded-full border border-dashed border-gold-500/40 bg-gold-500/5 px-2.5 py-1 text-[11px] text-gold-700 hover:bg-gold-500/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
              suggestingMore && 'cursor-not-allowed opacity-60',
            )}
          >
            {suggestingMore ? <><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</> : 'Suggest more'}
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span
            className={cn(
              'font-medium',
              mandateText.length < 30 ? 'text-crimson' : 'text-emerald-600',
            )}
          >
            {mandateText.length < 30
              ? `${30 - mandateText.length} more characters needed`
              : '✓ Mandate ready'}
          </span>
          <span className="text-navy-500">{mandateText.length}/600</span>
        </div>
      </div>

      {/* Primary domain — top-level taxonomy */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Primary domain</label>
        <p className="text-[11px] text-navy-500">
          The broad category of work you do most. Shapes which feeds, frameworks and
          prompt framings PRAXIS reaches for by default. You can always change it later.
        </p>
        <DomainPicker
          value={primaryDomain}
          onChange={(next) => setPerspective({ primaryDomain: next })}
        />
      </div>

      {/* Secondary domains — optional */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setSecondaryOpen((o) => !o)}
          className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900"
          aria-expanded={secondaryOpen}
        >
          {secondaryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Secondary domains (optional, up to 3)
          {secondaryDomains.length > 0 && (
            <span className="ml-1 rounded-full bg-diplomatic-blue/10 px-1.5 py-0.5 text-[10px] text-diplomatic-blue">
              {secondaryDomains.length}
            </span>
          )}
        </button>
        {secondaryOpen && (
          <>
            <p className="text-[11px] text-navy-500">
              Mixed-mandate work benefits from a second lens. Each secondary softly
              boosts its lens weights on top of your primary.
            </p>
            <DomainPicker
              mode="multi"
              value={primaryDomain}
              onChange={() => {}}
              multiValue={secondaryDomains}
              onMultiChange={(next) => setPerspective({ secondaryDomains: next })}
              disabledIds={[primaryDomain]}
              hideGeneric
              maxMulti={3}
            />
          </>
        )}
      </div>

      {/* Lenses */}
      <LensReorder
        value={profile.perspective.lenses}
        onChange={(next) => setPerspective({ lenses: next })}
      />

      {/* Regions */}
      <ChipStack
        label="Regions of focus"
        helper="Defaults for ARGUS, alerts, and daily brief."
        suggestions={REGIONS}
        value={profile.perspective.regions}
        onChange={(next) => setPerspective({ regions: next })}
        max={8}
        placeholder="Add custom region..."
      />

      {/* Audience */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Primary audience</label>
        <p className="text-[11px] text-navy-500">Calibrates draft tone and register.</p>
        <div className="grid gap-2 sm:grid-cols-5">
          {AUDIENCES.map(a => {
            const active = profile.perspective.audience === a;
            return (
              <button
                key={a}
                onClick={() => setPerspective({ audience: a })}
                aria-pressed={active}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                  active
                    ? 'border-diplomatic-blue bg-diplomatic-blue/5'
                    : 'border-navy-200 hover:border-navy-300',
                )}
              >
                <p className="text-xs font-semibold text-navy-800">{AUDIENCE_LABEL[a].title}</p>
                <p className="text-[10px] text-navy-500">{AUDIENCE_LABEL[a].desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid || saving}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
            valid && !saving
              ? 'bg-gold-500 text-white hover:bg-gold-600'
              : 'bg-navy-100 text-navy-400 cursor-not-allowed',
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </div>
  );
}
