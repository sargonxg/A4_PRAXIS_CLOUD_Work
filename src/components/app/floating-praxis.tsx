'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import { attachedCoresFromSituation, recommendTools } from '@/lib/tools/recommend';
import { useAppStore } from '@/stores/app-store';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MutationConfirmCard,
  type MutationPatch,
} from '@/components/assistant/mutation-confirm-card';

interface ChatProposal {
  summary: string;
  patch: MutationPatch;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  proposal?: ChatProposal | null;
}

interface QuickAction {
  label: string;
  prompt: string;
}

function getContextGreeting(pathname: string, situationName?: string): string {
  const page = pathname?.split('/').filter(Boolean).pop() || '';
  const sitName = situationName ? `"${situationName}"` : 'your situation';

  const greetings: Record<string, string> = {
    'dashboard': `I can see you're reviewing the dashboard for ${sitName}. Want me to summarize the latest developments or generate a risk snapshot?`,
    'risk-monitor': `You're on Risk Monitor. Want me to explain what's driving the current risk indicators, or run an updated escalation assessment?`,
    'early-warning': `I see you're in Early Warning. I can run a CEWARN-methodology early warning brief, or explain any of the current indicators.`,
    'stakeholder-map': `You're viewing the stakeholder map. Want me to analyze actor power dynamics, identify spoilers, or build an influence matrix?`,
    'conflict-graph': `I can help you interpret the conflict graph — explain entity relationships, identify missing connections, or run a graph analysis.`,
    'scenarios': `You're in the Scenario Planner. I can help design a scenario, interpret results, or compare outcomes across different parameter settings.`,
    'negotiation-prep': `Ready to help with negotiation preparation. I can analyze ZOPA, assess BATNAs, or draft talking points for a specific session.`,
    'game-theory': `Game Theory mode. I can analyze strategic interactions, identify Nash equilibria, or model a specific actor dilemma.`,
    'mediation-design': `You're designing a mediation process. Want help with process architecture, CBM sequencing, or spoiler management strategy?`,
    'geospatial-monitor': `I see you're on the Geospatial Monitor. I can interpret hotspot patterns, explain event clusters, or correlate spatial data with political dynamics.`,
    'reports': `In the Report Studio. I can draft sections, check diplomatic language, or help structure the full document.`,
    'timeline': `You're on the Timeline. I can compress events into a decision narrative, flag escalation triggers, or trace a specific date.`,
    'humanitarian': `Humanitarian dashboard. I can pull a PIN/IDP read, surface protection risks, or compare cluster funding gaps.`,
    'commitments': `You're tracking commitments. I can score compliance, flag verification gaps, or sequence the next decision asks.`,
    'sources': `Sources Library. I can audit reliability, suggest local NGO and humanitarian sources, or flag gap categories.`,
    'briefing': `Briefing Studio. I can draft a BLUF, source-grounded risk board, decision asks, and visible gaps.`,
    'advisory': `Boardroom Advisory. I can convene mediator, humanitarian, security, legal, and red-team voices and preserve disagreement.`,
    'graphops': `GraphOps. I can summarise graph health, propose repairs, or audit confidence on key edges.`,
    'context-builder': `Context Builder. I can identify missing context, propose a gap-fill sequence, and route the right workflow path.`,
    'assistant': ``,
  };

  return greetings[page] || `How can I help you with ${sitName}? I can research developments, analyze actors, draft reports, or answer any conflict intelligence question.`;
}

