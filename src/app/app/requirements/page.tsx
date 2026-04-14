'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  MinusCircle,
  XCircle,
  Flag,
  Brain,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Confidence = 'high' | 'medium' | 'low' | 'insufficient_data';

interface PIR {
  id: string;
  question: string;
  category: string;
  priority: Priority;
  createdAt: string;
  answer?: string;
  confidence?: Confidence;
  lastAnsweredAt?: string;
}

interface PIRAnswer {
  pirId: string;
  question: string;
  answer: string;
  confidence: Confidence;
  evidenceBasis: string[];
  keyGaps: string[];
  collectionPriorities: string[];
}

// ---------------------------------------------------------------------------
// Priority + Confidence configs
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  high:     { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  medium:   { label: 'Medium',   color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  low:      { label: 'Low',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; icon: React.ElementType; color: string }> = {
  high:             { label: 'High Confidence',      icon: CheckCircle2, color: 'text-emerald-600' },
  medium:           { label: 'Medium Confidence',    icon: MinusCircle,  color: 'text-amber-600' },
  low:              { label: 'Low Confidence',       icon: AlertCircle,  color: 'text-orange-600' },
  insufficient_data:{ label: 'Insufficient Data',    icon: HelpCircle,   color: 'text-navy-400' },
};

const CATEGORIES = [
  'general', 'military', 'political', 'humanitarian', 'economic', 'diplomatic', 'informational',
];

const SUGGESTED_PIRS = [
  { question: 'What is the current military balance between the primary parties?', category: 'military', priority: 'high' as Priority },
  { question: 'What are the key actors\' red lines and non-negotiable positions?', category: 'political', priority: 'critical' as Priority },
  { question: 'What external actors are providing material support to each party?', category: 'diplomatic', priority: 'high' as Priority },
  { question: 'What is the current humanitarian access situation and key blocked corridors?', category: 'humanitarian', priority: 'high' as Priority },
  { question: 'What are the economic drivers sustaining the conflict for each party?', category: 'economic', priority: 'medium' as Priority },
];

// ---------------------------------------------------------------------------
// PIR Card
// ---------------------------------------------------------------------------

function PIRCard({
  pir,
  answer,
  onDelete,
  onToggle,
  expanded,
}: {
  pir: PIR;
  answer?: PIRAnswer;
  onDelete: () => void;
  onToggle: () => void;
  expanded: boolean;
}) {
  const pc = PRIORITY_CONFIG[pir.priority];
  const conf = (answer?.confidence || pir.confidence);
  const cc = conf ? CONFIDENCE_CONFIG[conf] : null;

  return (
    <div className={cn('rounded-xl border bg-white transition-shadow hover:shadow-sm', pc.bg)}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className={cn(
              'mt-0.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0',
              pc.bg, pc.color
            )}>
              {pc.label}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-900">{pir.question}</p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-navy-400">
                <span className="capitalize">{pir.category}</span>
                {pir.lastAnsweredAt && (
                  <span>Answered {new Date(pir.lastAnsweredAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {cc && (
              <span className={cn('flex items-center gap-1 text-[11px] font-medium', cc.color)}>
                <cc.icon className="h-3.5 w-3.5" />
                {cc.label}
              </span>
            )}
            {(answer || pir.answer) && (
              <button
                onClick={onToggle}
                className="rounded-md border border-navy-200 bg-white p-1.5 text-navy-400 hover:text-navy-600 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              onClick={onDelete}
              className="rounded-md border border-navy-200 bg-white p-1.5 text-navy-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {expanded && (answer || pir.answer) && (
          <div className="mt-4 space-y-3 border-t border-current/20 pt-4">
            <p className="text-sm text-navy-800 leading-relaxed">
              {answer?.answer || pir.answer}
            </p>

            {answer && (
              <div className="grid grid-cols-2 gap-3">
                {answer.evidenceBasis.length > 0 && (
                  <div className="rounded-lg bg-white/70 border border-current/20 p-3">
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-2">Evidence Basis</h6>
                    <ul className="space-y-1">
                      {answer.evidenceBasis.map((e, i) => (
                        <li key={i} className="text-[11px] text-navy-600 flex items-start gap-1.5">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-50" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {answer.keyGaps.length > 0 && (
                  <div className="rounded-lg bg-white/70 border border-current/20 p-3">
                    <h6 className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-2">Key Gaps</h6>
                    <ul className="space-y-1">
                      {answer.keyGaps.map((g, i) => (
                        <li key={i} className="text-[11px] text-navy-600 flex items-start gap-1.5">
                          <XCircle className="h-3 w-3 mt-0.5 shrink-0 text-red-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {answer && answer.collectionPriorities.length > 0 && (
              <div className="rounded-lg bg-white/70 border border-current/20 p-3">
                <h6 className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-2">Collection Priorities</h6>
                <ul className="space-y-1">
                  {answer.collectionPriorities.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-navy-700">
                      <span className="mt-0.5 h-4 w-4 rounded-full bg-diplomatic-blue/10 text-[9px] font-bold text-diplomatic-blue flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RequirementsPage() {
  const { showGuard, situation } = useSituationGuard();
  const [pirs, setPirs] = useState<PIR[]>([]);
  const [answers, setAnswers] = useState<Record<string, PIRAnswer>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [showAddForm, setShowAddForm] = useState(false);
  const [overallGap, setOverallGap] = useState<string | null>(null);

  const situationId = situation?.id;

  // Load PIRs
  const loadPirs = useCallback(async () => {
    if (!situationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/pir?situationId=${situationId}`);
      if (res.ok) {
        const data = await res.json();
        setPirs(data.pirs || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [situationId]);

  useEffect(() => { loadPirs(); }, [loadPirs]);

  const addPir = async () => {
    if (!newQuestion.trim() || !situationId) return;
    try {
      const res = await fetch('/api/ai/pir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          situationId,
          question: newQuestion.trim(),
          category: newCategory,
          priority: newPriority,
        }),
      });
      if (res.ok) {
        setNewQuestion('');
        setShowAddForm(false);
        await loadPirs();
      }
    } catch { /* ignore */ }
  };

  const deletePir = async (pirId: string) => {
    if (!situationId) return;
    try {
      await fetch('/api/ai/pir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', situationId, pirId }),
      });
      setPirs((prev) => prev.filter((p) => p.id !== pirId));
    } catch { /* ignore */ }
  };

  const addSuggestedPir = async (suggested: typeof SUGGESTED_PIRS[0]) => {
    if (!situationId) return;
    try {
      await fetch('/api/ai/pir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          situationId,
          question: suggested.question,
          category: suggested.category,
          priority: suggested.priority,
        }),
      });
      await loadPirs();
    } catch { /* ignore */ }
  };

  const answerAllPirs = async () => {
    if (!situationId || pirs.length === 0 || answering) return;
    setAnswering(true);
    try {
      const res = await fetch('/api/ai/pir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          situationId,
          situation,
          pirIds: pirs.map((p) => p.id),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newAnswers: Record<string, PIRAnswer> = {};
        for (const ans of (data.answers || [])) {
          newAnswers[ans.pirId] = ans;
        }
        setAnswers((prev) => ({ ...prev, ...newAnswers }));
        setOverallGap(data.overallIntelligenceGap || null);
        // Auto-expand all answered
        setExpandedIds(new Set(Object.keys(newAnswers)));
        // Reload to get persisted confidence
        await loadPirs();
      }
    } catch { /* ignore */ }
    finally { setAnswering(false); }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (showGuard) return <NoSituationState />;

  const unansweredCount = pirs.filter((p) => !p.answer && !answers[p.id]).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-5 w-5 text-diplomatic-blue" />
            <h1 className="text-xl font-bold text-navy-900" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
              Intelligence Requirements
            </h1>
          </div>
          <p className="text-sm text-navy-500">
            Priority Intelligence Requirements (PIRs) — define your analytical questions and let PRAXIS track answers.
          </p>
        </div>
        <RegistryToolInfo toolId="requirements" />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-navy-400" />
          <span className="text-sm font-semibold text-navy-700">{pirs.length}</span>
          <span className="text-sm text-navy-400">total PIRs</span>
        </div>
        <div className="h-4 w-px bg-navy-200" />
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-diplomatic-blue" />
          <span className="text-sm font-semibold text-navy-700">{pirs.length - unansweredCount}</span>
          <span className="text-sm text-navy-400">answered</span>
        </div>
        <div className="h-4 w-px bg-navy-200" />
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-navy-700">
            {pirs.filter((p) => p.priority === 'critical').length}
          </span>
          <span className="text-sm text-navy-400">critical</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {pirs.length > 0 && (
            <button
              onClick={answerAllPirs}
              disabled={answering}
              className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
            >
              {answering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {answering ? 'Answering…' : `Answer ${unansweredCount > 0 ? `${unansweredCount} ` : 'all '}PIRs`}
            </button>
          )}
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:border-naval/50 hover:text-diplomatic-blue transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add PIR
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border border-navy-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-navy-900">New Priority Intelligence Requirement</h3>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What is the intelligence question you need answered? (e.g., 'What is the current disposition of Party X's armed forces along the northern corridor?')"
            className="w-full rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/30 resize-none"
            rows={3}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-medium text-navy-600 shrink-0">Category:</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-sm text-navy-700 focus:border-diplomatic-blue focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-navy-600 shrink-0">Priority:</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-sm text-navy-700 focus:border-diplomatic-blue focus:outline-none"
              >
                {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                  <option key={p} value={p} className="capitalize">{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addPir}
              disabled={!newQuestion.trim()}
              className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-500 hover:text-navy-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Suggested PIRs — show when no PIRs exist */}
      {pirs.length === 0 && !loading && (
        <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-5">
          <h3 className="text-sm font-semibold text-navy-700 mb-3">Suggested PIRs for this situation</h3>
          <div className="space-y-2">
            {SUGGESTED_PIRS.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-navy-100 bg-white p-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                    PRIORITY_CONFIG[s.priority].bg,
                    PRIORITY_CONFIG[s.priority].color,
                  )}>
                    {s.priority}
                  </span>
                  <p className="text-sm text-navy-700">{s.question}</p>
                </div>
                <button
                  onClick={() => addSuggestedPir(s)}
                  className="shrink-0 ml-4 flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:border-diplomatic-blue/40 hover:text-diplomatic-blue transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-navy-300" />
        </div>
      )}

      {/* PIR list */}
      {!loading && pirs.length > 0 && (
        <div className="space-y-3">
          {pirs.map((pir) => (
            <PIRCard
              key={pir.id}
              pir={pir}
              answer={answers[pir.id]}
              onDelete={() => deletePir(pir.id)}
              onToggle={() => toggleExpanded(pir.id)}
              expanded={expandedIds.has(pir.id)}
            />
          ))}
        </div>
      )}

      {/* Overall intelligence gap */}
      {overallGap && (
        <div className="rounded-xl border border-navy-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-2">Overall Intelligence Gap Assessment</h3>
          <p className="text-sm text-navy-700 leading-relaxed">{overallGap}</p>
        </div>
      )}
    </div>
  );
}
