'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, Send, X, Loader2, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useChat } from '@ai-sdk/react';
import { advisors, type Advisor } from '@/lib/constants/advisors';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

function parseDataStreamChunk(raw: string): string {
  return raw
    .split('\n')
    .filter((l) => l.startsWith('0:'))
    .map((l) => { try { return JSON.parse(l.slice(2)); } catch { return ''; } })
    .join('');
}

function AdvisorAvatar({ advisor, size = 'md' }: { advisor: Advisor; size?: 'sm' | 'md' | 'lg' }) {
  const initials = advisor.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-xl font-serif font-semibold', sizes[size])}
      style={{ backgroundColor: advisor.color + '10', color: advisor.color, border: '2px solid ' + advisor.color + '30' }}
    >
      {initials}
    </div>
  );
}

function AdvisorCard({ advisor, onChat }: { advisor: Advisor; onChat: () => void }) {
  return (
    <div className="group rounded-xl border border-[var(--color-app-border)] bg-white p-6 transition-all hover:border-navy-300 hover:shadow-md hover:shadow-navy-950/5">
      <div className="mb-4 flex items-center gap-4">
        <AdvisorAvatar advisor={advisor} size="lg" />
        <div>
          <h3 className="text-base font-semibold text-navy-900">{advisor.name}</h3>
          <p className="text-xs font-medium" style={{ color: advisor.color }}>{advisor.title}</p>
        </div>
      </div>
      <p className="mb-4 text-sm italic text-navy-600 leading-relaxed">&ldquo;{advisor.tagline}&rdquo;</p>
      <p className="mb-4 text-xs text-navy-500 leading-relaxed">{advisor.bio}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {advisor.expertise.map((tag) => (
          <span key={tag} className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2.5 py-0.5 text-[10px] font-medium text-navy-600">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-app-border)] pt-4">
        <div className="flex items-center gap-1.5 text-xs text-sage font-medium">
          <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />Online
        </div>
        <button onClick={onChat} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-all hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-gold-700">
          <MessageSquare className="h-3.5 w-3.5" />Consult
        </button>
      </div>
    </div>
  );
}

function AdvisorChat({ advisor, onClose }: { advisor: Advisor; onClose: () => void }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/advisor-chat',
    id: 'advisor-' + advisor.id,
    body: { advisorId: advisor.id },
  });
  const initials = advisor.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10 max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-4">
          <AdvisorAvatar advisor={advisor} size="md" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-navy-900">{advisor.name}</h3>
            <p className="text-[11px]" style={{ color: advisor.color }}>{advisor.title}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sage">
            <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />Live AI
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-navy-400 hover:text-navy-600"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[200px]">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold" style={{ backgroundColor: advisor.color + '10', color: advisor.color }}>{initials}</div>
            <div className="rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 max-w-lg">
              <p className="text-sm text-navy-700 leading-relaxed">Hello! I&apos;m {advisor.name}, {advisor.title.toLowerCase()}. {advisor.tagline} How can I help you today?</p>
            </div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex items-start gap-3', msg.role === 'user' && 'justify-end')}>
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold" style={{ backgroundColor: advisor.color + '10', color: advisor.color }}>{initials}</div>
              )}
              <div className={cn('max-w-lg rounded-xl px-4 py-3', msg.role === 'user' ? 'rounded-tr-none bg-diplomatic-blue text-white' : 'rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]')}>
                {msg.role === 'assistant' ? <MarkdownRenderer content={msg.content} className="text-sm" /> : <p className="text-sm leading-relaxed">{msg.content}</p>}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold" style={{ backgroundColor: advisor.color + '10', color: advisor.color }}>{initials}</div>
              <div className="flex items-center gap-1.5 rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-navy-400" /><span className="text-xs text-navy-400">Consulting...</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--color-app-border)] p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input value={input} onChange={handleInputChange} placeholder={'Ask ' + advisor.name.split(' ')[0] + '...'} disabled={isLoading}
              className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 disabled:opacity-60"
              autoFocus />
            <button type="submit" disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-diplomatic-blue text-white transition-colors hover:bg-diplomatic-blue/90 disabled:opacity-50">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/reports/new" className="rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100">Draft Report</Link>
            <Link href="/talking-points" className="rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100">Talking Points</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Panel Discussion: ask all advisors the same question in parallel