function getQuickActions(pathname: string, situationName?: string): QuickAction[] {
  const page = pathname?.split('/').filter(Boolean).pop() || '';
  const name = situationName || 'this situation';

  const pageActions: Record<string, QuickAction[]> = {
    'dashboard': [
      { label: 'Risk snapshot', prompt: `Give me a quick risk snapshot for ${name}` },
      { label: 'Key actors', prompt: `Who are the key actors in ${name} right now?` },
      { label: 'Latest events', prompt: `What are the most significant recent events in ${name}?` },
      { label: 'Escalation trend', prompt: `What is the current escalation trend for ${name}?` },
    ],
    'risk-monitor': [
      { label: 'Top risks', prompt: `What are the top 3 risk factors in ${name}?` },
      { label: 'INFORM score', prompt: `Explain the INFORM risk components for ${name}` },
      { label: 'Risk drivers', prompt: `What is driving the current risk level in ${name}?` },
      { label: 'Mitigation', prompt: `What risk mitigation actions would be most effective?` },
    ],
    'early-warning': [
      { label: 'Alert level', prompt: `What is the current early warning alert level for ${name}?` },
      { label: 'Trigger events', prompt: `What trigger events should we watch for?` },
      { label: 'EW brief', prompt: `Generate a CEWARN early warning brief for ${name}` },
      { label: 'Window', prompt: `Is there a window of opportunity for de-escalation?` },
    ],
    'stakeholder-map': [
      { label: 'Profile actor', prompt: `Profile the most influential actor in ${name}` },
      { label: 'Map relationships', prompt: `Map the key relationships and alliances between actors` },
      { label: 'Find leverage', prompt: `What leverage points exist for each party?` },
      { label: 'Check media', prompt: `How are the key actors framing the conflict in media?` },
    ],
    'conflict-graph': [
      { label: 'Key entities', prompt: `What are the most central entities in the conflict graph?` },
      { label: 'Missing links', prompt: `What connections in the conflict graph seem incomplete?` },
      { label: 'Entity profile', prompt: `Profile the most significant actor in the graph` },
      { label: 'Relationships', prompt: `Analyze the key relationships in the conflict graph` },
    ],
    'scenarios': [
      { label: 'Best case', prompt: `What would a best-case scenario look like for ${name}?` },
      { label: 'Worst case', prompt: `What are the worst-case scenario risks?` },
      { label: 'Most likely', prompt: `What is the most likely trajectory in the next 90 days?` },
      { label: 'Tipping points', prompt: `What are the key tipping points that could change the trajectory?` },
    ],
    'game-theory': [
      { label: 'Nash equilibria', prompt: `What Nash equilibria exist in the current actor configuration for ${name}?` },
      { label: 'Payoff matrix', prompt: `Model a payoff matrix for the two main actors in ${name}` },
      { label: 'Dominant strategy', prompt: `What is the dominant strategy for each actor?` },
      { label: 'Cooperation', prompt: `What conditions would enable cooperative outcomes?` },
    ],
    'negotiation-prep': [
      { label: 'ZOPA', prompt: `Define the ZOPA for the current negotiation in ${name}` },
      { label: 'BATNAs', prompt: `Assess BATNAs for each party in ${name}` },
      { label: 'Talking points', prompt: `Draft opening talking points for the lead mediator` },
      { label: 'Red lines', prompt: `What are the likely red lines for each party?` },
    ],
    'mediation-design': [
      { label: 'Process design', prompt: `Suggest a mediation process architecture for ${name}` },
      { label: 'CBM sequence', prompt: `What confidence-building measures should come first?` },
      { label: 'Spoiler analysis', prompt: `Who are the likely spoilers and how should they be managed?` },
      { label: 'Ripeness', prompt: `Assess conflict ripeness using Zartman's criteria` },
    ],
    'geospatial-monitor': [
      { label: 'Hotspot analysis', prompt: `Explain the main hotspot clusters on the map` },
      { label: 'Event patterns', prompt: `What patterns do you see in the conflict event data?` },
      { label: 'Territorial shifts', prompt: `Are there any notable territorial control shifts?` },
      { label: 'Civilian impact', prompt: `How is civilian population affected by the conflict geography?` },
    ],
    'reports': [
      { label: 'Draft intro', prompt: `Draft an executive summary for a situation report on ${name}` },
      { label: 'Key findings', prompt: `What should be the key findings in this report?` },
      { label: 'Language check', prompt: `What diplomatic language considerations apply to this report?` },
      { label: 'Structure', prompt: `Suggest a structure for a professional diplomatic report on ${name}` },
    ],
    'timeline': [
      { label: 'Last 30 days', prompt: `What changed in ${name} in the last 30 days?` },
      { label: 'Trigger events', prompt: `Which events in the timeline are decision triggers I should brief?` },
      { label: 'Compress story', prompt: `Compress the timeline of ${name} into a five-line decision narrative.` },
      { label: 'Glasl shifts', prompt: `Which timeline events shifted Glasl escalation stage and why?` },
    ],
    'humanitarian': [
      { label: 'PIN summary', prompt: `Summarise the People-in-Need picture for ${name}, by hotspot.` },
      { label: 'Funding gap', prompt: `Where are the largest cluster funding gaps and what is the operational impact?` },
      { label: 'Protection risks', prompt: `What protection risks should appear in the next humanitarian brief?` },
      { label: 'Returns view', prompt: `Give a returns and reintegration read with HLP and civil-documentation cues.` },
    ],
    'commitments': [
      { label: 'Compliance check', prompt: `Which commitments are slipping and what is the evidence basis?` },
      { label: 'Damascus-SDF deal', prompt: `Walk me through the 30 January Damascus-SDF agreement compliance scorecard.` },
      { label: 'Critical gaps', prompt: `What three commitments matter most for the next principal decision?` },
      { label: 'Verification ask', prompt: `What independent verification would change confidence on these commitments?` },
    ],
    'sources': [
      { label: 'Reliability map', prompt: `Show me the reliability landscape for current sources on ${name}.` },
      { label: 'Add NGO sources', prompt: `Suggest NGO and humanitarian sources I should add for ${name}.` },
      { label: 'Local angle', prompt: `Which Syrian local-language outlets give the best ground truth for ${name}?` },
      { label: 'Source gaps', prompt: `Where do my sources have gaps that block confidence?` },
    ],
    'briefing': [
      { label: 'BLUF first', prompt: `Draft a BLUF + risk board for the briefing on ${name}.` },
      { label: 'Decision asks', prompt: `Suggest decision asks the briefing should put to leadership.` },
      { label: 'Source basis', prompt: `Audit the briefing for source basis, confidence, and visible gaps.` },
      { label: 'Speaker notes', prompt: `Write speaker notes that preserve assessment vs assumption discipline.` },
    ],
    'advisory': [
      { label: 'Boardroom call', prompt: `Run a boardroom call: mediator, humanitarian, security, legal, red-team.` },
      { label: 'Disagreements', prompt: `Where do my advisors disagree on ${name} and why?` },
      { label: 'Red-team check', prompt: `Red-team the dominant assessment for ${name}.` },
      { label: 'Lina Khatib lens', prompt: `What would Lina Khatib emphasise on the current ${name} posture?` },
    ],
    'graphops': [
      { label: 'Graph health', prompt: `Summarise the graph health: provenance, temporal coverage, orphan nodes.` },
      { label: 'Repair queue', prompt: `What graph repair actions should I run before the next briefing?` },
      { label: 'Pending proposals', prompt: `Walk me through the pending graph proposals and their evidence.` },
      { label: 'Confidence audit', prompt: `Audit confidence levels on edges connected to the Damascus-SDF agreement.` },
    ],
    'context-builder': [
      { label: 'Missing context', prompt: `What context is missing before I run expensive AI on ${name}?` },
      { label: 'Mission routing', prompt: `Which PRAXIS workflow path matches this situation?` },
      { label: 'Domain check', prompt: `Confirm the domain classification and explain it.` },
      { label: 'Gap-fill plan', prompt: `Propose a low-cost gap-fill sequence to bring context to green.` },
    ],
  };

  return pageActions[page] ?? [
    { label: 'Research', prompt: `Research the latest on ${name}` },
    { label: 'Risk brief', prompt: `Give me a quick risk brief for ${name}` },
    { label: 'Key actors', prompt: `Who are the key actors in ${name}?` },
    { label: 'Draft report', prompt: `Help me draft a situation report for ${name}` },
  ];
}

