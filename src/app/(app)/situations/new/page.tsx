'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';

/* ---------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------*/

interface SituationForm {
  name: string;
  description: string;
  region: string;
  status: 'active' | 'monitoring' | 'emerging';
}

type Step = 1 | 2 | 3;

/* ---------------------------------------------------------------------------
 * Step indicator
 * -------------------------------------------------------------------------*/

const STEPS: { step: Step; label: string; icon: React.ElementType }[] = [
  { step: 1, label: 'Define', icon: FileText },
  { step: 2, label: 'Research', icon: Sparkles },
  { step: 3, label: 'Review & Create', icon: Check },
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
              <div
                className={cn(
                  'hidden sm:block h-px w-8 transition-colors',
                  isCompleted || isActive ? 'bg-gold-500' : 'bg-navy-200'
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  isActive
                    ? 'bg-gold-500 text-white shadow-md shadow-gold-500/25'
                    : isCompleted
                      ? 'bg-gold-500/20 text-gold-700'
                      : 'bg-navy-100 text-navy-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'hidden sm:inline text-xs font-medium transition-colors',
                  isActive
                    ? 'text-navy-900'
                    : isCompleted
                      ? 'text-navy-600'
                      : 'text-navy-400'
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Motion variants
 * -------------------------------------------------------------------------*/

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

/* ---------------------------------------------------------------------------
 * Step 1 — Define
 * -------------------------------------------------------------------------*/

function StepDefine({
  form,
  setForm,
  onNext,
}: {
  form: SituationForm;
  setForm: React.Dispatch<React.SetStateAction<SituationForm>>;
  onNext: () => void;
}) {
  const isValid = form.name.trim().length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">
          Define the Situation
        </h2>
        <p className="mt-1 text-sm text-navy-500">
          Describe the conflict or geopolitical situation you want to track and
          analyze.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
          <FileText className="h-3 w-3" />
          Situation Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Eastern Mediterranean Maritime Dispute"
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 transition-colors"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
          <FileText className="h-3 w-3" />
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Provide a brief overview of the situation, key dynamics, and why it requires monitoring..."
          rows={4}
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 transition-colors resize-none"
        />
      </div>

      {/* Region + Status row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
            <Globe className="h-3 w-3" />
            Region
          </label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            placeholder="e.g., Eastern Mediterranean"
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
            <FileText className="h-3 w-3" />
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as SituationForm['status'],
              }))
            }
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 transition-colors"
          >
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="emerging">Emerging</option>
          </select>
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!isValid}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
            isValid
              ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20 hover:shadow-lg hover:shadow-gold-500/30'
              : 'bg-navy-100 text-navy-400 cursor-not-allowed'
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Step 2 — Research (optional)
 * -------------------------------------------------------------------------*/

function StepResearch({
  form,
  onNext,
  onBack,
}: {
  form: SituationForm;
  onNext: () => void;
  onBack: () => void;
}) {
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [researchQuery, setResearchQuery] = useState(form.name);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState('');
  const [researchDone, setResearchDone] = useState(false);

  const doResearch = useCallback(async () => {
    if (!researchQuery.trim()) return;
    setIsResearching(true);
    setResearchResult('');
    setResearchDone(false);

    try {
      const res = await fetch('/api/ai/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: researchQuery,
          mode: 'background',
          depth: 'standard',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Research failed' }));
        setResearchResult(
          `Research unavailable: ${err.error || 'Service error'}. You can skip this step and research later.`
        );
        setResearchDone(true);
        setIsResearching(false);
        return;
      }

      // Stream the response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setResearchResult(fullText);
        }
      }

      setResearchDone(true);
    } catch {
      setResearchResult(
        'Research request failed. You can skip this step and add research later from the dashboard.'
      );
      setResearchDone(true);
    } finally {
      setIsResearching(false);
    }
  }, [researchQuery]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">
          AI Research
          <span className="ml-2 text-xs font-normal text-navy-400">
            Optional
          </span>
        </h2>
        <p className="mt-1 text-sm text-navy-500">
          Let TACITUS research this situation using live intelligence sources.
          You can also skip this and research later.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-app-border)] bg-navy-50/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-gold-600" />
          <div>
            <p className="text-sm font-medium text-navy-900">
              Let AI research this situation
            </p>
            <p className="text-xs text-navy-500">
              Uses Deep Research pipeline with Google Search grounding
            </p>
          </div>
        </div>
        <label className="relative cursor-pointer">
          <input
            type="checkbox"
            checked={researchEnabled}
            onChange={() => setResearchEnabled((v) => !v)}
            className="peer sr-only"
            disabled={isResearching}
          />
          <div
            className={cn(
              'h-5 w-9 rounded-full transition-colors',
              researchEnabled ? 'bg-gold-500' : 'bg-navy-200'
            )}
          />
          <div
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
              researchEnabled ? 'left-[18px]' : 'left-0.5'
            )}
          />
        </label>
      </div>

      {/* Research form */}
      <AnimatePresence mode="wait">
        {researchEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
                <Sparkles className="h-3 w-3" />
                Research Query
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="What should TACITUS research?"
                  disabled={isResearching}
                  className="flex-1 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={doResearch}
                  disabled={isResearching || !researchQuery.trim()}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all',
                    isResearching || !researchQuery.trim()
                      ? 'bg-navy-100 text-navy-400 cursor-not-allowed'
                      : 'bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90 shadow-md shadow-diplomatic-blue/20'
                  )}
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Research
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Research results */}
            {(researchResult || isResearching) && (
              <div className="rounded-lg border border-[var(--color-app-border)] bg-white">
                <div className="border-b border-[var(--color-app-border)] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {isResearching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-600" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-teal" />
                    )}
                    <span className="text-xs font-semibold text-navy-700">
                      {isResearching
                        ? 'Researching...'
                        : 'Research Complete'}
                    </span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-4">
                  <p className="whitespace-pre-wrap text-sm text-navy-700 leading-relaxed">
                    {researchResult}
                  </p>
                  {isResearching && !researchResult && (
                    <div className="flex items-center gap-2 text-sm text-navy-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gathering intelligence from multiple sources...
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isResearching}
          className="flex items-center gap-2 rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:border-navy-300 hover:bg-navy-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          {!researchDone && researchEnabled && (
            <button
              onClick={onNext}
              disabled={isResearching}
              className="text-sm font-medium text-navy-500 hover:text-navy-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          )}
          <button
            onClick={onNext}
            disabled={isResearching}
            className={cn(
              'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
              isResearching
                ? 'bg-navy-100 text-navy-400 cursor-not-allowed'
                : 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20 hover:shadow-lg hover:shadow-gold-500/30'
            )}
          >
            {researchDone ? 'Continue with Research' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Step 3 — Review & Create
 * -------------------------------------------------------------------------*/

function StepReview({
  form,
  onBack,
  onCreate,
  isCreating,
}: {
  form: SituationForm;
  onBack: () => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    monitoring: 'Monitoring',
    emerging: 'Emerging',
  };
  const statusColors: Record<string, string> = {
    active: 'bg-teal/10 text-teal',
    monitoring: 'bg-diplomatic-blue/10 text-diplomatic-blue',
    emerging: 'bg-gold-500/10 text-gold-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">
          Review & Create
        </h2>
        <p className="mt-1 text-sm text-navy-500">
          Confirm the details below and create your new situation.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-navy-50/30">
        <div className="border-b border-[var(--color-app-border)] px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900">
                {form.name}
              </h3>
              {form.region && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-navy-500">
                  <Globe className="h-3 w-3" />
                  {form.region}
                </div>
              )}
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                statusColors[form.status] || 'bg-navy-100 text-navy-500'
              )}
            >
              {statusLabels[form.status] || form.status}
            </span>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {form.description ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-1">
                Description
              </p>
              <p className="text-sm text-navy-700 leading-relaxed">
                {form.description}
              </p>
            </div>
          ) : (
            <p className="text-sm italic text-navy-400">
              No description provided. You can add one later from the dashboard.
            </p>
          )}

          {/* What gets created */}
          <div className="rounded-lg border border-navy-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-3">
              What will be created
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  label: 'Conflict Grammar Structure',
                  desc: '8 ACO entity categories initialized',
                },
                {
                  label: 'Intelligence Dashboard',
                  desc: 'Risk scoring & escalation tracking',
                },
                {
                  label: 'Research Pipeline',
                  desc: 'Deep research & media monitoring',
                },
                {
                  label: 'Analysis Workspace',
                  desc: 'Actor mapping, scenarios, reports',
                },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                  <div>
                    <p className="text-xs font-medium text-navy-800">
                      {label}
                    </p>
                    <p className="text-[10px] text-navy-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex items-center gap-2 rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:border-navy-300 hover:bg-navy-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onCreate}
          disabled={isCreating}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
            isCreating
              ? 'bg-gold-500/70 text-white cursor-not-allowed'
              : 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20 hover:shadow-lg hover:shadow-gold-500/30'
          )}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Situation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main page
 * -------------------------------------------------------------------------*/

