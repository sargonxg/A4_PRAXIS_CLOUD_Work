'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AdvisorConfig } from '@/types/advisor';
import type { Situation } from '@/types/situation';
import { parseDataStreamChunk } from '@/lib/utils/stream';

interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string }

export function AdvisorChatPane({
  advisor,
  situation,
}: {
  advisor: AdvisorConfig;
  situation: Situation | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greet', role: 'assistant', content: advisor.greeting },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userTurn: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const assistantTurn: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userTurn, assistantTurn]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorId: advisor.id,
          messages: [...messages, userTurn].map((m) => ({ role: m.role, content: m.content })),
          situation: situation ?? undefined,
        }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantTurn.id ? { ...m, content: 'Advisor unavailable — try again.' } : m)),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) {
            accumulated += parsed;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantTurn.id ? { ...m, content: accumulated } : m)),
            );
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantTurn.id ? { ...m, content: 'Network error — please retry.' } : m)),
      );
    } finally {
      setStreaming(false);
    }
  }, [advisor.id, input, messages, situation, streaming]);

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-navy-200 bg-white">
      <header className="border-b border-navy-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-navy-900">{advisor.name}</h3>
        <p className="text-[11px] text-navy-500">{advisor.title} · model {advisor.modelTier}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'ml-8 text-right' : 'mr-4'}>
            <div
              className={`inline-block max-w-full rounded-xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-diplomatic-blue text-white'
                  : 'bg-navy-50 text-navy-900'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || ' '}</ReactMarkdown>
                </div>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="border-t border-navy-200 px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={`Ask ${advisor.name.split(' ').slice(-1)[0]}…`}
            className="min-h-[36px] flex-1 resize-none rounded-md border border-navy-200 px-3 py-1.5 text-sm focus:border-diplomatic-blue focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!input.trim() || streaming}
            className="inline-flex items-center gap-1 rounded-md bg-diplomatic-blue px-3 py-1.5 text-xs text-white disabled:bg-navy-300"
          >
            {streaming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