const PAGE_TO_TOOL_ID: Record<string, string> = {
  dashboard: 'dashboard',
  'conflict-graph': 'conflict-graph',
  timeline: 'timeline',
  'risk-monitor': 'risk-monitor',
  'early-warning': 'early-warning',
  actors: 'actor-profiles',
  'stakeholder-map': 'stakeholder-map',
  'power-map': 'power-map',
  scenarios: 'scenarios',
  'negotiation-prep': 'negotiation-prep',
  'game-theory': 'game-theory',
  'mediation-design': 'mediation-design',
  'geospatial-monitor': 'geospatial-monitor',
  reports: 'report-studio',
  briefing: 'briefing',
  dossier: 'dossier',
  'talking-points': 'talking-points',
  'policy-memo': 'policy-memo',
  'un-toolkit': 'un-toolkit',
  'deep-search-agent': 'deep-search-agent',
  argus: 'argus',
  sources: 'sources-library',
  commitments: 'commitments',
  sanctions: 'sanctions',
  'treaty-analyzer': 'treaty-analyzer',
  'human-rights': 'human-rights',
  'electoral-risk': 'electoral-risk',
  'peacebuilding-index': 'peacebuilding-index',
  'economic-impact': 'economic-impact',
  'legal-tracker': 'legal-tracker',
  humanitarian: 'humanitarian',
  documents: 'documents',
  'export-center': 'export-center',
  cases: 'cases',
  team: 'team',
  settings: 'settings',
  advisory: 'advisory',
};

