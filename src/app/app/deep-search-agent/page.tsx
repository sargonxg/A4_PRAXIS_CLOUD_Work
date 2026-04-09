'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Globe,
  BookOpen,
  Lightbulb,
  FileText,
  RotateCcw,
  Copy,
  Check,
  Telescope,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { useSituationStore } from '@/stores/situation-store';
import { useDebugStore } from '@/stores/debug-store';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
interface AgentEvent {
  type: 'status' | 'session' | 'planning' | 'research' | 'synthesis' | 'text' | 'error' | 'done';
  phase?: 'planning' | 'research' | 'synthesis';
  author?: string;
  text?: string;
  sessionId?: string;
}

interface ResearchEvent {
  id: number;
  phase: 'planning' | 'research' | 'synthesis';
  author?: string;
  text: string;
  ts: number;
}

type ResearchPhase = 'idle' | 'planning' | 'research' | 'synthesis' | 'done' | 'error';

const PHASE_LABELS: Record<ResearchPhase, string> = {
  idle: 'Ready',
  planning: 'Planning Research',
  research: 'Conducting Research',
  synthesis: 'Synthesizing Report',
  done: 'Complete',
  error: 'Error',
};

const PHASE_ICONS: Record<ResearchPhase, React.ComponentType<{ className?: string }>> = {
  idle: Search,
  planning: Brain,
  research: Globe,
  synthesis: FileText,
  done: CheckCircle2,
  error: AlertCircle,
};

const SUGGESTED_QUERIES = [
  'What are the current escalation dynamics and key triggers in this conflict?',
  'Analyze the main actors\' interests, leverage points, and negotiating positions',
  'What are the humanitarian impacts and protection concerns?',
  'What are the most recent developments and how do they shift the balance?',
  'What historical precedents or parallel conflicts are most instructive here?',
  'What are the key obstacles to a negotiated settlement?',
];

function PhaseStep({
  label,
  icon: Icon,
  active,
  done,
  step,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  done: boolean;
  step: number;
}) {
  return (
    <div className={cn('flex items-center gap-2', done || active ? '' : 'opacity-40')}>
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
        done
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : active
            ? 'border-diplomatic-blue bg-diplomatic-blue text-white'
            : 'border-navy-200 bg-white text-navy-400',
      )}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : step}
      </div>
      <span className={cn(
        'text-xs font-medium',
        done ? 'text-emerald-600' : active ? 'text-diplomatic-blue' : 'text-navy-400',
      )}>
        {label}
      </span>
    </div>
  );
}

