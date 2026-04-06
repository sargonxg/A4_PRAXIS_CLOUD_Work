'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { useSituationStore } from '@/stores/situation-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Plus,
  Users,
  Upload,
  X,
  BookOpen,
  Shield,
  Heart,
  Building2,
  Newspaper,
  Brain,
  DollarSign,
  Sword,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import type { SituationType, UserRole } from '@/types/situation';

/* ---------- Types ---------- */

interface SituationForm {
  name: string;
  type: SituationType;
  description: string;
  region: string;
  status: 'active' | 'emerging' | 'frozen';
  actors: string[];
  userRole: UserRole;
  // Optional initial assessment (helps tools from day 0)
  riskScore: number;
  glaslStage: number | null;
  escalationTrend: 'stable' | 'escalating' | 'de-escalating';
}

type Step = 1 | 2 | 3 | 4;

/* ---------- Constants ---------- */

const SITUATION_TYPES: { value: SituationType; label: string }[] = [
  { value: 'international', label: 'International Conflict' },
  { value: 'civil', label: 'Civil Conflict' },
  { value: 'political', label: 'Political Crisis' },
  { value: 'trade', label: 'Trade Dispute' },
  { value: 'workplace', label: 'Workplace Dispute' },
  { value: 'community', label: 'Community Dispute' },
  { value: 'legal', label: 'Legal Dispute' },
  { value: 'custom', label: 'Custom' },
];

const USER_ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'observer', label: 'Observer', desc: 'Monitoring without direct involvement' },
  { value: 'analyst', label: 'Analyst', desc: 'Producing intelligence and assessments' },
  { value: 'mediator', label: 'Mediator', desc: 'Facilitating negotiation between parties' },
  { value: 'party', label: 'Party to conflict', desc: 'Directly involved in the situation' },
  { value: 'advisor', label: 'Advisor', desc: 'Providing counsel to stakeholders' },
  { value: 'researcher', label: 'Researcher', desc: 'Academic or policy research' },
];

const REGION_SUGGESTIONS = [
  'Middle East', 'Sub-Saharan Africa', 'Eastern Europe', 'South Asia',
  'Central Asia', 'East Asia', 'Southeast Asia', 'North Africa',
  'Latin America', 'Western Balkans', 'Horn of Africa', 'Sahel',
  'South Caucasus', 'Caribbean', 'Pacific Islands',
];

/* ---------- Step Indicator ---------- */

const STEPS: { step: Step; label: string; icon: React.ElementType }[] = [
  { step: 1, label: 'Describe', icon: FileText },
  { step: 2, label: 'Actors', icon: Users },
  { step: 3, label: 'Sources', icon: BookOpen },
  { step: 4, label: 'Create', icon: Check },
];

// ── Source category definitions ──────────────────────────────────────────────

interface SourceCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  sources: string[];
  searchTerms: string[];
  alwaysOn?: boolean;
  useFirecrawl?: boolean;
}

