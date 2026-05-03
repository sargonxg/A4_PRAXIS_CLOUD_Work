'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useToolData } from '@/hooks/useToolData';
import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { ToolOutputFrame } from '@/components/praxis/tool-output-frame';
import { WorkProductEditor, type WorkDocumentSection } from '@/components/documents/work-product-editor';
import { FileText, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, List } from 'lucide-react';
import type { Situation } from '@/types/situation';
import {
  isSyriaWorkspaceCase,
  SYRIA_DEMO_POLICY_MEMO,
  SYRIA_DEMO_SITUATION,
} from '@/lib/constants/syria-demo-case';

interface PolicyOption {
  option: string;
  pros: string[];
  cons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  resourceImplications: string;
  levelOneAnalysis?: string;
  levelTwoAnalysis?: string;
  winSet?: string;
}

interface DraftingAudit {
  confidenceNote: string;
  limits: string[];
  followUpResearch: string[];
  sourceUse: Array<{ source: string; claim: string; confidence: 'high' | 'medium' | 'low' }>;
}

interface PolicyMemoData {
  classification: string;
  to: string;
  from: string;
  subject: string;
  executiveSummary: string;
  problemStatement: string;
  contextAndBackground: string;
  policyOptions: PolicyOption[];
  recommendation: string;
  implementationSteps: string[];
  monitoringIndicators: string[];
  risks: string;
  citations?: string[];
  draftingAudit?: DraftingAudit;
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high: 'text-red-600 bg-red-50 border-red-200',
};

const DEMO_POLICY_SITUATION: Situation = {
  id: DEMO_CONFLICT.id,
  name: DEMO_CONFLICT.name,
  type: 'international',
  description: DEMO_CONFLICT.description,
  region: DEMO_CONFLICT.region,
  actors: DEMO_CONFLICT.actors.slice(0, 12).map((actor) => actor.name),
  userRole: 'advisor',
  status: DEMO_CONFLICT.status,
  riskScore: Math.round(DEMO_CONFLICT.riskScore * 10),
  glaslStage: DEMO_CONFLICT.glaslStage,
  escalationTrend: DEMO_CONFLICT.escalationTrend,
  actorCount: DEMO_CONFLICT.actors.length,
  graphEntities:
    DEMO_CONFLICT.actors.length +
    DEMO_CONFLICT.relationships.length +
    DEMO_CONFLICT.events.length +
    DEMO_CONFLICT.claims.length +
    DEMO_CONFLICT.interests.length +
    DEMO_CONFLICT.constraints.length,
  documentCount: 0,
  contextNotes: [
    'Demo policy context: disputed 2024 elections, DRM insurgency, contested Belara mining revenues, UN-AU mediation, RECONA sanctions, humanitarian access limits, and external rivalry between Karovia and Westmark.',
    `Recent event base: ${DEMO_CONFLICT.events.slice(-5).map((event) => `${event.date}: ${event.description}`).join(' ')}`,
  ].join('\n\n'),
  createdAt: DEMO_CONFLICT.startDate,
  updatedAt: DEMO_CONFLICT.lastUpdated,
};

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--color-app-border)] rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-navy-50/50 text-sm font-semibold text-navy-800 hover:bg-navy-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

function deriveMemoConfidence(memo: PolicyMemoData): 'high' | 'medium' | 'low' | 'unknown' {
  const levels = memo.draftingAudit?.sourceUse?.map((source) => source.confidence) ?? [];
  if (levels.includes('low')) return 'low';
  if (levels.includes('medium')) return 'medium';
  if (levels.includes('high')) return 'high';
  return memo.draftingAudit?.confidenceNote ? 'medium' : 'unknown';
}

function memoSources(memo: PolicyMemoData): string[] {
  return Array.from(new Set([
    ...(memo.draftingAudit?.sourceUse?.map((source) => source.source) ?? []),
    ...(memo.citations ?? []),
  ].filter(Boolean)));
}

