'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  ChevronDown,
  Loader2,
  Check,
  FileDown,
  Share2,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import { CASE_REGISTRY } from '@/lib/constants/case-registry';
import {
  DOSSIER_TYPES,
  DOSSIER_SECTIONS,
  GENERATION_STEPS,
  DEMO_DOSSIER_CONTENT,
} from '@/lib/constants/dossier-templates';
import type { DossierType } from '@/lib/constants/dossier-templates';

type Step = 'configure' | 'generating' | 'view';

const CASE_OPTIONS = Object.entries(CASE_REGISTRY).map(([id, c]) => ({
  id,
  name: c.meta.name,
}));

const CLASSIFICATION_OPTIONS = [
  { value: 'UNCLASSIFIED', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'RESTRICTED', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'CONFIDENTIAL', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'STRICTLY CONFIDENTIAL', color: 'bg-red-100 text-red-800 border-red-300' },
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
  ARGUS: 'bg-emerald-500/10 text-emerald-700',
  PRAXIS: 'bg-blue-500/10 text-blue-700',
  CONCORDIA: 'bg-violet-500/10 text-violet-700',
  DIALECTICA: 'bg-cyan-500/10 text-cyan-700',
};

/* ── Configure Step ─────────────────────────────────────────────────── */

function ConfigureStep({
  onGenerate,
}: {
  onGenerate: (config: {
    caseId: string;
    type: DossierType;
    sections: string[];
    classification: string;
    audience: string;
  }) => void;
}) {
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedType, setSelectedType] = useState<DossierType | null>(null);
  const [checkedSections, setCheckedSections] = useState<Set<string>>(new Set());
  const [classification, setClassification] = useState('UNCLASSIFIED');
  const [audience, setAudience] = useState('Security Council');

  function handleSelectType(type: DossierType) {
    setSelectedType(type);
    setCheckedSections(new Set(type.defaultSections));
  }

  function toggleSection(id: string) {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Case Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-400">
          Case
        </label>
        <div className="relative">
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2.5 pl-3 pr-8 text-sm text-navy-800 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
          >
            <option value="">Select a case...</option>
            {CASE_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        </div>
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
                selectedType?.id === type.id
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

      {/* Sections */}
      {selectedType && (
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-navy-400">
            Sections ({checkedSections.size} selected)
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DOSSIER_SECTIONS.map((sec) => (
              <label
                key={sec.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors',
                  checkedSections.has(sec.id)
                    ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5 text-navy-800'
                    : 'border-[var(--color-app-border)] text-navy-500',
                )}
              >
                <input
                  type="checkbox"
                  checked={checkedSections.has(sec.id)}
                  onChange={() => toggleSection(sec.id)}
                  className="h-3.5 w-3.5 rounded border-navy-300 text-diplomatic-blue focus:ring-diplomatic-blue/20"
                />
                {sec.name}
              </label>
            ))}
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
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() =>
          selectedCase &&
          selectedType &&
          onGenerate({
            caseId: selectedCase,
            type: selectedType,
            sections: [...checkedSections],
            classification,
            audience,
          })
        }
        disabled={!selectedCase || !selectedType}
        className="w-full rounded-lg bg-diplomatic-blue py-3 text-sm font-semibold text-white transition-colors hover:bg-diplomatic-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate Dossier
      </button>
    </div>
  );
}

/* ── Generating Step ────────────────────────────────────────────────── */

function GeneratingStep({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (currentStep >= GENERATION_STEPS.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        const timer = setTimeout(onComplete, 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, GENERATION_STEPS[currentStep].duration);
    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const progress = Math.round((currentStep / GENERATION_STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8">
        <h2 className="text-center font-serif text-lg text-navy-900">Generating Intelligence Dossier</h2>

        {/* Progress bar */}
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

        {/* Steps */}
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
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                    SOURCE_BADGE_COLORS[step.source],
                  )}
                >
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

/* ── View Step ──────────────────────────────────────────────────────── */

function ViewStep({
  config,
  onReset,
}: {
  config: {
    caseId: string;
    type: DossierType;
    sections: string[];
    classification: string;
    audience: string;
  };
  onReset: () => void;
}) {
  const caseName =
    CASE_REGISTRY[config.caseId]?.meta.name || config.caseId;
  const classOption = CLASSIFICATION_OPTIONS.find(
    (o) => o.value === config.classification,
  );
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionDetails = useMemo(
    () =>
      DOSSIER_SECTIONS.filter((s) => config.sections.includes(s.id)),
    [config.sections],
  );

  // Generate stable confidence scores
  const confidenceScores = useMemo(
    () =>
      Object.fromEntries(
        sectionDetails.map((s, i) => [s.id, 72 + ((i * 7 + 3) % 25)]),
      ),
    [sectionDetails],
  );

  return (
    <div className="space-y-6">
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
            <span
              className={cn(
                'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                classOption?.color,
              )}
            >
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
      {sectionDetails.map((sec, i) => {
        const content = DEMO_DOSSIER_CONTENT[sec.id] || 'Content generation pending...';
        const confidence = confidenceScores[sec.id] || 82;

        // Assign source badge based on section type
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
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                    SOURCE_BADGE_COLORS[sectionSource],
                  )}
                >
                  {sectionSource}
                </span>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    confidence >= 85
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700',
                  )}
                >
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

      {/* Export row */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-app-border)] bg-white px-6 py-4">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[12px] font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Generate New Dossier
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => alert('Available in production deployment')}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
          >
            <FileDown className="h-3.5 w-3.5" /> Export PDF
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

/* ── Main Page ──────────────────────────────────────────────────────── */

export default function DossierPage() {
  const [step, setStep] = useState<Step>('configure');
  const [config, setConfig] = useState<{
    caseId: string;
    type: DossierType;
    sections: string[];
    classification: string;
    audience: string;
  } | null>(null);

  function handleGenerate(cfg: NonNullable<typeof config>) {
    setConfig(cfg);
    setStep('generating');
  }

  function handleGenerationComplete() {
    setStep('view');
  }

  function handleReset() {
    setConfig(null);
    setStep('configure');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-navy-900">Dossier Generator</h1>
        <p className="mt-1 text-sm text-navy-500">
          Generate comprehensive AI intelligence dossiers powered by ARGUS knowledge graph and
          Conflict Grammar ontology
        </p>
      </div>

      {step === 'configure' && <ConfigureStep onGenerate={handleGenerate} />}
      {step === 'generating' && (
        <GeneratingStep onComplete={handleGenerationComplete} />
      )}
      {step === 'view' && config && (
        <ViewStep config={config} onReset={handleReset} />
      )}
      <PoweredByTacitus />
    </div>
  );
}