function EventFeed({ events }: { events: ResearchEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0) return null;

  const PHASE_COLORS = {
    planning: 'text-purple-600 bg-purple-50 border-purple-200',
    research: 'text-blue-600 bg-blue-50 border-blue-200',
    synthesis: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  return (
    <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
      <div className="space-y-0">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="border-b border-[var(--color-app-border)] px-4 py-2.5 last:border-0"
          >
            <div className="flex items-start gap-2">
              <span className={cn(
                'mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                PHASE_COLORS[ev.phase],
              )}>
                {ev.author || ev.phase}
              </span>
              <p className="text-xs leading-relaxed text-navy-700">{ev.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

export default function DeepSearchAgentPage() {
  const { situation } = useSituationGuard();
  const { activeSituationId } = useSituationStore();
  const { log: debugLog } = useDebugStore();

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<ResearchPhase>('idle');
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [eventCounter, setEventCounter] = useState(0);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reportAccumulator = useRef('');

  const addEvent = useCallback((ev: Omit<ResearchEvent, 'id' | 'ts'>) => {
    setEventCounter((c) => {
      const id = c + 1;
      setEvents((prev) => [...prev.slice(-99), { ...ev, id, ts: Date.now() }]);
      return id;
    });
  }, []);

  const runResearch = useCallback(async () => {
    if (!query.trim() || phase === 'planning' || phase === 'research' || phase === 'synthesis') return;

    setPhase('planning');
    setEvents([]);
    setReport('');
    setError(null);
    reportAccumulator.current = '';

    const controller = new AbortController();
    abortRef.current = controller;
    const startTs = Date.now();

    const requestId = `dsa-${Date.now()}`;
    debugLog({
      id: requestId,
      type: 'request',
      tool: 'deep-search-agent',
      endpoint: '/api/ai/deep-search-agent',
      situation: situation?.name,
      message: query.slice(0, 80),
      ts: new Date().toISOString(),
    });

    try {
      const res = await fetch('/api/ai/deep-search-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          situationId: activeSituationId,
          sessionId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr) continue;

          let event: AgentEvent;
          try {
            event = JSON.parse(dataStr) as AgentEvent;
          } catch {
            continue;
          }

          if (event.type === 'session' && event.sessionId) {
            setSessionId(event.sessionId);
            continue;
          }

          if (event.type === 'done') {
            setPhase('done');
            setReport(reportAccumulator.current.trim());
            debugLog({
              id: requestId,
              type: 'success',
              tool: 'deep-search-agent',
              endpoint: '/api/ai/deep-search-agent',
              status: 200,
              elapsed: Math.round((Date.now() - startTs) / 1000),
              ts: new Date().toISOString(),
            });
            return;
          }

          if (event.type === 'error') {
            setError(event.text || 'Research agent error');
            setPhase('error');
            return;
          }

          if (event.type === 'status') {
            continue; // Internal status, skip display
          }

          const resolvedPhase: ResearchEvent['phase'] = event.phase || (
            event.type === 'planning' ? 'planning' :
            event.type === 'synthesis' ? 'synthesis' : 'research'
          );

          // Update overall phase indicator
          setPhase(resolvedPhase);

          // Accumulate synthesis text as the report
          if (resolvedPhase === 'synthesis' && event.text) {
            reportAccumulator.current += event.text;
            setReport(reportAccumulator.current);
          }

          // Add to event feed
          if (event.text?.trim()) {
            addEvent({
              phase: resolvedPhase,
              author: event.author,
              text: event.text.slice(0, 300),
            });
          }
        }
      }

      // Stream ended without done event
      if (reportAccumulator.current) {
        setPhase('done');
        setReport(reportAccumulator.current.trim());
      } else {
        setPhase('error');
        setError('Research completed but no report was generated.');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setPhase('error');
      debugLog({
        id: `dsa-err-${Date.now()}`,
        type: 'error',
        tool: 'deep-search-agent',
        endpoint: '/api/ai/deep-search-agent',
        error: message,
        elapsed: Math.round((Date.now() - startTs) / 1000),
        ts: new Date().toISOString(),
      });
    }
  }, [query, phase, situation, activeSituationId, sessionId, addEvent, debugLog]);

  const reset = () => {
    abortRef.current?.abort();
    setPhase('idle');
    setEvents([]);
    setReport('');
    setError(null);
    setSessionId(null);
    setQuery('');
    reportAccumulator.current = '';
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!situation) return <NoSituationState />;

  const isRunning = phase === 'planning' || phase === 'research' || phase === 'synthesis';
  const PhaseIcon = PHASE_ICONS[phase];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <RegistryToolInfo toolId="deep-search-agent" />
      {/* Header */}
      <div className="flex-none border-b border-[var(--color-app-border)] bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-diplomatic-blue/10">
              <Telescope className="h-5 w-5 text-diplomatic-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-navy-900">Deep Research Agent</h1>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  TACITUS ADK
                </span>
              </div>
              <p className="text-sm text-navy-500">
                Multi-agent deep research powered by Google ADK — planning, multi-source research, and synthesis
              </p>
            </div>
          </div>
          {(phase !== 'idle') && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-500 hover:text-navy-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Research
            </button>
          )}
        </div>

        {/* Situation context pill */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-navy-500">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Active: <strong className="text-navy-700">{situation.name}</strong></span>
          {situation.region && (
            <>
              <ChevronRight className="h-3 w-3 text-navy-300" />
              <span>{situation.region}</span>
            </>
          )}
          {situation.riskScore >= 7 && (
            <>
              <ChevronRight className="h-3 w-3 text-navy-300" />
              <span className="font-medium text-red-600">HIGH RISK</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — query + controls */}
        <div className={cn(
          'flex flex-col border-r border-[var(--color-app-border)] bg-white transition-all duration-300',
          phase === 'done' ? 'w-[360px]' : 'w-full max-w-2xl mx-auto',
        )}>
          <div className="flex-1 overflow-y-auto p-6">
            {/* Query input */}
            {(phase === 'idle' || phase === 'error') && (
              <>
                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What do you need to research about this conflict?"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 text-sm text-navy-900 placeholder-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        runResearch();
                      }
                    }}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-navy-400">
                    ⌘↵ to research
                  </div>
                </div>

                {error && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={runResearch}
                  disabled={!query.trim()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-diplomatic-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-diplomatic-blue/90 disabled:opacity-40"
                >
                  <Telescope className="h-4 w-4" />
                  Start Deep Research
                </button>

                {/* Suggested queries */}
                <div className="mt-6">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                    Suggested Research Topics
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED_QUERIES.map((sq) => (
                      <button
                        key={sq}
                        onClick={() => setQuery(sq)}
                        className="flex w-full items-start gap-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-left text-xs text-navy-600 transition-colors hover:border-diplomatic-blue/30 hover:bg-diplomatic-blue/5 hover:text-diplomatic-blue"
                      >
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Active research view */}
            {isRunning && (
              <div className="space-y-6">
                {/* Phase progress */}
                <div className="rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <PhaseIcon className="h-4 w-4 text-diplomatic-blue" />
                    <span className="text-sm font-semibold text-navy-800">{PHASE_LABELS[phase]}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <PhaseStep label="Planning" icon={Brain} step={1}
                      active={phase === 'planning'}
                      done={(['research', 'synthesis', 'done'] as ResearchPhase[]).includes(phase)} />
                    <div className="ml-3.5 h-4 w-0.5 bg-navy-100" />
                    <PhaseStep label="Research" icon={Globe} step={2}
                      active={phase === 'research'}
                      done={(['synthesis', 'done'] as ResearchPhase[]).includes(phase)} />
                    <div className="ml-3.5 h-4 w-0.5 bg-navy-100" />
                    <PhaseStep label="Synthesis" icon={FileText} step={3}
                      active={phase === 'synthesis'}
                      done={(['done'] as ResearchPhase[]).includes(phase)} />
                  </div>
                </div>

                {/* Query reminder */}
                <div className="rounded-lg border-l-4 border-diplomatic-blue bg-diplomatic-blue/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-diplomatic-blue">Research Query</p>
                  <p className="mt-1 text-xs text-navy-700">{query}</p>
                </div>

                {/* Live event feed */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                    Agent Activity
                  </p>
                  <EventFeed events={events} />
                </div>
              </div>
            )}

            {/* Done summary */}
            {phase === 'done' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">Research complete</span>
                </div>
                <div className="rounded-lg border-l-4 border-diplomatic-blue bg-diplomatic-blue/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-diplomatic-blue">Research Query</p>
                  <p className="mt-1 text-xs text-navy-700">{query}</p>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                    Agent Activity ({events.length} steps)
                  </p>
                  <EventFeed events={events} />
                </div>
                {sessionId && (
                  <div className="text-[10px] text-navy-400">
                    Session: <code className="font-mono">{sessionId.slice(0, 12)}…</code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — report (only when done or synthesizing) */}
        {(phase === 'done' || phase === 'synthesis') && report && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] bg-white px-6 py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-navy-500" />
                <span className="text-sm font-semibold text-navy-800">Research Report</span>
                {phase === 'synthesis' && (
                  <span className="flex items-center gap-1 text-xs text-diplomatic-blue">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating…
                  </span>
                )}
              </div>
              {phase === 'done' && (
                <button
                  onClick={copyReport}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-2.5 py-1.5 text-xs font-medium text-navy-500 hover:text-navy-700 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-navy-900 prose-p:text-navy-700 prose-a:text-diplomatic-blue">
                <MarkdownRenderer content={report} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