function memoToWorkSections(memo: PolicyMemoData): WorkDocumentSection[] {
  const options = (memo.policyOptions || [])
    .map((opt, index) => [
      `Option ${index + 1}: ${opt.option}`,
      `Risk: ${opt.riskLevel.toUpperCase()}`,
      `Pros: ${(opt.pros || []).join('; ')}`,
      `Cons: ${(opt.cons || []).join('; ')}`,
      `Resource implications: ${opt.resourceImplications}`,
      opt.levelOneAnalysis ? `Level I: ${opt.levelOneAnalysis}` : '',
      opt.levelTwoAnalysis ? `Level II: ${opt.levelTwoAnalysis}` : '',
      opt.winSet ? `Win-set: ${opt.winSet}` : '',
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  return [
    { id: 'memo-executive-summary', heading: 'Executive Summary', body: memo.executiveSummary },
    { id: 'memo-problem', heading: 'Problem Statement', body: memo.problemStatement },
    { id: 'memo-context', heading: 'Context and Background', body: memo.contextAndBackground },
    { id: 'memo-options', heading: 'Policy Options', body: options },
    { id: 'memo-recommendation', heading: 'Recommendation', body: memo.recommendation },
    { id: 'memo-implementation', heading: 'Implementation Steps', body: (memo.implementationSteps || []).map((step) => `- ${step}`).join('\n') },
    { id: 'memo-monitoring', heading: 'Monitoring Indicators', body: (memo.monitoringIndicators || []).map((indicator) => `- ${indicator}`).join('\n') },
    { id: 'memo-risks', heading: 'Risk Assessment', body: memo.risks },
    {
      id: 'memo-source-audit',
      heading: 'Sources, Confidence, and Follow-up',
      body: [
        memo.draftingAudit?.confidenceNote,
        ...(memo.draftingAudit?.limits ?? []).map((item) => `Limit: ${item}`),
        ...(memo.draftingAudit?.followUpResearch ?? []).map((item) => `Follow-up: ${item}`),
      ].filter(Boolean).join('\n'),
    },
  ].filter((section) => section.body?.trim());
}

export default function PolicyMemoPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const searchParams = useSearchParams();
  const { data: savedMemo } = useToolData<PolicyMemoData>('policy_memo');
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), isDemo);

  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [memo, setMemo] = useState<PolicyMemoData | null>(
    savedMemo || (isDemo && isSyriaCase ? (SYRIA_DEMO_POLICY_MEMO as PolicyMemoData) : null)
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (savedMemo && !memo && !generating) setMemo(savedMemo);
    if (!savedMemo && !memo && !generating && isDemo && isSyriaCase) {
      setMemo(SYRIA_DEMO_POLICY_MEMO as PolicyMemoData);
      setQuestion('What posture should leadership adopt on the northeast integration agreement under humanitarian and spillover pressure?');
    }
  }, [savedMemo, memo, generating, isDemo, isSyriaCase]);

  if (showGuard) return <NoSituationState />;

  async function handleGenerate() {
    if (isDemo && isSyriaCase) {
      setMemo(SYRIA_DEMO_POLICY_MEMO as PolicyMemoData);
      setQuestion((current) => current || 'What posture should leadership adopt on the northeast integration agreement under humanitarian and spillover pressure?');
      return;
    }

    const requestSituation = situation ?? (isDemo ? DEMO_POLICY_SITUATION : null);
    if (!requestSituation) {
      setError('Create or select a situation before drafting a policy memo.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ai/policy-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: requestSituation.id, situation: requestSituation, policyQuestion: question }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setMemo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-diplomatic-blue" />
          Policy Memorandum
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          AI-drafted UN DPPA-format policy memos with editable DOCX-ready work products and implementation roadmap.
        </p>
      </div>

      <RegistryToolInfo toolId="policy-memo" />

      {/* Input */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-4">
        <label className="block text-sm font-medium text-navy-700">
          Policy Question <span className="text-navy-400 font-normal">(optional — leave blank for comprehensive options analysis)</span>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="e.g., What should be the UN's response to the recent ceasefire collapse?"
          className="w-full rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-bg)] px-3 py-2 text-sm text-navy-700 placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/40 resize-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-5 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {generating ? 'Drafting Memo…' : memo ? 'Regenerate' : 'Draft Policy Memo'} · 4 credits
        </button>
      </div>

      {/* Memo output */}
      {memo && (
        <div className="space-y-5">
          <WorkProductEditor
            productType="Policy Memo"
            title={`Policy Memo: ${memo.subject}`}
            situationName={(isSyriaCase ? SYRIA_DEMO_SITUATION : situation ?? DEMO_POLICY_SITUATION).name}
            storageKey={`praxis-policy-memo-${isSyriaCase ? 'syria' : situation?.id ?? DEMO_POLICY_SITUATION.id}`}
            initialSections={memoToWorkSections(memo)}
            sources={memoSources(memo)}
            classification={memo.classification}
          />
          <ToolOutputFrame
            toolId="policy-memo"
            confidence={deriveMemoConfidence(memo)}
            primarySources={memoSources(memo)}
            sourceCount={memoSources(memo).length}
            frameworks={['Putnam Two-Level Games', 'UN DPPA Report Standards', 'Diplomatic Drafting Contract']}
            calibratedTo={memo.to || 'Policy audience'}
          >
          <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 bg-red-50 px-2 py-0.5 rounded">
                {memo.classification}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-navy-600 mb-4">
              <div><span className="font-semibold">TO:</span> {memo.to}</div>
              <div><span className="font-semibold">FROM:</span> {memo.from}</div>
            </div>
            <h2 className="text-base font-semibold text-navy-900">RE: {memo.subject}</h2>
          </div>

          <Section title="Executive Summary">
            <p className="text-sm text-navy-700 leading-relaxed">{memo.executiveSummary}</p>
          </Section>

          <Section title="Problem Statement">
            <p className="text-sm text-navy-700 leading-relaxed">{memo.problemStatement}</p>
          </Section>

          <Section title="Context & Background" defaultOpen={false}>
            <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">{memo.contextAndBackground}</p>
          </Section>

          <Section title="Policy Options">
            <div className="space-y-4">
              {(memo.policyOptions || []).map((opt, i) => (
                <div key={i} className="rounded-lg border border-[var(--color-app-border)] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-navy-800">Option {i + 1}: {opt.option}</h3>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${RISK_COLORS[opt.riskLevel]}`}>
                      {opt.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">Advantages</p>
                      <ul className="space-y-0.5">
                        {(opt.pros || []).map((p, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-navy-600">
                            <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-1">Drawbacks</p>
                      <ul className="space-y-0.5">
                        {(opt.cons || []).map((c, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-navy-600">
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-navy-500 italic">{opt.resourceImplications}</p>
                  {(opt.levelOneAnalysis || opt.levelTwoAnalysis || opt.winSet) && (
                    <div className="mt-3 grid gap-2 text-xs text-navy-600 md:grid-cols-3">
                      {opt.levelOneAnalysis && (
                        <div className="rounded-md bg-navy-50/60 p-2">
                          <p className="font-semibold text-navy-800">Level I</p>
                          <p className="mt-1">{opt.levelOneAnalysis}</p>
                        </div>
                      )}
                      {opt.levelTwoAnalysis && (
                        <div className="rounded-md bg-navy-50/60 p-2">
                          <p className="font-semibold text-navy-800">Level II</p>
                          <p className="mt-1">{opt.levelTwoAnalysis}</p>
                        </div>
                      )}
                      {opt.winSet && (
                        <div className="rounded-md bg-navy-50/60 p-2">
                          <p className="font-semibold text-navy-800">Win-set</p>
                          <p className="mt-1">{opt.winSet}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Recommendation">
            <p className="text-sm text-navy-700 leading-relaxed">{memo.recommendation}</p>
          </Section>

          <Section title="Implementation Steps">
            <ol className="space-y-2">
              {(memo.implementationSteps || []).map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-navy-700">
                  <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-diplomatic-blue/10 text-diplomatic-blue text-[10px] font-bold mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Monitoring Indicators" defaultOpen={false}>
            <ul className="space-y-1.5">
              {(memo.monitoringIndicators || []).map((ind, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                  <List className="h-3.5 w-3.5 text-navy-400 mt-0.5 shrink-0" />
                  {ind}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Risk Assessment" defaultOpen={false}>
            <p className="text-sm text-navy-700 leading-relaxed">{memo.risks}</p>
          </Section>

          {(memo.draftingAudit || memo.citations?.length) && (
            <Section title="Sources, Confidence & Gaps" defaultOpen={false}>
              {memo.draftingAudit?.confidenceNote && (
                <p className="mb-3 text-sm text-navy-700 leading-relaxed">{memo.draftingAudit.confidenceNote}</p>
              )}
              {memo.draftingAudit?.sourceUse?.length ? (
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Source Use</p>
                  {memo.draftingAudit.sourceUse.map((source, i) => (
                    <div key={`${source.source}-${i}`} className="rounded-md border border-[var(--color-app-border)] bg-navy-50/40 p-2 text-xs text-navy-600">
                      <span className="font-semibold text-navy-800">{source.source}</span>
                      <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-navy-500">{source.confidence}</span>
                      <p className="mt-1">{source.claim}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {memo.draftingAudit?.limits?.length ? (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Limits</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-navy-600">
                    {memo.draftingAudit.limits.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
              {memo.draftingAudit?.followUpResearch?.length ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Follow-up Research</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-navy-600">
                    {memo.draftingAudit.followUpResearch.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
            </Section>
          )}
          </div>
          </ToolOutputFrame>
        </div>
      )}
    </div>
  );
}