const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    id: 'foundational',
    label: 'Foundational',
    description: 'Wikipedia, encyclopedic context, geo & demographic data',
    icon: BookOpen,
    sources: ['Wikipedia', 'CIA World Factbook', 'CFR Country Profiles'],
    searchTerms: ['history background', 'geography demographics', 'overview'],
    alwaysOn: true,
  },
  {
    id: 'conflict-security',
    label: 'Conflict & Security',
    description: 'Armed groups, violence data, conflict dynamics',
    icon: Shield,
    sources: ['ICG CrisisWatch', 'ACLED', 'SIPRI', 'IISS', 'Geneva Academy'],
    searchTerms: ['armed conflict violence escalation', 'security forces ceasefire'],
    useFirecrawl: true,
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    description: 'Displacement, protection, aid operations, civilian impact',
    icon: Heart,
    sources: ['ReliefWeb', 'UNHCR', 'Human Rights Watch', 'Amnesty International', 'ICRC', 'MSF'],
    searchTerms: ['humanitarian crisis displacement refugees civilians'],
    useFirecrawl: true,
  },
  {
    id: 'diplomatic-official',
    label: 'Diplomatic & Official',
    description: 'UN bodies, foreign ministry statements, official positions',
    icon: Building2,
    sources: ['UN News', 'UNSC Resolutions', "What's In Blue", 'State Dept', 'EU EEAS', 'African Union'],
    searchTerms: ['diplomatic negotiations peace talks UN Security Council resolution'],
    useFirecrawl: true,
  },
  {
    id: 'news-media',
    label: 'News & Media',
    description: 'Breaking news, frontline reporting, regional press',
    icon: Newspaper,
    sources: ['Reuters', 'AP', 'BBC', 'Al Jazeera', 'AFP', 'Financial Times'],
    searchTerms: ['latest news developments today situation update'],
    useFirecrawl: true,
  },
  {
    id: 'think-tanks',
    label: 'Think Tanks & Policy',
    description: 'Expert analysis, policy briefs, scenario reports',
    icon: Brain,
    sources: ['RAND', 'Carnegie Endowment', 'Chatham House', 'Brookings', 'Wilson Center'],
    searchTerms: ['analysis policy brief expert assessment scenario'],
    useFirecrawl: true,
  },
  {
    id: 'military-intelligence',
    label: 'Military & Intelligence',
    description: 'Armed forces, weapons, open-source intelligence',
    icon: Sword,
    sources: ["Jane's Defence", 'IISS Military Balance', 'Bellingcat', 'ISW'],
    searchTerms: ['military forces weapons capabilities troop movements'],
    useFirecrawl: true,
  },
  {
    id: 'economic-development',
    label: 'Economic & Development',
    description: 'Economic drivers, sanctions, development indicators',
    icon: DollarSign,
    sources: ['World Bank', 'IMF', 'UNDP', 'Oxford Analytica', 'Fitch/Moody\'s'],
    searchTerms: ['economic sanctions poverty development GDP trade'],
    useFirecrawl: true,
  },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map(({ step, label, icon: Icon }, idx) => {
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            {idx > 0 && (
              <div className={cn('hidden sm:block h-px w-8 transition-colors', isCompleted || isActive ? 'bg-gold-500' : 'bg-navy-200')} />
            )}
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                isActive ? 'bg-gold-500 text-white shadow-md shadow-gold-500/25' : isCompleted ? 'bg-gold-500/20 text-gold-700' : 'bg-navy-100 text-navy-400'
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn('hidden sm:inline text-xs font-medium transition-colors', isActive ? 'text-navy-900' : isCompleted ? 'text-navy-600' : 'text-navy-400')}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Motion ---------- */

const stepVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

/* ---------- Step 1: Describe ---------- */

function StepDescribe({ form, setForm, onNext }: { form: SituationForm; setForm: React.Dispatch<React.SetStateAction<SituationForm>>; onNext: () => void }) {
  const isValid = form.name.trim().length > 0;
  const [showRegions, setShowRegions] = useState(false);
  const [intelPreview, setIntelPreview] = useState<{ articles: { title: string; url: string; domain: string }[]; reports: { title: string; source: string }[]; loading: boolean }>({ articles: [], reports: [], loading: false });
  const [previewFetched, setPreviewFetched] = useState(false);

  // Auto-fetch intelligence preview when name has 3+ words
  const fetchPreview = useCallback(async () => {
    if (previewFetched || !form.name.trim()) return;
    setIntelPreview((p) => ({ ...p, loading: true }));
    setPreviewFetched(true);
    try {
      const res = await fetch('/api/data/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: form.region || form.name, query: form.name, limit: 10 }),
      });
      if (res.ok) {
        const data = await res.json();
        setIntelPreview({
          articles: (data.events || []).filter((e: { source: string }) => e.source === 'gdelt').slice(0, 5).map((e: { title: string; url?: string; metadata?: { domain?: string } }) => ({ title: e.title, url: e.url || '', domain: e.metadata?.domain || '' })),
          reports: (data.events || []).filter((e: { source: string }) => e.source === 'reliefweb').slice(0, 3).map((e: { title: string; metadata?: { source?: string } }) => ({ title: e.title, source: e.metadata?.source || 'ReliefWeb' })),
          loading: false,
        });
      } else {
        setIntelPreview((p) => ({ ...p, loading: false }));
      }
    } catch {
      setIntelPreview((p) => ({ ...p, loading: false }));
    }
  }, [form.name, form.region, previewFetched]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">Describe Your Situation</h2>
        <p className="mt-1 text-sm text-navy-500">What conflict or situation are you tracking?</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Situation Name <span className="text-red-500">*</span></label>
        <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Syria Ceasefire Monitoring" autoFocus
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Type</label>
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SituationType }))}
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20">
          {SITUATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="2-3 sentences describing the conflict dynamics, key issues, and current state..." rows={4}
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 resize-none" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 relative">
          <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700"><Globe className="h-3 w-3" /> Region</label>
          <input type="text" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            onFocus={() => setShowRegions(true)} onBlur={() => setTimeout(() => setShowRegions(false), 150)}
            placeholder="e.g., Eastern Mediterranean"
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20" />
          {showRegions && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-36 overflow-y-auto rounded-lg border border-navy-200 bg-white shadow-lg">
              {REGION_SUGGESTIONS.filter((r) => r.toLowerCase().includes(form.region.toLowerCase())).map((r) => (
                <button key={r} onMouseDown={() => { setForm((f) => ({ ...f, region: r })); setShowRegions(false); }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-navy-700 hover:bg-navy-50">{r}</button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-navy-700">Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SituationForm['status'] }))}
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20">
            <option value="active">Active</option>
            <option value="emerging">Emerging</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>
      </div>

      {/* Intelligence Preview */}
      {isValid && !previewFetched && (
        <button onClick={fetchPreview} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/5 px-4 py-2.5 text-xs font-medium text-gold-700 hover:bg-gold-500/10 transition-colors">
          <Sparkles className="h-3.5 w-3.5" />
          Scan for live intelligence on &ldquo;{form.name}&rdquo;
        </button>
      )}

      {intelPreview.loading && (
        <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
          <span className="text-xs text-navy-600">Scanning GDELT + ReliefWeb for live data...</span>
        </div>
      )}

      {(intelPreview.articles.length > 0 || intelPreview.reports.length > 0) && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Live data found — PRAXIS will use this to build your situation
          </p>
          {intelPreview.articles.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-navy-500 mb-1">Recent articles ({intelPreview.articles.length})</p>
              {intelPreview.articles.slice(0, 3).map((a, i) => (
                <p key={i} className="text-[11px] text-navy-700 truncate">{a.title} <span className="text-navy-400">— {a.domain}</span></p>
              ))}
            </div>
          )}
          {intelPreview.reports.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-navy-500 mb-1">ReliefWeb reports ({intelPreview.reports.length})</p>
              {intelPreview.reports.map((r, i) => (
                <p key={i} className="text-[11px] text-navy-700 truncate">{r.title} <span className="text-navy-400">— {r.source}</span></p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={onNext} disabled={!isValid}
          className={cn('flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
            isValid ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20' : 'bg-navy-100 text-navy-400 cursor-not-allowed')}>
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Step 2: Actors ---------- */

function StepActors({ form, setForm, onNext, onBack }: { form: SituationForm; setForm: React.Dispatch<React.SetStateAction<SituationForm>>; onNext: () => void; onBack: () => void }) {
  const [actorInput, setActorInput] = useState('');

  const addActor = () => {
    const name = actorInput.trim();
    if (name && !form.actors.includes(name)) {
      setForm((f) => ({ ...f, actors: [...f.actors, name] }));
      setActorInput('');
    }
  };

  const removeActor = (name: string) => {
    setForm((f) => ({ ...f, actors: f.actors.filter((a) => a !== name) }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">Who&apos;s Involved?</h2>
        <p className="mt-1 text-sm text-navy-500">Identify the key actors and your role in this situation.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Key Actors / Parties</label>
        <div className="flex gap-2">
          <input type="text" value={actorInput} onChange={(e) => setActorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addActor(); } }}
            placeholder="Type an actor name and press Enter"
            className="flex-1 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20" />
          <button onClick={addActor} className="rounded-lg bg-navy-100 px-3 py-2.5 text-navy-600 hover:bg-navy-200 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {form.actors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.actors.map((actor) => (
              <span key={actor} className="inline-flex items-center gap-1.5 rounded-full bg-diplomatic-blue/10 px-3 py-1 text-xs font-medium text-diplomatic-blue">
                {actor}
                <button onClick={() => removeActor(actor)} className="text-diplomatic-blue/60 hover:text-diplomatic-blue"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Your Role</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {USER_ROLES.map((r) => (
            <button key={r.value} onClick={() => setForm((f) => ({ ...f, userRole: r.value }))}
              className={cn('rounded-lg border px-4 py-3 text-left transition-all',
                form.userRole === r.value ? 'border-diplomatic-blue bg-diplomatic-blue/5 ring-1 ring-diplomatic-blue/20' : 'border-navy-200 hover:border-navy-300')}>
              <p className={cn('text-sm font-medium', form.userRole === r.value ? 'text-diplomatic-blue' : 'text-navy-700')}>{r.label}</p>
              <p className="text-[11px] text-navy-500 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Initial Assessment */}
      <InitialAssessment form={form} setForm={setForm} />

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gold-600 shadow-md shadow-gold-500/20">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Initial Assessment (embedded in Step 2) ---------- */

const GLASL_STAGE_OPTIONS = [
  { value: null, label: 'Unknown / Not applicable' },
  { value: 1, label: 'Stage 1 — Hardening (positions fix)' },
  { value: 2, label: 'Stage 2 — Debate & Polemic' },
  { value: 3, label: 'Stage 3 — Actions not Words' },
  { value: 4, label: 'Stage 4 — Images & Coalitions' },
  { value: 5, label: 'Stage 5 — Loss of Face' },
  { value: 6, label: 'Stage 6 — Strategies of Threats' },
  { value: 7, label: 'Stage 7 — Limited Destructive Blows' },
  { value: 8, label: 'Stage 8 — Fragmentation' },
  { value: 9, label: 'Stage 9 — Together into the Abyss' },
];

function InitialAssessment({
  form,
  setForm,
}: {
  form: SituationForm;
  setForm: React.Dispatch<React.SetStateAction<SituationForm>>;
}) {
  const [open, setOpen] = useState(false);

  const riskLabel =
    form.riskScore >= 8 ? 'Critical' :
    form.riskScore >= 6 ? 'High' :
    form.riskScore >= 4 ? 'Moderate' :
    form.riskScore >= 2 ? 'Low' : 'Not rated';

  const riskColor =
    form.riskScore >= 8 ? 'text-red-600' :
    form.riskScore >= 6 ? 'text-amber-600' :
    form.riskScore >= 4 ? 'text-yellow-600' :
    form.riskScore >= 2 ? 'text-emerald-600' : 'text-navy-400';

  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-navy-400" />
          <span className="text-xs font-semibold text-navy-700">
            Initial Risk Assessment
            {(form.riskScore > 0 || form.glaslStage) && (
              <span className="ml-2 text-navy-400 font-normal">
                {form.riskScore > 0 && <span className={riskColor}>{riskLabel} risk</span>}
                {form.glaslStage && <span className="text-navy-400"> · Stage {form.glaslStage}</span>}
              </span>
            )}
          </span>
          <span className="rounded-full bg-navy-200 px-2 py-0.5 text-[9px] font-semibold text-navy-500 uppercase tracking-wide">Optional</span>
        </div>
        {open ? <X className="h-3.5 w-3.5 text-navy-400" /> : <Plus className="h-3.5 w-3.5 text-navy-400" />}
      </button>

      {open && (
        <div className="border-t border-navy-100 px-4 py-4 space-y-4">
          <p className="text-[11px] text-navy-500">
            Help PRAXIS tools with an initial assessment. You can skip this — AI tools will estimate from your situation description.
          </p>

          {/* Risk Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-navy-700">Risk Score</label>
              <span className={cn('text-xs font-semibold', riskColor)}>
                {form.riskScore > 0 ? `${form.riskScore}/10 — ${riskLabel}` : 'Not rated'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={form.riskScore}
              onChange={(e) => setForm((f) => ({ ...f, riskScore: parseInt(e.target.value) }))}
              className="w-full accent-diplomatic-blue"
            />
            <div className="flex justify-between text-[9px] text-navy-400">
              <span>Not rated</span>
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Critical</span>
            </div>
          </div>

          {/* Glasl Stage */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-navy-700">Glasl Escalation Stage</label>
            <select
              value={form.glaslStage ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  glaslStage: e.target.value === '' ? null : parseInt(e.target.value),
                }))
              }
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-800 focus:border-diplomatic-blue focus:outline-none"
            >
              {GLASL_STAGE_OPTIONS.map((opt) => (
                <option key={opt.value ?? 'null'} value={opt.value ?? ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Trend */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-navy-700">Escalation Trend</label>
            <div className="flex gap-2">
              {(['escalating', 'stable', 'de-escalating'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, escalationTrend: t }))}
                  className={cn(
                    'flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all',
                    form.escalationTrend === t
                      ? t === 'escalating'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : t === 'de-escalating'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-navy-200 text-navy-500 hover:border-navy-300'
                  )}
                >
                  {t === 'escalating' ? '↑ Escalating' : t === 'de-escalating' ? '↓ De-escalating' : '→ Stable'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Step 3: Sources ---------- */

interface ContextData {
  urls: string[];
  notes: string;
  files: File[];
  selectedSources: string[];
}

function StepSources({ context, setContext, onNext, onBack, situationName }: { context: ContextData; setContext: React.Dispatch<React.SetStateAction<ContextData>>; onNext: () => void; onBack: () => void; situationName: string }) {
  const { urls, notes, files, selectedSources } = context;
  const setUrls = (u: string[] | ((prev: string[]) => string[])) => setContext((c) => ({ ...c, urls: typeof u === 'function' ? u(c.urls) : u }));
  const setNotes = (n: string) => setContext((c) => ({ ...c, notes: n }));
  const setFiles = (f: File[] | ((prev: File[]) => File[])) => setContext((c) => ({ ...c, files: typeof f === 'function' ? f(c.files) : f }));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleSource = (id: string) => {
    const cat = SOURCE_CATEGORIES.find((c) => c.id === id);
    if (cat?.alwaysOn) return;
    setContext((c) => ({
      ...c,
      selectedSources: c.selectedSources.includes(id)
        ? c.selectedSources.filter((s) => s !== id)
        : [...c.selectedSources, id],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type)
      );
      setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const firecrawlCount = SOURCE_CATEGORIES.filter((c) => selectedSources.includes(c.id) && c.useFirecrawl).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">Research Sources</h2>
        <p className="mt-1 text-sm text-navy-500">
          Select which source categories to include. PRAXIS will scrape Wikipedia first, then run targeted research across your selected categories to build the conflict knowledge graph for <span className="font-medium text-navy-700">&ldquo;{situationName}&rdquo;</span>.
        </p>
      </div>

      {/* Wikipedia always-first notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <BookOpen className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-700">Wikipedia is always scraped first</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Provides canonical background, geography, actors, and historical context for all conflict tools.</p>
        </div>
      </div>

      {/* Source category grid */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {SOURCE_CATEGORIES.map((cat) => {
          const isSelected = cat.alwaysOn || selectedSources.includes(cat.id);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => toggleSource(cat.id)}
              disabled={cat.alwaysOn}
              className={cn(
                'relative rounded-xl border p-3.5 text-left transition-all text-sm',
                isSelected
                  ? 'border-diplomatic-blue/40 bg-diplomatic-blue/5 ring-1 ring-diplomatic-blue/20'
                  : 'border-navy-200 bg-white hover:border-navy-300',
                cat.alwaysOn && 'cursor-default'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-diplomatic-blue/10' : 'bg-navy-100'
                  )}>
                    <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-diplomatic-blue' : 'text-navy-400')} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-xs font-semibold leading-tight', isSelected ? 'text-diplomatic-blue' : 'text-navy-700')}>
                      {cat.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-navy-400 leading-tight">{cat.description}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  {cat.alwaysOn ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">Always</span>
                  ) : (
                    <div className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center transition-all',
                      isSelected ? 'border-diplomatic-blue bg-diplomatic-blue' : 'border-navy-300 bg-white'
                    )}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {cat.sources.slice(0, 4).map((s) => (
                  <span key={s} className="rounded-full bg-navy-100/80 px-1.5 py-0.5 text-[9px] font-medium text-navy-500">{s}</span>
                ))}
                {cat.sources.length > 4 && (
                  <span className="rounded-full bg-navy-100/80 px-1.5 py-0.5 text-[9px] font-medium text-navy-400">+{cat.sources.length - 4} more</span>
                )}
              </div>
              {cat.useFirecrawl && isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="rounded bg-gold-500/10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-gold-600">Firecrawl</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Research summary */}
      <div className="rounded-lg border border-navy-200 bg-navy-50/40 px-4 py-3 text-[11px] text-navy-500 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-navy-400" />
        <span>
          <span className="font-semibold text-navy-700">{selectedSources.length + 1} source categories selected</span>
          {firecrawlCount > 0 && <> — {firecrawlCount} will use Firecrawl web search</>}. Research is capped at ~20,000 characters for preliminary ACO ontology construction. Full deep research is available via the <span className="font-semibold text-navy-700">Deep Research Agent</span> after setup.
        </span>
      </div>

      {/* Advanced: custom URLs, notes, files */}
      <div>
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-navy-500 hover:text-navy-700 transition-colors">
          <Plus className={cn('h-3.5 w-3.5 transition-transform', showAdvanced && 'rotate-45')} />
          {showAdvanced ? 'Hide' : 'Add'} custom sources (URLs, documents, notes)
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 rounded-xl border border-navy-200 bg-white p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-navy-700">Custom URLs (up to 5)</label>
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" value={url} onChange={(e) => { const u = [...urls]; u[i] = e.target.value; setUrls(u); }} placeholder="https://..."
                    className="flex-1 rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20" />
                  {urls.length > 1 && <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="text-navy-400 hover:text-red-500"><X className="h-4 w-4" /></button>}
                </div>
              ))}
              {urls.length < 5 && (
                <button onClick={() => setUrls([...urls, ''])} className="text-xs text-diplomatic-blue hover:underline mt-1">+ Add another URL</button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-navy-700">Documents (PDF, DOCX, TXT)</label>
              <div className="rounded-lg border-2 border-dashed border-navy-200 bg-navy-50/50 p-4 text-center hover:border-diplomatic-blue/30 transition-colors">
                <Upload className="mx-auto h-6 w-6 text-navy-400" />
                <p className="mt-1.5 text-xs text-navy-600">Drag & drop or <label className="cursor-pointer text-diplomatic-blue hover:underline">browse<input type="file" multiple accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" /></label></p>
              </div>
              {files.length > 0 && (
                <div className="space-y-1 mt-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-3 py-2">
                      <span className="text-xs text-navy-700 truncate">{f.name}</span>
                      <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-navy-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-navy-700">Notes / Raw Intelligence</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste any relevant notes, meeting summaries, or raw intelligence..." rows={3}
                className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 resize-none" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onNext} className="text-sm font-medium text-navy-500 hover:text-navy-700">Skip research</button>
          <button onClick={onNext}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gold-600 shadow-md shadow-gold-500/20">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 4: Review & Create ---------- */

function StepReview({ form, onBack, onCreate, isCreating }: { form: SituationForm; onBack: () => void; onCreate: () => void; isCreating: boolean }) {
  const typeLabel = SITUATION_TYPES.find((t) => t.value === form.type)?.label ?? form.type;
  const roleLabel = USER_ROLES.find((r) => r.value === form.userRole)?.label ?? form.userRole;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">Review & Create</h2>
        <p className="mt-1 text-sm text-navy-500">Confirm the details and create your situation workspace.</p>
      </div>

      <div className="rounded-xl border border-[var(--color-app-border)] bg-navy-50/30">
        <div className="border-b border-[var(--color-app-border)] px-6 py-4">
          <h3 className="text-base font-bold text-navy-900">{form.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-navy-500">
            <span className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 font-medium text-diplomatic-blue">{typeLabel}</span>
            {form.region && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{form.region}</span>}
            <span className="capitalize">{form.status}</span>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {form.description && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Description</p>
              <p className="text-sm text-navy-700 leading-relaxed">{form.description}</p>
            </div>
          )}
          {form.actors.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Actors ({form.actors.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {form.actors.map((a) => <span key={a} className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-xs font-medium text-diplomatic-blue">{a}</span>)}
              </div>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Your Role</p>
            <p className="text-sm text-navy-700">{roleLabel}</p>
          </div>

          <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-3">
            <p className="text-xs text-emerald-700">Creating this situation costs <strong>0 credits</strong>. AI analysis of uploaded documents costs 3 credits each.</p>
          </div>

          <div className="rounded-lg border border-navy-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-3">PRAXIS will create</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: 'Dashboard overview', desc: 'Situation snapshot & quick actions' },
                { label: 'Conflict graph', desc: 'Populated from your context' },
                { label: 'Actor profiles', desc: `${form.actors.length || 'No'} actors ready to enrich` },
                { label: 'AI assistant', desc: 'Ready for situation-aware questions' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                  <div><p className="text-xs font-medium text-navy-800">{label}</p><p className="text-[10px] text-navy-500">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} disabled={isCreating} className="flex items-center gap-2 rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onCreate} disabled={isCreating}
          className={cn('flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
            isCreating ? 'bg-gold-500/70 text-white cursor-not-allowed' : 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20')}>
          {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Sparkles className="h-4 w-4" /> Create Situation</>}
        </button>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function NewSituationPage() {
  const router = useRouter();
  const route = usePraxisRoute();
  const { user, firebaseUser } = useAuth();
  const { addSituation } = useSituationStore();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<SituationForm>({
    name: '',
    type: 'international',
    description: '',
    region: '',
    status: 'active',
    actors: [],
    userRole: 'analyst',
    riskScore: 0,
    glaslStage: null,
    escalationTrend: 'stable',
  });

  const [context, setContext] = useState<ContextData>({
    urls: [''],
    notes: '',
    files: [],
    selectedSources: ['conflict-security', 'humanitarian', 'diplomatic-official', 'news-media'],
  });

  const goNext = useCallback(() => { setDirection(1); setStep((s) => Math.min(s + 1, 4) as Step); }, []);
  const goBack = useCallback(() => { setDirection(-1); setStep((s) => Math.max(s - 1, 1) as Step); }, []);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    setError('');
    try {
      // Refresh token cookie before API call
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken(true);
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }

      // Upload files first (if any) — we need a temporary situationId placeholder
      // We'll upload without situationId first, then re-associate after creation
      const uploadedDocIds: string[] = [];
      const filteredUrls = context.urls.filter((u) => u.trim());

      if (context.files.length > 0) {
        for (const file of context.files) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              if (uploadData.document?.id) uploadedDocIds.push(uploadData.document.id);
            }
          } catch {
            // Continue with remaining files
          }
        }
      }

      const res = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          riskScore: form.riskScore > 0 ? form.riskScore : undefined,
          glaslStage: form.glaslStage ?? undefined,
          escalationTrend: form.escalationTrend,
          sourceUrls: filteredUrls.length ? filteredUrls : undefined,
          contextNotes: context.notes.trim() || undefined,
          initialDocumentIds: uploadedDocIds.length ? uploadedDocIds : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        if (res.status === 401) {
          setError('Session expired. Please sign in again.');
        } else {
          setError(data.error || 'Failed to create situation. Please try again.');
        }
        setIsCreating(false);
        return;
      }
      const { situation } = await res.json();
      addSituation(situation);

      // Re-upload files with the actual situationId so they get stored in Firestore
      if (context.files.length > 0) {
        for (const file of context.files) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('situationId', situation.id);
            fetch('/api/documents/upload', { method: 'POST', body: formData }).catch(() => {});
          } catch { /* background */ }
        }
      }

      // Kick off auto-structure in background (fire-and-forget)
      try {
        fetch('/api/ai/auto-structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            situationName: form.name,
            situationType: form.type,
            region: form.region,
            description: form.description,
            actors: form.actors,
            userRole: form.userRole,
            situationId: situation.id,
            urls: filteredUrls.length ? filteredUrls : undefined,
            notes: context.notes.trim() || undefined,
            documentIds: uploadedDocIds.length ? uploadedDocIds : undefined,
            selectedSources: context.selectedSources.length > 0 ? context.selectedSources : undefined,
          }),
        }).catch(() => { /* background — ignore errors */ });
      } catch { /* fire and forget */ }

      router.push(route('/dashboard'));
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsCreating(false);
    }
  }, [form, context, router, route, addSituation, firebaseUser]);

  if (user?.isDemo) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10">
            <Globe className="h-6 w-6 text-gold-600" />
          </div>
          <h2 className="text-lg font-semibold text-navy-900">Sign in to Create Situations</h2>
          <p className="mt-2 text-sm text-navy-500">Creating real situations requires a TACITUS account. Demo mode uses the pre-built Nordalia Crisis scenario.</p>
          <button onClick={() => router.push(route('/dashboard'))} className="mt-6 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gold-600 shadow-md shadow-gold-500/20">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">New Situation</h1>
        <p className="mt-1 text-sm text-navy-500">Create a conflict or geopolitical situation for intelligence tracking and analysis.</p>
      </div>

      <StepIndicator current={step} />

      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 sm:p-8">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }}>
            {step === 1 && <StepDescribe form={form} setForm={setForm} onNext={goNext} />}
            {step === 2 && <StepActors form={form} setForm={setForm} onNext={goNext} onBack={goBack} />}
            {step === 3 && <StepSources context={context} setContext={setContext} onNext={goNext} onBack={goBack} situationName={form.name} />}
            {step === 4 && <StepReview form={form} onBack={goBack} onCreate={handleCreate} isCreating={isCreating} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-[11px] text-navy-400">
        Situations are stored securely in your TACITUS workspace. You can edit details and run AI analysis at any time.
      </p>
    </div>
  );
}
