'use client';

import { useState } from 'react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useSituationStore } from '@/stores/situation-store';
import { useToolData } from '@/hooks/useToolData';
import { FileText, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, List } from 'lucide-react';

interface PolicyOption {
  option: string;
  pros: string[];
  cons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  resourceImplications: string;
}

interface Lesson {
  lesson: string;
  fromSituation: 'a' | 'b';
  applicableTo: string;
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
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high: 'text-red-600 bg-red-50 border-red-200',
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

export default function PolicyMemoPage() {
  const hasSituation = useSituationGuard();
  const situation = useSituationStore((s) => s.activeSituation);
  const { data: savedMemo } = useToolData<PolicyMemoData>('policy_memo');

  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [memo, setMemo] = useState<PolicyMemoData | null>(savedMemo || null);
  const [error, setError] = useState('');

  if (!hasSituation) return <NoSituationState />;

  async function handleGenerate() {
    if (!situation) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ai/policy-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id, policyQuestion: question }),
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
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-diplomatic-blue" />
          Policy Memorandum
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          AI-drafted UN DPPA-format policy memos with options analysis and implementation roadmap.
        </p>
      </div>

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
        </div>
      )}
    </div>
  );
}
