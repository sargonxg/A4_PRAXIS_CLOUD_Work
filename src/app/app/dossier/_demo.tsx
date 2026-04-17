'use client';

/**
 * Dossier demo / real-mode content component.
 * Extracted from page.tsx to keep the page file under 300 LOC.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FileText,
  ChevronDown,
  Loader2,
  Check,
  FileDown,
  Share2,
  ArrowLeft,
  Lock,
  Users,
  Globe,
  Scale,
  BookOpen,
  BarChart2,
  Plus,
  X,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Copy,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { CASE_REGISTRY } from '@/lib/constants/case-registry';
import {
  DOSSIER_TYPES,
  DOSSIER_SECTIONS,
  GENERATION_STEPS,
  DEMO_DOSSIER_CONTENT,
} from '@/lib/constants/dossier-templates';
import type { DossierType, DossierSection } from '@/lib/constants/dossier-templates';
import type { Situation } from '@/types/situation';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'configure' | 'generating' | 'view';

interface CustomSection {
  id: string;
  name: string;
  isCustom: true;
}

type SectionEntry = DossierSection | CustomSection;

interface WordLimitConfig {
  [sectionId: string]: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CASE_OPTIONS = Object.entries(CASE_REGISTRY).map(([id, c]) => ({
  id,
  name: c.meta.name,
}));

const CLASSIFICATION_OPTIONS = [
  { value: 'UNCLASSIFIED',         color: 'bg-green-100 text-green-800 border-green-300'  },
  { value: 'RESTRICTED',           color: 'bg-blue-100 text-blue-800 border-blue-300'     },
  { value: 'CONFIDENTIAL',         color: 'bg-amber-100 text-amber-800 border-amber-300'  },
  { value: 'STRICTLY CONFIDENTIAL',color: 'bg-red-100 text-red-800 border-red-300'        },
] as const;

const AUDIENCE_OPTIONS = [
  'Security Council',
  'General Assembly',
  'SG Office',
  'Mediation Team',
  'Country Team',
  'Custom',
];

const SOURCE_BADGE_COLORS: Record<string, string> = {
  ARGUS:     'bg-emerald-500/10 text-emerald-700',
  PRAXIS:    'bg-blue-500/10 text-blue-700',
  CONCORDIA: 'bg-violet-500/10 text-violet-700',
  DIALECTICA:'bg-cyan-500/10 text-cyan-700',
};

const WORD_LIMIT_OPTIONS = [500, 1000, 2000];

// ── Dossier Templates ─────────────────────────────────────────────────────────

interface DossierTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  sections: string[];
  accentColor: string;
}

const DOSSIER_TEMPLATES: DossierTemplate[] = [
  {
    id: 'actor-dossier',
    name: 'Actor Dossier',
    description: 'Deep-dive on a single actor: background, leadership, capabilities, interests, leverage, and vulnerabilities.',
    icon: <Users className="h-5 w-5" />,
    sections: ['exec-summary', 'actor-profiles', 'power-dynamics', 'interest-mapping', 'batna-zopa', 'recommended-actions'],
    accentColor: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  {
    id: 'situation-dossier',
    name: 'Situation Dossier',
    description: 'Overview, conflict dynamics, key players, timeline, humanitarian situation, and outlook.',
    icon: <Globe className="h-5 w-5" />,
    sections: ['exec-summary', 'conflict-timeline', 'actor-profiles', 'escalation-assessment', 'risk-scenarios', 'recommended-actions'],
    accentColor: 'border-teal-200 bg-teal-50 text-teal-700',
  },
  {
    id: 'negotiation-brief',
    name: 'Negotiation Brief',
    description: 'Parties, positions, interests, ZOPA, BATNA, and concrete negotiation recommendations.',
    icon: <Scale className="h-5 w-5" />,
    sections: ['exec-summary', 'actor-profiles', 'interest-mapping', 'batna-zopa', 'recommended-actions'],
    accentColor: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    id: 'intelligence-summary',
    name: 'Intelligence Summary',
    description: 'Key developments, actor movements, risk assessment, and identified intelligence gaps.',
    icon: <BarChart2 className="h-5 w-5" />,
    sections: ['exec-summary', 'conflict-timeline', 'escalation-assessment', 'media-landscape', 'sanctions-overview', 'risk-scenarios'],
    accentColor: 'border-red-200 bg-red-50 text-red-700',
  },
];

// ── Section order helper ──────────────────────────────────────────────────────

function moveSectionOrder(order: string[], id: string, dir: 'up' | 'down'): string[] {
  const idx = order.indexOf(id);
  if (idx === -1) return order;
  const next = [...order];
  if (dir === 'up' && idx > 0) {
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  } else if (dir === 'down' && idx < next.length - 1) {
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  }
  return next;
}

// ── Configure Step ────────────────────────────────────────────────────────────

function ConfigureStep({
  onGenerate,
  fixedCaseId,
  fixedCaseName,
}: {
  onGenerate: (config: {
    caseId: string;
    type: DossierType;
    sections: string[];
    classification: string;
    audience: string;
    wordLimits: WordLimitConfig;
  }) => void;
  fixedCaseId?: string;
  fixedCaseName?: string;
}) {
  const [selectedCase, setSelectedCase] = useState(fixedCaseId ?? '');
  const [selectedType, setSelectedType] = useState<DossierType | null>(null);
  const [checkedSections, setCheckedSections] = useState<Set<string>>(new Set());
  const [sectionOrder, setSectionOrder] = useState<string[]>(DOSSIER_SECTIONS.map((s) => s.id));
  const [wordLimits, setWordLimits] = useState<WordLimitConfig>({});
  const [customSections, setCustomSections] = useState<{ id: string; name: string }[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [classification, setClassification] = useState('UNCLASSIFIED');
  const [audience, setAudience] = useState('Security Council');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  function handleSelectType(type: DossierType) {
    setSelectedType(type);
    setCheckedSections(new Set(type.defaultSections));
    setSelectedTemplateId(null);
  }

  function handleSelectTemplate(tpl: DossierTemplate) {
    setSelectedTemplateId(tpl.id);
    setCheckedSections(new Set(tpl.sections));
    const matched = DOSSIER_TYPES.find((t) => t.defaultSections.some((s) => tpl.sections.includes(s))) || DOSSIER_TYPES[0];
    setSelectedType(matched);
  }

  function toggleSection(id: string) {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCustomSection() {
    const name = newSectionName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    setCustomSections((p) => [...p, { id, name }]);
    setSectionOrder((p) => [...p, id]);
    setCheckedSections((p) => new Set([...p, id]));
    setNewSectionName('');
  }

  function removeCustomSection(id: string) {
    setCustomSections((p) => p.filter((s) => s.id !== id));
    setSectionOrder((p) => p.filter((s) => s !== id));
    setCheckedSections((p) => { const n = new Set(p); n.delete(id); return n; });
  }

  const allSectionEntries: SectionEntry[] = useMemo(() => {
    const base = DOSSIER_SECTIONS.filter((s) => sectionOrder.includes(s.id));
    const custom: CustomSection[] = customSections.map((c) => ({ ...c, isCustom: true as const }));
    const allById: Record<string, SectionEntry> = {};
    for (const s of base) allById[s.id] = s;
    for (const s of custom) allById[s.id] = s;
    return sectionOrder.map((id) => allById[id]).filter(Boolean);
  }, [sectionOrder, customSections]);

  const orderedChecked = useMemo(
    () => sectionOrder.filter((id) => checkedSections.has(id)),
    [sectionOrder, checkedSections],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Template picker */}
      <div>
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-navy-400">
          Quick Templates
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOSSIER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm',
                selectedTemplateId === tpl.id
                  ? cn(tpl.accentColor, 'ring-2 ring-offset-1 ring-diplomatic-blue/30')
                  : 'border-[var(--color-app-border)] bg-white hover:border-diplomatic-blue/30',
              )}
            >
              <div className={cn(
                'shrink-0 rounded-lg p-2',
                selectedTemplateId === tpl.id ? 'bg-white/60' : 'bg-navy-100 text-navy-500',
              )}>
                {tpl.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-900">{tpl.name}</p>
                <p className="mt-0.5 text-[11px] text-navy-500 leading-relaxed">{tpl.description}</p>
                <p className="mt-1.5 text-[10px] text-navy-400">{tpl.sections.length} sections auto-selected</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Case Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-400">
          Case
        </label>
        {fixedCaseName ? (
          <div className="rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2.5 text-sm font-medium text-navy-900">
            {fixedCaseName}
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2.5 pl-3 pr-8 text-sm text-navy-800 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
            >
              <option value="">Select a case...</option>
              {CASE_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          </div>
        )}
      </div>

      {/* Dossier Type */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-navy-400">
          Dossier Type
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DOSSIER_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelectType(type)}
              className={cn(
                'rounded-lg border p-3 text-left transition-all',
                selectedType?.id === type.id && !selectedTemplateId
                  ? 'border-diplomatic-blue ring-2 ring-diplomatic-blue/20'
                  : 'border-[var(--color-app-border)] hover:border-diplomatic-blue/30',
              )}
            >
              <p className="text-sm font-semibold text-navy-900">{type.name}</p>
              <p className="mt-0.5 text-[11px] text-navy-500">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section Builder with reorder + word limits */}
      {selectedType && (
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-navy-400">
            Section Builder ({orderedChecked.length} selected)
          </label>

          <div className="space-y-2 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
            {allSectionEntries.map((sec, idx) => {
              const isChecked = checkedSections.has(sec.id);
              const isFirst = idx === 0;
              const isLast = idx === allSectionEntries.length - 1;
              const isCustom = 'isCustom' in sec;

              return (
                <div
                  key={sec.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition-colors',
                    isChecked ? 'border-diplomatic-blue/20' : 'border-[var(--color-app-border)] opacity-60',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSection(sec.id)}
                    className="h-3.5 w-3.5 rounded border-navy-300 text-diplomatic-blue focus:ring-diplomatic-blue/20 shrink-0"
                  />
                  <span className="flex-1 text-[12px] text-navy-700 font-medium">{sec.name}</span>
                  {isCustom && (
                    <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-700">
                      Custom
                    </span>
                  )}
                  <select
                    value={wordLimits[sec.id] ?? 1000}
                    onChange={(e) => setWordLimits((p) => ({ ...p, [sec.id]: Number(e.target.value) }))}
                    className="shrink-0 appearance-none rounded border border-[var(--color-app-border)] bg-white px-2 py-1 text-[11px] text-navy-600 focus:outline-none"
                  >
                    {WORD_LIMIT_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}w</option>
                    ))}
                  </select>
                  <div className="flex shrink-0 flex-col">
                    <button
                      onClick={() => setSectionOrder((p) => moveSectionOrder(p, sec.id, 'up'))}
                      disabled={isFirst}
                      className="rounded p-0.5 text-navy-300 hover:text-navy-600 disabled:opacity-20"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setSectionOrder((p) => moveSectionOrder(p, sec.id, 'down'))}
                      disabled={isLast}
                      className="rounded p-0.5 text-navy-300 hover:text-navy-600 disabled:opacity-20"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>
                  {isCustom && (
                    <button
                      onClick={() => removeCustomSection(sec.id)}
                      className="shrink-0 rounded p-0.5 text-red-300 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add custom section */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Custom section name..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSection(); } }}
              className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 placeholder-navy-300 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
            />
            <button
              onClick={addCustomSection}
              disabled={!newSectionName.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 px-3 py-2 text-[12px] font-medium text-diplomatic-blue hover:bg-diplomatic-blue/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </button>
          </div>
        </div>
      )}

      {/* Classification */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-navy-400">
          Classification
        </label>
        <div className="flex flex-wrap gap-2">
          {CLASSIFICATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setClassification(opt.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-bold transition-all',
                classification === opt.value
                  ? cn(opt.color, 'ring-2 ring-offset-1')
                  : 'border-[var(--color-app-border)] bg-white text-navy-500',
              )}
            >
              {opt.value}
            </button>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-400">
          Target Audience
        </label>
        <div className="relative">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2.5 pl-3 pr-8 text-sm text-navy-800 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
          >
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() =>
          selectedCase && selectedType &&
          onGenerate({
            caseId: selectedCase,
            type: selectedType,
            sections: orderedChecked,
            classification,
            audience,
            wordLimits,
          })
        }
        disabled={!selectedCase || !selectedType || orderedChecked.length === 0}
        className="w-full rounded-lg bg-diplomatic-blue py-3 text-sm font-semibold text-white transition-colors hover:bg-diplomatic-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate Dossier
      </button>
    </div>
  );
}

// ── Generating Step ───────────────────────────────────────────────────────────

interface AiSection {
  title: string;
  content: string;
  sources: string[];
  confidence: number;
}

function GeneratingStep({ onComplete, situation, config }: {
  onComplete: (aiSections?: AiSection[]) => void;
  situation?: Situation;
  config?: { caseId: string; sections: string[]; type: DossierType; classification: string; audience: string };
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (situation && config && !completedRef.current) {
      completedRef.current = true;
      (async () => {
        try {
          const res = await fetch('/api/ai/dossier-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              situation,
              situationId: situation.id,
              caseId: situation.id,
              sections: config.sections,
              dossierType: config.type?.name ?? 'Situation Dossier',
              classification: config.classification,
              audience: config.audience,
            }),
          });
          if (res.ok) {
            const data = await res.json() as { sections?: AiSection[] };
            onComplete(data.sections);
          } else {
            onComplete(undefined);
          }
        } catch {
          onComplete(undefined);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (situation) return;
    if (currentStep >= GENERATION_STEPS.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        const timer = setTimeout(() => onComplete(undefined), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, GENERATION_STEPS[currentStep].duration);
    return () => clearTimeout(timer);
  }, [currentStep, onComplete, situation]);

  const progress = Math.round((currentStep / GENERATION_STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8">
        <h2 className="text-center font-serif text-lg text-navy-900">Generating Intelligence Dossier</h2>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-navy-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-diplomatic-blue transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {GENERATION_STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                  isActive && 'bg-[var(--color-app-surface-alt)]',
                  isDone && 'opacity-60',
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-diplomatic-blue" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-navy-200" />
                )}
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', SOURCE_BADGE_COLORS[step.source])}>
                  {step.source}
                </span>
                <span className="text-[12px] text-navy-700">{step.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Classification Ribbon ─────────────────────────────────────────────────────

function ClassificationRibbon({ value }: { value: string }) {
  const opt = CLASSIFICATION_OPTIONS.find((o) => o.value === value) ?? CLASSIFICATION_OPTIONS[0];
  return (
    <div className={cn(
      'flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-bold tracking-widest uppercase',
      opt.color,
    )}>
      <Lock className="h-3 w-3" />
      {value}
      <Lock className="h-3 w-3" />
    </div>
  );
}

// ── Sources Panel ─────────────────────────────────────────────────────────────

const SOURCE_NOTES: { source: string; sections: string[]; note: string }[] = [
  { source: 'ARGUS Knowledge Graph', sections: ['actor-profiles', 'power-dynamics', 'conflict-timeline'], note: 'Entity relationships, actor attributes, and historical event data' },
  { source: 'PRAXIS Conflict Grammar', sections: ['escalation-assessment', 'interest-mapping', 'batna-zopa'], note: 'Glasl escalation model, Fisher-Ury interest analysis, ZOPA/BATNA calculations' },
  { source: 'CONCORDIA Mediation Engine', sections: ['recommended-actions', 'batna-zopa', 'interest-mapping'], note: 'Negotiation strategy recommendations and BATNA projections' },
  { source: 'DIALECTICA Open-Source Intelligence', sections: ['media-landscape', 'sanctions-overview', 'risk-scenarios'], note: 'Media monitoring, sanctions registry cross-reference, scenario modelling' },
  { source: 'UN Open Data', sections: ['exec-summary', 'appendices'], note: 'UNSC resolutions, mission reports, and humanitarian data' },
];

function SourcesPanel({ sections }: { sections: string[] }) {
  const [open, setOpen] = useState(false);

  const relevantSources = SOURCE_NOTES.filter((s) =>
    s.sections.some((sec) => sections.includes(sec)),
  );

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-navy-400" />
          <span className="text-sm font-semibold text-navy-700">Sources Used</span>
          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-600">
            {relevantSources.length}
          </span>
        </div>
        <ChevronRight className={cn('h-4 w-4 text-navy-400 transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="border-t border-[var(--color-app-border)] px-6 py-4 space-y-3">
          {relevantSources.map((s) => {
            const usedIn = s.sections
              .filter((sec) => sections.includes(sec))
              .map((sec) => {
                const found = DOSSIER_SECTIONS.find((ds) => ds.id === sec);
                return found?.name ?? sec;
              });
            return (
              <div key={s.source} className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-diplomatic-blue" />
                <div>
                  <p className="text-[12px] font-semibold text-navy-800">{s.source}</p>
                  <p className="text-[11px] text-navy-500">
                    Used for: {usedIn.join(', ')} — {s.note}
                  </p>
                </div>
              </div>
            );
          })}
          <p className="mt-2 text-[10px] text-navy-400 italic">
            All intelligence is synthesized by the PRAXIS AI engine. Outputs should be reviewed by qualified analysts before operational use.
          </p>
        </div>
      )}
    </div>
  );
}

// ── View Step ─────────────────────────────────────────────────────────────────

function ViewStep({
  config,
  onReset,
  aiSections,
}: {
  config: {
    caseId: string;
    type: DossierType;
    sections: string[];
    classification: string;
    audience: string;
    wordLimits?: WordLimitConfig;
  };
  onReset: () => void;
  aiSections?: AiSection[];
}) {
  const [copied, setCopied] = useState(false);
  const caseName = CASE_REGISTRY[config.caseId]?.meta.name || config.caseId;
  const classOption = CLASSIFICATION_OPTIONS.find((o) => o.value === config.classification);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const todayIso = new Date().toISOString().slice(0, 10);

  const sectionDetails = useMemo(
    () => DOSSIER_SECTIONS.filter((s) => config.sections.includes(s.id)),
    [config.sections],
  );

  const confidenceScores = useMemo(
    () => Object.fromEntries(sectionDetails.map((s, i) => [s.id, 72 + ((i * 7 + 3) % 25)])),
    [sectionDetails],
  );

  function buildMarkdown(): string {
    const lines: string[] = [
      '---',
      `title: "${config.type.name}: ${caseName}"`,
      `date: ${todayIso}`,
      `classification: ${config.classification}`,
      `audience: ${config.audience}`,
      `situation: ${config.caseId}`,
      '---',
      '',
      `# ${config.type.name}: ${caseName}`,
      '',
      `**Generated:** ${today}  `,
      `**Audience:** ${config.audience}  `,
      `**Classification:** ${config.classification}`,
      '',
      '---',
      '',
    ];

    sectionDetails.forEach((sec, i) => {
      const content = DEMO_DOSSIER_CONTENT[sec.id] || 'Content generation pending...';
      lines.push(`## ${i + 1}. ${sec.name}`, '', content, '', '---', '');
    });

    lines.push('', '*Compiled by PRAXIS Intelligence Engine — TACITUS*', '');
    return lines.join('\n');
  }

  function handleDownloadMarkdown() {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `praxis-dossier-${config.caseId}-${todayIso}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyToClipboard() {
    const md = buildMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="dossier" />
      <ClassificationRibbon value={config.classification} />

      {/* Header */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl text-navy-900">
              {config.type.name}: {caseName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-navy-500">
              <span>Generated: {today}</span>
              <span>Audience: {config.audience}</span>
              <span>{sectionDetails.length} sections</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold',
              classOption?.color,
            )}>
              <Lock className="h-2.5 w-2.5" />
              {config.classification}
            </span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mt-5 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Table of Contents
          </h3>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {sectionDetails.map((sec, i) => (
              <a
                key={sec.id}
                href={`#dossier-${sec.id}`}
                className="text-[12px] text-diplomatic-blue hover:underline"
              >
                {i + 1}. {sec.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      {aiSections && aiSections.length > 0
        ? aiSections.map((sec, i) => (
          <div key={i} id={`dossier-ai-${i}`} className="rounded-xl border border-[var(--color-app-border)] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-navy-900">{i + 1}. {sec.title}</h2>
              <span className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                sec.confidence >= 0.85 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700',
              )}>
                {Math.round(sec.confidence * 100)}%
              </span>
            </div>
            <div className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-navy-700">{sec.content}</div>
            {sec.sources?.length > 0 && (
              <div className="mt-4 border-t border-navy-100 pt-3 text-[11px] text-navy-400">
                <span className="font-semibold">Sources: </span>{sec.sources.join(' · ')}
              </div>
            )}
          </div>
        ))
        : sectionDetails.map((sec, i) => {
          const content = DEMO_DOSSIER_CONTENT[sec.id] || 'Content generation pending...';
          const confidence = confidenceScores[sec.id] || 82;

          const sectionSource =
            sec.id.includes('interest') || sec.id.includes('batna')
              ? 'CONCORDIA'
              : sec.id.includes('media') || sec.id.includes('actor') || sec.id.includes('sanctions')
                ? 'ARGUS'
                : 'PRAXIS';

          return (
            <div
              key={sec.id}
              id={`dossier-${sec.id}`}
              className="rounded-xl border border-[var(--color-app-border)] bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg text-navy-900">
                  {i + 1}. {sec.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                    SOURCE_BADGE_COLORS[sectionSource],
                  )}>
                    {sectionSource}
                  </span>
                  <span className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    confidence >= 85
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700',
                  )}>
                    {confidence}%
                  </span>
                </div>
              </div>
              <div className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-navy-700">
                {content}
              </div>
            </div>
          );
        })}

      <SourcesPanel sections={config.sections} />

      {/* Export row */}
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-[var(--color-app-border)] bg-white px-6 py-4">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[12px] font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Generate New Dossier
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
          >
            <FileDown className="h-3.5 w-3.5" /> Download Markdown
          </button>
          <button
            onClick={handleCopyToClipboard}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors',
              copied
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-[var(--color-app-border)] bg-white text-navy-600 hover:bg-navy-50',
            )}
          >
            {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={() => alert('Available in production deployment')}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
          >
            <FileText className="h-3.5 w-3.5" /> Export DOCX
          </button>
          <button
            onClick={() => alert('Available in production deployment')}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
          >
            <Share2 className="h-3.5 w-3.5" /> Share Link
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 py-2">
        <EcosystemBadge product="ARGUS" size="sm" />
        <EcosystemBadge product="CONCORDIA" size="sm" />
        <span className="text-[10px] text-navy-400">
          Dossier compiled by PRAXIS Intelligence Engine
        </span>
      </div>
    </div>
  );
}