function PanelDiscussion() {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>(advisors.slice(0, 4).map((a) => a.id));

  const toggleAdvisor = (id: string) => {
    setSelectedAdvisors((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const runPanel = useCallback(async () => {
    if (!question.trim() || isRunning || selectedAdvisors.length === 0) return;
    setIsRunning(true);
    setResponses({});

    // Stream each selected advisor in parallel
    const streamAdvisor = async (advisor: Advisor) => {
      try {
        const response = await fetch('/api/ai/advisor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            advisorId: advisor.id,
            messages: [{ role: 'user', content: question }],
          }),
        });
        if (!response.ok || !response.body) throw new Error();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
          setResponses((prev) => ({ ...prev, [advisor.id]: accumulated }));
        }
      } catch {
        setResponses((prev) => ({ ...prev, [advisor.id]: `*${advisor.name} is currently unavailable. Please try again.*` }));
      }
    };

    await Promise.all(
      advisors.filter((a) => selectedAdvisors.includes(a.id)).map(streamAdvisor)
    );
    setIsRunning(false);
  }, [question, isRunning, selectedAdvisors]);

  const hasResponses = Object.keys(responses).length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <p className="text-xs font-semibold text-navy-700 mb-3">Select Advisors for Panel</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {advisors.map((a) => (
            <button
              key={a.id}
              onClick={() => toggleAdvisor(a.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all',
                selectedAdvisors.includes(a.id)
                  ? 'text-white border-transparent'
                  : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
              )}
              style={selectedAdvisors.includes(a.id) ? { backgroundColor: a.color, borderColor: a.color } : {}}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-current" />
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
            disabled={!question.trim() || isRunning || selectedAdvisors.length === 0}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask Panel
          </button>
        </div>
      </div>

      {hasResponses && (
        <div className={cn('grid gap-4', selectedAdvisors.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3')}>
          {advisors
            .filter((a) => selectedAdvisors.includes(a.id))
            .map((advisor) => {
              const content = responses[advisor.id];
              const initials = advisor.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
              return (
                <div key={advisor.id} className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--color-app-border)]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold" style={{ backgroundColor: advisor.color + '15', color: advisor.color }}>{initials}</div>
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
  const [chatAdvisor, setChatAdvisor] = useState<Advisor | null>(null);
  const [mode, setMode] = useState<'individual' | 'panel'>('individual');
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/8">
            <Sparkles className="h-5 w-5 text-gold-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Advisory Council</h1>
            <p className="text-sm text-navy-500">{advisors.length} AI experts powered by Gemini 2.5 Flash. Ask them anything about your current work.</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-[var(--color-app-border)] bg-white p-1">
          <button
            onClick={() => setMode('individual')}
            className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', mode === 'individual' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Individual
          </button>
          <button
            onClick={() => setMode('panel')}
            className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', mode === 'panel' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
          >
            <Users className="h-3.5 w-3.5" />
            Panel Discussion
          </button>
        </div>
      </div>

      {mode === 'individual' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
            <Sparkles className="h-4 w-4 shrink-0 text-gold-600 mt-0.5" />
            <p className="text-sm text-navy-700">Each advisor has a distinct AI persona shaped by their expertise. They give substantive, expert-level guidance grounded in their specific field — not generic responses.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {advisors.map((advisor) => (
              <AdvisorCard key={advisor.id} advisor={advisor} onChat={() => setChatAdvisor(advisor)} />
            ))}
          </div>
        </>
      )}

      {mode === 'panel' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-diplomatic-blue/15 bg-diplomatic-blue/4 p-4">
            <Users className="h-4 w-4 shrink-0 text-diplomatic-blue mt-0.5" />
            <p className="text-sm text-navy-700">Panel Discussion sends your question to multiple advisors simultaneously. Compare their different expert perspectives side-by-side.</p>
          </div>
          <PanelDiscussion />
        </>
      )}

      {chatAdvisor && <AdvisorChat advisor={chatAdvisor} onClose={() => setChatAdvisor(null)} />}
    </div>
  );
}
