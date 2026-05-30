'use client';

import { Check, Code2, FileJson, Rocket, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CapsuleJsonMonacoEditor } from '@/components/capsules/CapsuleJsonMonacoEditor';
import { CapsuleLivePreview } from '@/components/capsules/CapsuleLivePreview';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import type { ContextCapsule } from '@/types/context-capsule';

type BuilderStepId = 'job' | 'sources' | 'output' | 'tools' | 'eval' | 'publish';

const STEPS: Array<{ id: BuilderStepId; label: string; helper: string }> = [
  { id: 'job', label: 'Job', helper: 'Plain-language purpose, domain, and frameworks.' },
  { id: 'sources', label: 'Sources', helper: 'Grounding posture, domains, recency, and minimum evidence.' },
  { id: 'output', label: 'Output', helper: 'Deliverable format and schema ordering.' },
  { id: 'tools', label: 'Tools', helper: 'How PRAXIS should use sourceability and research tools.' },
  { id: 'eval', label: 'Test & evaluate', helper: 'Sample questions and a dry-run quality gate.' },
  { id: 'publish', label: 'Publish', helper: 'Visibility, pricing, and immutable publish.' },
];

const DOMAIN_OPTIONS = [
  'generic',
  'armed-conflict-security',
  'diplomacy-negotiation',
  'humanitarian',
  'human-rights',
  'governance-rule-of-law',
  'economic-sanctions',
  'development-stabilization',
  'climate-environmental-security',
  'information-cyber',
  'transnational-threats',
];

const TOOL_OPTIONS = ['sourceability', 'deep_research', 'source-scout', 'policy_memo'];