// ── DemoDossierPage ───────────────────────────────────────────────────────────

export function DemoDossierPage({ situation }: { situation?: Situation }) {
  const [step, setStep] = useState<Step>('configure');
  const [config, setConfig] = useState<{
    caseId: string;
    type: DossierType;
    sections: string[];
    classification: string;
    audience: string;
    wordLimits?: WordLimitConfig;
  } | null>(null);
  const [aiSections, setAiSections] = useState<AiSection[] | undefined>(undefined);

  const handleGenerate = useCallback((cfg: NonNullable<typeof config>) => {
    setConfig(cfg);
    setStep('generating');
  }, []);

  const handleGenerationComplete = useCallback((sections?: AiSection[]) => {
    if (sections) setAiSections(sections);
    setStep('view');
  }, []);

  const handleReset = useCallback(() => {
    setConfig(null);
    setAiSections(undefined);
    setStep('configure');
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-navy-900">Dossier Generator</h1>
        <p className="mt-1 text-sm text-navy-500">
          Generate comprehensive AI intelligence dossiers powered by ARGUS knowledge graph and
          Conflict Grammar ontology
        </p>
      </div>

      {step === 'configure' && (
        <ConfigureStep
          onGenerate={handleGenerate}
          fixedCaseId={situation?.id}
          fixedCaseName={situation?.name}
        />
      )}
      {step === 'generating' && (
        <GeneratingStep
          onComplete={handleGenerationComplete}
          situation={situation}
          config={config ?? undefined}
        />
      )}
      {step === 'view' && config && (
        <ViewStep config={config} onReset={handleReset} aiSections={aiSections} />
      )}
      <PoweredByTacitus />
    </div>
  );
}
