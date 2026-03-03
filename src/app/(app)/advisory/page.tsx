'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, ArrowRight, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { advisors, type Advisor } from '@/lib/constants/advisors';

const sampleResponses: Record<string, string> = {
  'dr-okafor': 'Based on the latest ACLED data and my analysis of the Nordalia conflict dynamics, the DRM\'s seizure of the Belara mining complex represents a strategic shift from guerrilla tactics to territorial control. This mirrors patterns we saw in the Eastern DRC in 2012-2013. I recommend updating your risk matrix to reflect the new military posture.',
  'amb-tanaka': 'The diplomatic landscape around Nordalia has shifted significantly. Karovia\'s abstention at the last UNSC vote signals potential flexibility. I\'d recommend back-channel engagement through the AU mediation team before the next formal session. The window for a framework agreement amendment is narrowing.',
  'col-mitchell': 'Force posture analysis shows DRM consolidation in three provinces. The UNMN mandate needs urgent review — current troop ceiling is insufficient for the expanded area of operations. Recommend preparing a confidential assessment for the Military Advisor to the SG.',
};

function AdvisorCard({ advisor, onChat }: { advisor: Advisor; onChat: () => void }) {
  return (
    <div className="group rounded-xl border border-[var(--color-app-border)] bg-white p-6 transition-all hover:border-navy-300 hover:shadow-md hover:shadow-navy-950/5">
      {/* Avatar */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl font-serif text-lg font-semibold"
          style={{
            backgroundColor: `${advisor.color}10`,
            color: advisor.color,
            border: `2px solid ${advisor.color}30`,
          }}
        >
          {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <h3 className="text-base font-semibold text-navy-900">{advisor.name}</h3>
          <p className="text-xs font-medium" style={{ color: advisor.color }}>{advisor.title}</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="mb-4 text-sm italic text-navy-600 leading-relaxed">
        &ldquo;{advisor.tagline}&rdquo;
      </p>

      {/* Bio */}
      <p className="mb-4 text-xs text-navy-500 leading-relaxed">
        {advisor.bio}
      </p>

      {/* Expertise */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {advisor.expertise.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2.5 py-0.5 text-[10px] font-medium text-navy-600"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--color-app-border)] pt-4">
        <div className="flex items-center gap-1.5 text-xs text-sage font-medium">
          <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />
          Online
        </div>
        <button
          onClick={onChat}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-all hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-gold-700"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Consult
        </button>
      </div>
    </div>
  );
}

export default function AdvisoryPage() {
  const [chatAdvisor, setChatAdvisor] = useState<Advisor | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/8">
          <Sparkles className="h-5 w-5 text-gold-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Advisory Council</h1>
          <p className="text-sm text-navy-500">
            8 AI experts with decades of specialized experience. Ask them anything about your current work.
          </p>
        </div>
      </div>

      {/* AI context note */}
      <div className="flex items-start gap-3 rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
        <Sparkles className="h-4 w-4 shrink-0 text-gold-600 mt-0.5" />
        <div>
          <p className="text-sm text-navy-700">
            Each advisor has a unique perspective shaped by their expertise. They can review your drafts, suggest analytical frameworks,
            anticipate counter-arguments, and provide domain-specific recommendations. Try asking about your current situations.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {advisors.map((advisor) => (
          <AdvisorCard key={advisor.id} advisor={advisor} onChat={() => { setChatAdvisor(advisor); setShowResponse(false); setChatInput(''); }} />
        ))}
      </div>

      {/* Inline Chat Modal */}
      {chatAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setChatAdvisor(null)}>
          <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
          <div
            className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10 max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-serif text-sm font-semibold"
                style={{ backgroundColor: `${chatAdvisor.color}10`, color: chatAdvisor.color, border: `2px solid ${chatAdvisor.color}30` }}
              >
                {chatAdvisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-navy-900">{chatAdvisor.name}</h3>
                <p className="text-[11px]" style={{ color: chatAdvisor.color }}>{chatAdvisor.title}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sage">
                <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />
                Online
              </div>
              <button onClick={() => setChatAdvisor(null)} className="rounded-md p-1 text-navy-400 hover:text-navy-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[200px]">
              {/* Advisor greeting */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                  style={{ backgroundColor: `${chatAdvisor.color}10`, color: chatAdvisor.color }}
                >
                  {chatAdvisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 max-w-lg">
                  <p className="text-sm text-navy-700 leading-relaxed">
                    Hello! I&apos;m {chatAdvisor.name}, {chatAdvisor.title.toLowerCase()}. {chatAdvisor.tagline} How can I help you today?
                  </p>
                </div>
              </div>

              {/* User message */}
              {showResponse && chatInput && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="rounded-xl rounded-tr-none bg-diplomatic-blue px-4 py-3 max-w-lg">
                    <p className="text-sm text-white leading-relaxed">{chatInput}</p>
                  </div>
                </div>
              )}

              {/* Advisor response */}
              {showResponse && sampleResponses[chatAdvisor.id] && (
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                    style={{ backgroundColor: `${chatAdvisor.color}10`, color: chatAdvisor.color }}
                  >
                    {chatAdvisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 max-w-lg">
                    <p className="text-sm text-navy-700 leading-relaxed">
                      {sampleResponses[chatAdvisor.id]}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link href="/reports/new" className="rounded-md bg-diplomatic-blue/8 px-2.5 py-1 text-[10px] font-medium text-diplomatic-blue hover:bg-diplomatic-blue/15 transition-colors">
                        Draft Report
                      </Link>
                      <Link href="/talking-points" className="rounded-md bg-diplomatic-blue/8 px-2.5 py-1 text-[10px] font-medium text-diplomatic-blue hover:bg-diplomatic-blue/15 transition-colors">
                        Talking Points
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--color-app-border)] p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && chatInput) setShowResponse(true); }}
                  placeholder={`Ask ${chatAdvisor.name.split(' ')[0]}...`}
                  className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10"
                  autoFocus
                />
                <button
                  onClick={() => { if (chatInput) setShowResponse(true); }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-diplomatic-blue text-white transition-colors hover:bg-diplomatic-blue/90"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