export default function NewSituationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<SituationForm>({
    name: '',
    description: '',
    region: '',
    status: 'active',
  });

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3) as Step);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1) as Step);
  }, []);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          region: form.region,
          status: form.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(data.error || 'Failed to create situation');
        setIsCreating(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setIsCreating(false);
    }
  }, [form, router]);

  // Demo user guard
  if (user?.isDemo) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-8 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10">
            <Globe className="h-6 w-6 text-gold-600" />
          </div>
          <h2 className="text-lg font-semibold text-navy-900">
            Sign in to Create Situations
          </h2>
          <p className="mt-2 text-sm text-navy-500">
            Creating and managing real situations requires a TACITUS account.
            Demo mode uses the pre-built Nordalia Crisis scenario.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gold-600 transition-colors shadow-md shadow-gold-500/20"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">
          New Situation
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          Create a new conflict or geopolitical situation for intelligence
          tracking and analysis.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 sm:p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 1 && (
              <StepDefine form={form} setForm={setForm} onNext={goNext} />
            )}
            {step === 2 && (
              <StepResearch form={form} onNext={goNext} onBack={goBack} />
            )}
            {step === 3 && (
              <StepReview
                form={form}
                onBack={goBack}
                onCreate={handleCreate}
                isCreating={isCreating}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-navy-400">
        Situations are stored securely in your TACITUS workspace. You can edit
        details, add entities, and run research at any time from the dashboard.
      </p>
    </div>
  );
}