function getCurrentToolId(pathname: string | null): string | undefined {
  const page = pathname?.split('/').filter(Boolean).pop() || '';
  return PAGE_TO_TOOL_ID[page];
}

/**
 * Floating Ask PRAXIS button + slide-over chat panel.
 * Available on every /app/* and /demo/* page.
 * Does NOT show on the full assistant page (to avoid duplication).
 */
export function FloatingPraxis() {
  const pathname = usePathname();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const demoMode = useAppStore((s) => s.demoMode);
  const currentToolId = getCurrentToolId(pathname);

  // Per-situation storage key
  const storageKey = activeSituation
    ? `praxis-floating-chat-${activeSituation.id}`
    : 'praxis-floating-chat-global';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Don't show on the full assistant page
  const isAssistantPage = pathname?.includes('/assistant');

  // Load conversation from localStorage when storageKey changes (situation switch)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(storageKey);
      setMessages(saved ? (JSON.parse(saved) as ChatMessage[]) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  // Persist messages to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Keep only last 50 messages to avoid bloating storage
      const toSave = messages.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // localStorage may be full or unavailable
    }
  }, [messages, storageKey]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Listen for header "Ask PRAXIS" button and keyboard shortcut
  useEffect(() => {
    const openHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) setInput(detail.prompt);
      setIsOpen(true);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('open-praxis-chat', openHandler as EventListener);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('open-praxis-chat', openHandler as EventListener);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [isOpen]);

  const sendWithText = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      // Fire the intent classifier in parallel — non-blocking. If it resolves
      // as a profile.mutation we attach a MutationConfirmCard to the assistant
      // turn; otherwise we ignore the result.
      const intentPromise = fetch('/api/assistant/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            situation:
              !demoMode && activeSituation ? activeSituation : undefined,
            conflictContext: demoMode
              ? 'nordalia'
              : activeSituation?.name || undefined,
            currentToolId,
            currentPath: pathname,
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      'I encountered an error. Please try again or check that your AI API key is configured.',
                  }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const parsed = parseDataStreamChunk(line);
            if (parsed) {
              accumulated += parsed;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated }
                    : m
                )
              );
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: 'Network error. Please check your connection.',
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }

      // Attach any intent-classifier proposal to the completed assistant turn.
      const intent = await intentPromise;
      if (
        intent &&
        typeof intent === 'object' &&
        intent.intent === 'profile.mutation' &&
        intent.patch &&
        typeof intent.patch === 'object' &&
        typeof intent.humanSummary === 'string'
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  proposal: {
                    summary: intent.humanSummary,
                    patch: intent.patch as MutationPatch,
                  },
                }
              : m
          )
        );
      }
    },
    [isStreaming, messages, activeSituation, demoMode, currentToolId, pathname]
  );

  const sendMessage = useCallback(() => {
    sendWithText(input);
  }, [input, sendWithText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    localStorage.removeItem(storageKey);
  };

  if (isAssistantPage) return null;

  const contextGreeting = getContextGreeting(pathname ?? '', activeSituation?.name);
  const quickActions = getQuickActions(pathname ?? '', activeSituation?.name);
  const suggestedTools = recommendTools({
    attached: attachedCoresFromSituation(activeSituation),
    situationStage: activeSituation?.analysisPhase ?? activeSituation?.workflowPath ?? 'intake',
    recentToolIds: [],
  });

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-diplomatic-blue text-white shadow-lg shadow-diplomatic-blue/25 transition-transform hover:scale-105 hover:shadow-xl active:scale-95 md:flex"
            aria-label="Ask PRAXIS"
          >
            <Sparkles className="h-5 w-5 text-gold-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-over Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-navy-700 bg-navy-900 shadow-2xl md:bottom-6 md:right-6 md:top-auto md:w-[420px] md:rounded-2xl md:border md:h-[600px] md:max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-diplomatic-blue">
                    <Sparkles className="h-4 w-4 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-50">
                      Ask PRAXIS
                    </h3>
                    <p className="text-[10px] text-navy-400">
                      {activeSituation
                        ? activeSituation.name
                        : 'Conflict intelligence assistant'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-800 hover:text-navy-200"
                      title="Clear conversation"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-800 hover:text-navy-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-diplomatic-blue/15">
                      <Sparkles className="h-6 w-6 text-gold-400" />
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-navy-100">
                      How can PRAXIS help?
                    </h4>
                    {contextGreeting ? (
                      <p className="mt-1.5 max-w-xs text-xs text-navy-400 leading-relaxed">
                        {contextGreeting}
                      </p>
                    ) : (
                      <p className="mt-1 max-w-xs text-xs text-navy-400">
                        {activeSituation
                          ? `Ask anything about "${activeSituation.name}" — research, analysis, reports, risk assessment, or platform guidance.`
                          : 'Ask about conflict analysis, TACITUS tools, diplomatic reporting, or get help navigating the platform.'}
                      </p>
                    )}
                    {/* Quick action pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => sendWithText(action.prompt)}
                          className="rounded-full border border-navy-700 px-2.5 py-1 text-[11px] text-navy-300 hover:border-gold-600/40 hover:bg-navy-800 hover:text-gold-400 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5" aria-label="Suggested tools">
                      {suggestedTools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => sendWithText(`Use ${tool.name} for this Situation Core. Explain what you need attached before running it.`)}
                          className="rounded-full border border-gold-700/40 px-2.5 py-1 text-[11px] text-gold-300 hover:bg-navy-800"
                        >
                          {tool.shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-xl px-3.5 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'ml-8 bg-diplomatic-blue text-white'
                        : 'mr-4 bg-navy-800 text-navy-200'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="floating-praxis-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || ' '}
                        </ReactMarkdown>
                        {isStreaming &&
                          msg.id === messages[messages.length - 1]?.id && (
                            <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                          )}
                        {msg.proposal && (
                          <MutationConfirmCard
                            summary={msg.proposal.summary}
                            patch={msg.proposal.patch}
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-navy-700 px-3 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask PRAXIS anything..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-navy-600 bg-navy-800 px-3.5 py-2.5 text-sm text-navy-100 placeholder:text-navy-500 focus:border-gold-600/40 focus:outline-none focus:ring-2 focus:ring-gold-600/10"
                    style={{ maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height =
                        Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isStreaming}
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                      input.trim() && !isStreaming
                        ? 'bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90'
                        : 'bg-navy-800 text-navy-500'
                    )}
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[9px] text-navy-500">
                  PRAXIS by TACITUS — Conflict intelligence for peace
                  professionals
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