type SaveState = 'idle' | 'saving' | 'saved' | 'publishing' | 'published' | 'error';
type CapsulePatch = DeepPartial<ContextCapsule>;
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export function CapsuleBuilderWizard() {
  const guard = useSituationGuard();
  const [activeStep, setActiveStep] = useState<BuilderStepId>('job');
  const [advanced, setAdvanced] = useState(false);
  const [savedCapsuleId, setSavedCapsuleId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [evalSummary, setEvalSummary] = useState<string | null>(null);
  const [job, setJob] = useState('Help analysts produce a sourced policy briefing with explicit uncertainty and next evidence gaps.');
  const [frameworks, setFrameworks] = useState('ach, stakeholder-salience');
  const [allowedDomains, setAllowedDomains] = useState('un.org, reliefweb.int');
  const [blockedDomains, setBlockedDomains] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['sourceability', 'deep_research']);
  const [sampleQuestions, setSampleQuestions] = useState('What changed this week?\nWhich claims need corroboration?');
  const [capsule, setCapsule] = useState<ContextCapsule>(() => makeDraftCapsule({
    job,
    frameworks,
    allowedDomains,
    blockedDomains,
    selectedTools,
  }));

  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);
  const capsuleJson = useMemo(() => JSON.stringify(capsule, null, 2), [capsule]);

  function patchCapsule(next: CapsulePatch) {
    setCapsule((current) => deepMerge(current, next) as ContextCapsule);
  }

  async function runAssist(action: 'persona' | 'output-schema' | 'sources' | 'few-shot') {
    setMessage(`Drafting ${action} suggestions...`);
    const response = await fetch(`/api/capsules/assist/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job,
        domain: capsule.persona.domain,
        outputFormat: capsule.output.format,
        capsule,
        situationId: guard.isDemo ? undefined : guard.situation?.id,
        forceRun: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Assist failed.');
      return;
    }
    if (payload.patch) patchCapsule(payload.patch);
    setMessage(payload.summary ?? 'Suggestions applied.');
  }

  async function saveDraft(): Promise<string | null> {
    setSaveState('saving');
    setMessage('Saving draft capsule...');
    const response = await fetch('/api/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: capsule.id, capsule }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setSaveState('error');
      setMessage(payload.detail ?? payload.error ?? 'Save failed.');
      return null;
    }
    const id = payload.capsule?.id as string;
    setSavedCapsuleId(id);
    setSaveState('saved');
    setMessage('Draft saved.');
    return id;
  }

  async function publish() {
    const id = savedCapsuleId ?? await saveDraft();
    if (!id) return;
    setSaveState('publishing');
    setMessage('Publishing capsule...');
    const response = await fetch(`/api/capsules/${encodeURIComponent(id)}/publish`, { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      setSaveState('error');
      setMessage(payload.detail ?? payload.error ?? 'Publish failed.');
      return;
    }
    setSaveState('published');
    setMessage('Capsule published and frozen as an immutable version.');
  }

  async function runDryRunEval() {
    setMessage('Running dry-run eval...');
    const samples = sampleQuestions
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8)
      .map((prompt, index) => ({
        prompt,
        output: {
          judgment: `Dry-run answer for: ${prompt}`,
          evidence: ['builder-source'],
          openQuestions: ['What source would change this assessment?'],
        },
        claims: [{
          id: `sample-${index + 1}`,
          text: prompt,
          sourceIds: ['builder-source'],
        }],
      }));
    const response = await fetch('/api/capsules/eval/dry-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule,
        samples,
        sourceSnippets: [{
          id: 'builder-source',
          text: [capsule.persona.systemFrame, capsule.sourcing.allowedDomains.join(' ')].join(' '),
        }],
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setSaveState('error');
      setMessage(payload.error ?? 'Dry-run eval failed.');
      return;
    }
    if (payload.patch) patchCapsule(payload.patch);
    const scores = payload.scores ?? {};
    setEvalSummary(`Faithfulness ${pct(scores.faithfulness)}, citations ${pct(scores.citationCoverage)}, schema ${pct(scores.schemaConformance)}.`);
    setMessage(payload.passed ? 'Dry-run eval passed. Publish gate is ready.' : `Dry-run eval found gaps: ${(payload.failures ?? []).join(', ')}`);
  }

  function applyJson(value: string) {
    try {
      const parsed = JSON.parse(value) as ContextCapsule;
      setCapsule(parsed);
      setMessage('');
    } catch {
      setMessage('Advanced JSON has a syntax issue. Live preview shows the exact problem.');
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="space-y-2">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            className={`w-full border px-4 py-3 text-left transition ${
              step.id === activeStep
                ? 'border-[#24211b] bg-[#24211b] text-white'
                : 'border-[#d8d1c5] bg-transparent text-[#4f483f] hover:border-[#9d9486]'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{step.label}</span>
                <span className={`mt-1 block text-xs ${step.id === activeStep ? 'text-[#ddd6c9]' : 'text-[#786f62]'}`}>
                  {step.helper}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#d8d1c5] bg-[#fffdf8] p-4">
          <div>
            <p className="text-sm font-semibold text-[#24211b]">
              {STEPS[activeIndex]?.label}
            </p>
            <p className="text-sm text-[#6f675c]">
              {guard.showGuard ? 'Finish onboarding or open a situation to attach this capsule to live work.' : 'Guided builder is ready.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium text-[#24211b] hover:bg-[#24211b] hover:text-white"
          >
            {advanced ? <FileJson className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            {advanced ? 'Guided wizard' : 'Advanced JSON'}
          </button>
        </div>

        {advanced ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <CapsuleJsonMonacoEditor value={capsuleJson} onChange={applyJson} />
            <CapsuleLivePreview json={capsuleJson} />
          </div>
        ) : (
          <div className="border border-[#d8d1c5] bg-[#fffdf8] p-5">
            {activeStep === 'job' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  What should this capsule do?
                  <textarea
                    value={job}
                    onChange={(event) => {
                      setJob(event.target.value);
                      patchCapsule({ persona: { systemFrame: event.target.value } });
                    }}
                    className="mt-2 min-h-28 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Domain
                    <select
                      value={capsule.persona.domain}
                      onChange={(event) => patchCapsule({
                        persona: { domain: event.target.value, systemFrame: capsule.persona.systemFrame },
                        market: { category: event.target.value },
                      })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {DOMAIN_OPTIONS.map((domain) => <option key={domain}>{domain}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Frameworks
                    <input
                      value={frameworks}
                      onChange={(event) => {
                        setFrameworks(event.target.value);
                        patchCapsule({ persona: { frameworks: csv(event.target.value), systemFrame: capsule.persona.systemFrame } });
                      }}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    />
                  </label>
                </div>
                <button type="button" onClick={() => runAssist('persona')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Improve persona
                </button>
              </div>
            )}

            {activeStep === 'sources' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm font-medium">
                    Sourcing mode
                    <select
                      value={capsule.sourcing.mode}
                      onChange={(event) => patchCapsule({
                        sourcing: { mode: event.target.value as ContextCapsule['sourcing']['mode'] },
                        retrieval: { mode: event.target.value as ContextCapsule['retrieval']['mode'] },
                      })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {['live-search', 'corpus', 'skc', 'hybrid'].map((mode) => <option key={mode}>{mode}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Min sources per claim
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={capsule.sourcing.minSourcesPerClaim}
                      onChange={(event) => patchCapsule({ sourcing: { minSourcesPerClaim: Number(event.target.value) } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Recency window days
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={capsule.sourcing.recencyWindowDays ?? 90}
                      onChange={(event) => patchCapsule({ sourcing: { recencyWindowDays: Number(event.target.value) } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Allowed domains
                  <input
                    value={allowedDomains}
                    onChange={(event) => {
                      setAllowedDomains(event.target.value);
                      patchCapsule({ sourcing: { allowedDomains: csv(event.target.value) } });
                    }}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Blocked domains
                  <input
                    value={blockedDomains}
                    onChange={(event) => {
                      setBlockedDomains(event.target.value);
                      patchCapsule({ sourcing: { blockedDomains: csv(event.target.value) } });
                    }}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <button type="button" onClick={() => runAssist('sources')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Suggest sources
                </button>
              </div>
            )}

            {activeStep === 'output' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Deliverable shape
                  <select
                    value={capsule.output.format}
                    onChange={(event) => patchCapsule({ output: outputFor(event.target.value as ContextCapsule['output']['format']) })}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  >
                    {['brief', 'markdown', 'report', 'json'].map((format) => <option key={format}>{format}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => runAssist('output-schema')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> Tighten output schema
                </button>
              </div>
            )}

            {activeStep === 'tools' && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <label key={tool} className="flex items-center gap-3 border border-[#d8d1c5] p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? Array.from(new Set([...selectedTools, tool]))
                            : selectedTools.filter((item) => item !== tool);
                          setSelectedTools(next);
                          patchCapsule({ tools: { recommended: next } });
                        }}
                      />
                      {tool}
                    </label>
                  ))}
                </div>
                <label className="block text-sm font-medium">
                  Tool policy
                  <select
                    value={capsule.tools.policy}
                    onChange={(event) => patchCapsule({ tools: { policy: event.target.value as ContextCapsule['tools']['policy'] } })}
                    className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  >
                    {['suggest', 'manual', 'auto'].map((policy) => <option key={policy}>{policy}</option>)}
                  </select>
                </label>
              </div>
            )}

            {activeStep === 'eval' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Sample questions
                  <textarea
                    value={sampleQuestions}
                    onChange={(event) => setSampleQuestions(event.target.value)}
                    className="mt-2 min-h-32 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void runDryRunEval()}
                    className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium"
                  >
                    <Check className="h-4 w-4" /> Run dry-run eval
                  </button>
                  <button type="button" onClick={() => runAssist('few-shot')} className="inline-flex items-center gap-2 border border-[#24211b] px-3 py-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4" /> Generate few-shot examples
                  </button>
                </div>
                {evalSummary ? <p className="text-sm text-[#6f675c]">{evalSummary}</p> : null}
              </div>
            )}

            {activeStep === 'publish' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Visibility
                    <select
                      value={capsule.market.visibility}
                      onChange={(event) => patchCapsule({ market: { visibility: event.target.value as ContextCapsule['market']['visibility'] } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {['private', 'org', 'unlisted', 'public'].map((visibility) => <option key={visibility}>{visibility}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Pricing
                    <select
                      value={capsule.market.pricing}
                      onChange={(event) => patchCapsule({ market: { pricing: event.target.value as ContextCapsule['market']['pricing'] } })}
                      className="mt-2 w-full border border-[#cfc6b8] bg-white p-3 text-sm"
                    >
                      {['free', 'credits', 'subscription'].map((pricing) => <option key={pricing}>{pricing}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => void saveDraft()} className="inline-flex items-center gap-2 border border-[#24211b] px-4 py-2 text-sm font-semibold">
                    <FileJson className="h-4 w-4" /> Save draft
                  </button>
                  <button type="button" onClick={() => void publish()} className="inline-flex items-center gap-2 bg-[#24211b] px-4 py-2 text-sm font-semibold text-white">
                    <Rocket className="h-4 w-4" /> Publish capsule
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {message && (
          <p className={`border px-4 py-3 text-sm ${
            saveState === 'error' ? 'border-[#b65d45] bg-[#fff4ef] text-[#8a3d2c]' : 'border-[#d8d1c5] bg-[#fffdf8] text-[#4f483f]'
          }`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) return overlay;
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value;
  }
  return merged;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function makeDraftCapsule(input: {
  job: string;
  frameworks: string;
  allowedDomains: string;
  blockedDomains: string;
  selectedTools: string[];
}): ContextCapsule {
  const now = new Date().toISOString();
  return {
    id: 'new-policy-capsule',
    schemaVersion: 'capsule/v2',
    version: '0.1.0',
    contentHash: 'sha256:pending',
    status: 'draft',
    immutable: false,
    mergeStrategy: 'prototype',
    persona: {
      analystProfile: {},
      systemFrame: input.job,
      domain: 'generic',
      frameworks: csv(input.frameworks),
      fewShot: [],
    },
    output: outputFor('brief'),
    sourcing: {
      mode: 'hybrid',
      minSourcesPerClaim: 1,
      allowedDomains: csv(input.allowedDomains),
      blockedDomains: csv(input.blockedDomains),
      recencyWindowDays: 90,
      requiredSourceTypes: ['official', 'expert-analysis'],
      citationStyle: 'inline',
    },
    retrieval: {
      mode: 'hybrid',
      corpora: [],
      graphExpansionDepth: 1,
      topK: 8,
      trustRank: 'balanced',
    },
    tools: { bound: [], recommended: input.selectedTools, policy: 'suggest' },
    guardrails: {
      refusalPolicy: 'Mark unsupported claims as gaps and avoid definitive policy judgments without evidence.',
      blockedTopics: [],
      piiHandling: 'redact',
      citationRequired: true,
      maxUngroundedClaims: 1,
      safetySettings: [],
    },
    eval: {
      goldenSetRef: 'builder/manual-dry-run',
      thresholds: {
        faithfulness: 0.8,
        citationCoverage: 0.8,
        contextRecall: 0.7,
        schemaConformance: 0.95,
        redTeamPassRate: 0.95,
        safetyScore: 0.95,
      },
      metrics: ['faithfulness', 'context_recall'],
      judge: 'gemini-2.5-flash',
    },
    provenance: { author: { uid: 'pending' }, createdAt: now },
    market: {
      visibility: 'private',
      pricing: 'free',
      category: 'generic',
      tags: ['builder-draft'],
      installs: 0,
      rating: 0,
    },
  };
}

function outputFor(format: ContextCapsule['output']['format']): ContextCapsule['output'] {
  const schema = {
    type: 'object',
    properties: {
      judgment: { type: 'string' },
      evidence: { type: 'array', items: { type: 'string' } },
      options: { type: 'array', items: { type: 'string' } },
      openQuestions: { type: 'array', items: { type: 'string' } },
    },
    required: ['judgment', 'evidence', 'openQuestions'],
  };
  return {
    format,
    responseJsonSchema: schema,
    propertyOrdering: ['judgment', 'evidence', 'options', 'openQuestions'],
    zodRef: format === 'json' ? 'CapsuleStructuredOutput' : undefined,
    renderTemplate: format === 'report' || format === 'markdown'
      ? '# Judgment\n{{judgment}}\n\n## Evidence\n{{evidence}}\n\n## Options\n{{options}}\n\n## Open questions\n{{openQuestions}}'
      : undefined,
  };
}

function csv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function pct(value: unknown): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'n/a';
}
