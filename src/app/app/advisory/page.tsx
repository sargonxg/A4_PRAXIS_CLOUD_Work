'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback, useRef } from 'react';
import { Sparkles, MessageSquare, Send, X, Loader2, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

interface AdvisorDef {
  id: string;
  name: string;
  title: string;
  expertise: string;
  avatar: string;
  color: string;
  bio: string;
  systemPrompt: string;
  suggestedPrompts: string[];
}

const ADVISORS: AdvisorDef[] = [
  {
    id: 'amara',
    name: 'Dr. Amara Okafor',
    title: 'Chief Conflict Analyst',
    expertise: 'Escalation modeling, political violence, West African conflicts',
    avatar: 'AO',
    color: '#4B92DB',
    bio: 'Former DPPA political affairs officer with 12 years experience in West Africa. Specializes in escalation dynamics and electoral violence.',
    systemPrompt: 'You are Dr. Amara Okafor, a leading conflict analyst specializing in escalation modeling. Focus on political dynamics, escalation indicators, and conflict prevention. Reference the Glasl escalation model and structural violence theories. Be analytical and evidence-based. Provide specific, expert-level analysis grounded in conflict research.',
    suggestedPrompts: [
      'What are the escalation risks in the next 30 days?',
      "Analyze the DRM's political trajectory and end-game",
      'Which actors have the most destabilizing potential?',
    ],
  },
  {
    id: 'mitchell',
    name: 'Col. Sarah Mitchell',
    title: 'Security & Military Analyst',
    expertise: 'Armed group dynamics, peacekeeping, military strategy',
    avatar: 'SM',
    color: '#A63D40',
    bio: 'Retired military officer with NATO and UN peacekeeping experience. Specializes in armed group behavior, terrain analysis, and force protection.',
    systemPrompt: 'You are Col. Sarah Mitchell, a military analyst and former NATO officer. Analyze conflicts through a security and military lens. Focus on armed group capabilities, terrain, logistics, and peacekeeping operations. Be direct and operationally focused. Give practical military assessments based on doctrinal knowledge.',
    suggestedPrompts: [
      'Assess DRM military capabilities vs. Government forces',
      'What are the UNMN force protection risks?',
      'Is the ceasefire militarily sustainable?',
    ],
  },
  {
    id: 'hassan',
    name: 'Dr. Layla Hassan',
    title: 'International Law Expert',
    expertise: 'IHL, human rights law, accountability mechanisms',
    avatar: 'LH',
    color: '#5B8C5A',
    bio: 'International human rights lawyer with ICJ and ICC experience. Specializes in IHL compliance, accountability, and transitional justice.',
    systemPrompt: 'You are Dr. Layla Hassan, an expert in international humanitarian law and human rights. Analyze conflicts through legal frameworks: IHL compliance, human rights violations, accountability mechanisms, and international criminal law. Reference relevant conventions and precedents. Be precise about legal thresholds and obligations.',
    suggestedPrompts: [
      'What IHL violations have occurred in Nordalia?',
      'Does the Framework Agreement meet international standards?',
      'What accountability mechanisms should be established?',
    ],
  },
  {
    id: 'chen',
    name: 'Dr. Wei Chen',
    title: 'Humanitarian & Economics Analyst',
    expertise: 'Humanitarian response, sanctions, economic warfare',
    avatar: 'WC',
    color: '#C8961E',
    bio: 'Former OCHA coordinator and conflict economist. Specializes in humanitarian access negotiation, sanctions impact analysis, and conflict economics.',
    systemPrompt: 'You are Dr. Wei Chen, a humanitarian and economic analyst. Focus on humanitarian conditions, access negotiations, economic impacts of conflict, and sanctions effectiveness. Be practical and solution-oriented with a humanitarian lens. Draw on OCHA methodology and conflict economy research.',
    suggestedPrompts: [
      'What are the humanitarian access barriers in Nordalia?',
      'Assess the economic impact of the conflict on civilians',
      'How effective are the current sanctions?',
    ],
  },
];

const CONFLICT_CONTEXT = `Current conflict context: Nordalia Crisis, East Africa.
DRM forces advancing on government-held territory. Ceasefire signed February 2026 is fragile — three violations documented. UNMN mandate renewal in 19 days.
Karovia suspected of providing military advisors to DRM. Framework Agreement has 4 of 12 benchmarks implemented.
2.1 million food-insecure civilians. MSF expelled from eastern provinces. Kessara peace talks collapsed January 2026.
ICC issued arrest warrants for three DRM commanders. Nordalia arms embargo renewal vote scheduled 17 March.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AdvisorAvatar({ advisor, size = 'md' }: { advisor: AdvisorDef; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-xl font-serif font-semibold', sizes[size])}
      style={{ backgroundColor: advisor.color + '15', color: advisor.color, border: '2px solid ' + advisor.color + '25' }}
    >
      {advisor.avatar}
    </div>
  );
}

function AdvisorChatPanel({ advisor, onClose }: { advisor: AdvisorDef; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const allMessages = [
      { role: 'system', content: advisor.systemPrompt + '\n\n' + CONFLICT_CONTEXT },
      ...messages,
      userMsg,
    ];

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) {
            accumulated += parsed;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: accumulated };
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: `*${advisor.name} is temporarily unavailable. Please try again.*` }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isLoading, advisor]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
      <div
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-4 shrink-0">
          <AdvisorAvatar advisor={advisor} size="md" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-navy-900">{advisor.name}</h3>
            <p className="text-[11px]" style={{ color: advisor.color }}>{advisor.title}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sage">
            <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />Live AI
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-navy-400 hover:text-navy-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {/* Welcome message */}
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
              style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
            >
              {advisor.avatar}
            </div>
            <div className="rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 max-w-lg">
              <p className="text-sm text-navy-700 leading-relaxed">
                Hello. I&apos;m {advisor.name}, {advisor.title.toLowerCase()}. {advisor.bio} How can I assist you today?
              </p>
            </div>
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex items-start gap-3', msg.role === 'user' && 'justify-end')}>
              {msg.role === 'assistant' && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                  style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
                >
                  {advisor.avatar}
                </div>
              )}
              <div className={cn(
                'max-w-lg rounded-xl px-4 py-3',
                msg.role === 'user'
                  ? 'rounded-tr-none bg-diplomatic-blue text-white'
                  : 'rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]'
              )}>
                {msg.role === 'assistant'
                  ? <MarkdownRenderer content={msg.content} className="text-sm" />
                  : <p className="text-sm leading-relaxed">{msg.content}</p>
                }
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
              >
                {advisor.avatar}
              </div>
              <div className="flex items-center gap-1.5 rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-navy-400" />
                <span className="text-xs text-navy-400">Consulting...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length === 0 && (
          <div className="border-t border-[var(--color-app-border)] px-5 py-3 shrink-0">
            <p className="mb-2 text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {advisor.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-1.5 text-[11px] text-navy-600 hover:border-navy-300 hover:text-navy-800 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[var(--color-app-border)] p-4 shrink-0">
          <div className="flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={`Ask ${advisor.name.split(' ')[0]}...`}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 disabled:opacity-60"
              autoFocus
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: advisor.color }}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelDiscussion() {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(ADVISORS.map((a) => a.id));

  const toggleAdvisor = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const runPanel = useCallback(async () => {
    if (!question.trim() || isRunning || selectedIds.length === 0) return;
    setIsRunning(true);
    setResponses({});

    const streamAdvisor = async (advisor: AdvisorDef) => {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: advisor.systemPrompt + '\n\n' + CONFLICT_CONTEXT },
              { role: 'user', content: question },
            ],
          }),
        });
        if (!response.ok || !response.body) throw new Error();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const parsed = parseDataStreamChunk(line);
            if (parsed) { accumulated += parsed; setResponses((prev) => ({ ...prev, [advisor.id]: accumulated })); }
          }
        }
      } catch {
        setResponses((prev) => ({ ...prev, [advisor.id]: `*${advisor.name} is currently unavailable.*` }));
      }
    };

    await Promise.all(ADVISORS.filter((a) => selectedIds.includes(a.id)).map(streamAdvisor));
    setIsRunning(false);
  }, [question, isRunning, selectedIds]);

  const hasResponses = Object.keys(responses).length > 0;
  const activeAdvisors = ADVISORS.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <p className="mb-3 text-xs font-semibold text-navy-700">Select advisors for panel</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ADVISORS.map((a) => (
            <button
              key={a.id}
              onClick={() => toggleAdvisor(a.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all',
                selectedIds.includes(a.id)
                  ? 'border-transparent text-white'
                  : 'border-[var(--color-app-border)] bg-white text-navy-600 hover:bg-[var(--color-app-surface-alt)]'
              )}
              style={selectedIds.includes(a.id) ? { backgroundColor: a.color } : {}}
            >
              <span className="font-mono text-[9px]">{a.avatar}</span>
              {a.name.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPanel()}
            placeholder="Ask all selected advisors the same question..."
            disabled={isRunning}
            className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 disabled:opacity-60"
          />
          <button
            onClick={runPanel}
            disabled={!question.trim() || isRunning || selectedIds.length === 0}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask Panel
          </button>
        </div>
      </div>

      {hasResponses && (
        <div className={cn(
          'grid gap-4',
          activeAdvisors.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          activeAdvisors.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2'
        )}>
          {activeAdvisors.map((advisor) => {
            const content = responses[advisor.id];
            return (
              <div key={advisor.id} className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--color-app-border)]">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                    style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
                  >
                    {advisor.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900">{advisor.name}</p>
                    <p className="text-[10px]" style={{ color: advisor.color }}>{advisor.title}</p>
                  </div>
                  {isRunning && !content && (
                    <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-navy-400" />
                  )}
                </div>
                {content ? (
                  <div className="text-xs text-navy-700 leading-relaxed prose prose-sm max-w-none">
                    <MarkdownRenderer content={content} />
                    {isRunning && (
                      <span className="inline-block h-3 w-0.5 animate-pulse ml-0.5" style={{ backgroundColor: advisor.color }} />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-navy-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Consulting {advisor.name.split(' ')[0]}...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdvisoryPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [chatAdvisor, setChatAdvisor] = useState<AdvisorDef | null>(null);
  const [mode, setMode] = useState<'individual' | 'panel'>('individual');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/8">
            <Sparkles className="h-5 w-5 text-gold-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Advisory Council</h1>
            <p className="text-sm text-navy-500">{ADVISORS.length} AI experts with specialized domain knowledge. Grounded in Nordalia conflict context.</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-[var(--color-app-border)] bg-white p-1">
          <button
            onClick={() => setMode('individual')}
            className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', mode === 'individual' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
          >
            <MessageSquare className="h-3.5 w-3.5" />Individual
          </button>
          <button
            onClick={() => setMode('panel')}
            className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', mode === 'panel' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
          >
            <Users className="h-3.5 w-3.5" />Panel Discussion
          </button>
        </div>
      </div>

      {mode === 'individual' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
            <Sparkles className="h-4 w-4 shrink-0 text-gold-600 mt-0.5" />
            <p className="text-sm text-navy-700">Each advisor has a specialized system prompt shaped by their domain expertise. They give substantive, expert-level guidance grounded in their specific field and the Nordalia conflict context.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {ADVISORS.map((advisor) => (
              <div
                key={advisor.id}
                className="group rounded-xl border border-[var(--color-app-border)] bg-white p-5 transition-all hover:border-navy-300 hover:shadow-md hover:shadow-navy-950/5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <AdvisorAvatar advisor={advisor} size="lg" />
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{advisor.name}</h3>
                    <p className="text-xs font-medium" style={{ color: advisor.color }}>{advisor.title}</p>
                  </div>
                </div>
                <p className="mb-3 text-xs text-navy-500 leading-relaxed">{advisor.bio}</p>
                <div className="mb-4 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">Expertise</p>
                  <p className="text-xs text-navy-700">{advisor.expertise}</p>
                </div>
                <div className="mb-4 space-y-1.5">
                  <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Suggested questions</p>
                  {advisor.suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setChatAdvisor(advisor); }}
                      className="block w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2 text-left text-[11px] text-navy-600 hover:border-navy-300 hover:text-navy-800 transition-colors"
                    >
                      <ChevronRight className="inline h-3 w-3 mr-1 text-navy-300" />
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-app-border)] pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-sage font-medium">
                    <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />Online
                  </div>
                  <button
                    onClick={() => setChatAdvisor(advisor)}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-all hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-gold-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />Consult
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {mode === 'panel' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-diplomatic-blue/15 bg-diplomatic-blue/4 p-4">
            <Users className="h-4 w-4 shrink-0 text-diplomatic-blue mt-0.5" />
            <p className="text-sm text-navy-700">Panel Discussion sends your question to multiple advisors simultaneously. Compare different expert perspectives — military, legal, analytical, humanitarian — side-by-side in real time.</p>
          </div>
          <PanelDiscussion />
        </>
      )}

      {chatAdvisor && (
        <AdvisorChatPanel advisor={chatAdvisor} onClose={() => setChatAdvisor(null)} />
      )}
    </div>
  );
}
