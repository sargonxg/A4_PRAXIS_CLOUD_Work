'use client';

import { useEffect, useState } from 'react';
import { CircleHelp, Loader2, Plus } from 'lucide-react';
import { SurfaceQuestionList, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import type { SurfaceQuestion } from '@/lib/workbench/surface-state';
import type { OpenQuestion } from '@/types/open-questions';

interface OpenQuestionsPanelProps {
  caseId: string;
  fallbackQuestions: SurfaceQuestion[];
}

export function OpenQuestionsPanel({ caseId, fallbackQuestions }: OpenQuestionsPanelProps) {
  const [questions, setQuestions] = useState<OpenQuestion[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Derived questions shown until owner-scoped questions are added.');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cases/${caseId}/open-questions?status=open`)
      .then((response) => response.ok ? response.json() : { questions: [] })
      .then((data: { questions?: OpenQuestion[] }) => {
        if (!cancelled) setQuestions(data.questions ?? []);
      })
      .catch(() => {
        if (!cancelled) setStatus('Open-question API unavailable; showing derived case questions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function addQuestion() {
    const question = draft.trim();
    if (question.length < 5) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/open-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, category: 'scope-question' }),
      });
      const data = await response.json();
      if (response.ok && data.question) {
        setQuestions((current) => [data.question, ...current]);
        setDraft('');
        setStatus('Open question saved to the owner-scoped case workspace.');
      } else {
        setStatus(data.error ?? 'Could not save this question.');
      }
    } catch {
      setStatus('Could not save this question. The derived questions remain available.');
    } finally {
      setLoading(false);
    }
  }

  const renderedQuestions: SurfaceQuestion[] = questions.length > 0
    ? questions.map((question) => ({
      id: question.id,
      title: question.question,
      detail: question.notes ?? `Status: ${question.status}. Category: ${question.category}.`,
      owner: 'User',
      severity: 'medium',
    }))
    : fallbackQuestions;

  return (
    <SurfaceSection eyebrow="Open questions" title="Board">
      <div className="space-y-3">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 h-4 w-4 text-gold-700" />
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Add question</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="What would change the recommendation?"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-navy-950 placeholder:text-slate-600 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100"
                />
                <button
                  type="button"
                  onClick={() => void addQuestion()}
                  disabled={loading || draft.trim().length < 5}
                  className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-700">{status}</p>
            </div>
          </div>
        </div>
        <SurfaceQuestionList questions={renderedQuestions} />
      </div>
    </SurfaceSection>
  );
}
