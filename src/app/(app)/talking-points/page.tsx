'use client';

import { useState } from 'react';
import { MessageCircle, Sparkles, Copy, FileText, Users, Shield, Check, Download, RefreshCw, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

const toneOptions = [
  { id: 'council', label: 'For Security Council', icon: Shield, description: 'Formal, measured, mandate-focused' },
  { id: 'press', label: 'For Press Briefing', icon: Users, description: 'Clear, quotable, public-facing' },
  { id: 'bilateral', label: 'For Bilateral Meeting', icon: MessageCircle, description: 'Diplomatic, candid, relationship-aware' },
  { id: 'internal', label: 'For Internal Strategy', icon: FileText, description: 'Frank, analytical, option-oriented' },
];

const situationOptions = [
  { id: 'nordalia', label: 'The Nordalia Crisis', risk: 8.2 },
  { id: 'sudan', label: 'Sudan Conflict', risk: 8.5 },
  { id: 'drc', label: 'DRC / M23', risk: 7.6 },
  { id: 'sahel', label: 'Sahel Security', risk: 7.8 },
  { id: 'custom', label: 'Custom input...', risk: 0 },
];

const sampleOutput = {
  keyMessages: [
    "The humanitarian situation in eastern Nordalia has deteriorated sharply since the collapse of the February ceasefire, with 240,000 new displacements recorded in the past two weeks alone.",
    "The DRM's seizure of the Belara mining complex represents a dangerous escalation that threatens both the ceasefire framework and regional economic stability.",
    "The international community must act decisively to prevent a return to full-scale hostilities — the window for diplomatic intervention is narrowing rapidly.",
    "We call on all parties to recommit to the Framework Agreement and engage constructively with the Special Representative's mediation efforts.",
  ],
  evidence: [
    { text: "OCHA reports 240,000 new IDPs since Feb 14", source: "OCHA SITREP #47", strength: "strong" as const },
    { text: "DRM forces control 3 of 5 mining sites in Belara Province", source: "UNMISS Security Report", strength: "strong" as const },
    { text: "Framework Agreement violations documented by UNMISS", source: "S/2026/115", strength: "strong" as const },
    { text: "Regional economic impact estimated at $2.4B annually", source: "World Bank Analysis", strength: "moderate" as const },
  ],
  counterArguments: [
    "The Government may argue the DRM provoked the escalation through cross-border arms procurement — be prepared to acknowledge the complexity while maintaining focus on civilian protection.",
    "Karovia will likely push back on characterizations of 'external interference' — frame concerns as 'regional security implications' rather than direct accusations.",
  ],
  sensitivities: [
    "Avoid directly naming Karovian officials linked to arms transfers until the Panel of Experts report is public.",
    "The Government is sensitive about sovereignty language — use 'partnership' framing rather than 'intervention'.",
    "Electoral timeline creates additional sensitivities around any language that could be seen as delegitimizing.",
  ],
  advisorNotes: [
    { advisor: 'Amb. Tanaka', note: 'Consider opening with a reference to the Framework Agreement\'s achievements before addressing violations. This framing has historically been more effective with the Government delegation.' },
    { advisor: 'Dr. Hassan', note: 'Under Resolution 2677, the mandate explicitly covers protection of civilians in mining areas. This provides a strong legal basis for the third talking point.' },
  ],
};

const strengthConfig = {
  strong: { bg: 'bg-sage/8', text: 'text-sage', border: 'border-sage/20' },
  moderate: { bg: 'bg-gold-500/8', text: 'text-gold-600', border: 'border-gold-500/20' },
  weak: { bg: 'bg-crimson/8', text: 'text-crimson', border: 'border-crimson/20' },
};

export default function TalkingPointsPage() {
  const [selectedTone, setSelectedTone] = useState('council');
  const [selectedSituation, setSelectedSituation] = useState('nordalia');
  const [inputText, setInputText] = useState('');
  const [showOutput, setShowOutput] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/8">
          <MessageCircle className="h-5 w-5 text-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Talking Points Generator</h1>
          <p className="text-sm text-navy-500">
            Auto-generate structured talking points with sourced evidence, anticipated counter-arguments, and advisor insights
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input panel */}
        <div className="space-y-4">
          {/* Situation selector */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Select Situation</h3>
            <div className="space-y-1.5">
              {situationOptions.map((sit) => (
                <button
                  key={sit.id}
                  onClick={() => setSelectedSituation(sit.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                    selectedSituation === sit.id
                      ? 'bg-diplomatic-blue/8 text-diplomatic-blue border border-diplomatic-blue/20 font-medium'
                      : 'text-navy-600 hover:bg-[var(--color-app-surface-alt)] border border-transparent'
                  )}
                >
                  <span className="flex-1 text-left">{sit.label}</span>
                  {sit.risk > 0 && (
                    <span className={cn(
                      'text-[10px] font-mono font-semibold',
                      sit.risk >= 8 ? 'text-crimson' : sit.risk >= 6 ? 'text-gold-600' : 'text-sage'
                    )}>
                      {sit.risk}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Additional context */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Additional Context</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Add specific context, instructions, or paste a brief..."
              className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10"
              rows={4}
            />
          </div>

          {/* Tone selector */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Tone & Audience</h3>
            <div className="space-y-1.5">
              {toneOptions.map((tone) => {
                const Icon = tone.icon;
                return (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                      selectedTone === tone.id
                        ? 'bg-teal/8 text-teal border border-teal/20 font-medium'
                        : 'text-navy-600 hover:bg-[var(--color-app-surface-alt)] border border-transparent'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="text-left">
                      <span className="block">{tone.label}</span>
                      <span className="text-[10px] text-navy-400">{tone.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowOutput(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-diplomatic-blue px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-diplomatic-blue/90 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Generate Talking Points
          </button>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-2 space-y-4">
          {showOutput && (
            <>
              {/* Key Messages */}
              <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">Key Messages</h3>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors">
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </button>
                    <button className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors">
                      <Download className="h-3 w-3" />
                      Export
                    </button>
                  </div>
                </div>
                <ol className="space-y-3">
                  {sampleOutput.keyMessages.map((msg, i) => (
                    <li key={i} className="group flex items-start gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-[var(--color-app-surface-alt)]">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-diplomatic-blue/8 text-[11px] font-bold text-diplomatic-blue">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm text-navy-700 leading-relaxed">{msg}</p>
                      <button
                        onClick={() => handleCopy(msg, i)}
                        className="shrink-0 rounded-md p-1.5 text-navy-300 opacity-0 transition-all group-hover:opacity-100 hover:text-navy-600 hover:bg-navy-100"
                      >
                        {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-sage" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Supporting Evidence */}
              <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-navy-900">Supporting Evidence</h3>
                <div className="space-y-2">
                  {sampleOutput.evidence.map((ev, i) => {
                    const sConfig = strengthConfig[ev.strength];
                    return (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize', sConfig.bg, sConfig.text, sConfig.border)}>
                          {ev.strength}
                        </span>
                        <div>
                          <p className="text-xs text-navy-700">{ev.text}</p>
                          <p className="mt-1 text-[10px] text-navy-400">Source: {ev.source}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advisor Notes */}
              <div className="rounded-xl border border-gold-500/15 bg-gold-500/4 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-600" />
                  <h3 className="text-sm font-semibold text-navy-900">Advisor Insights</h3>
                </div>
                <div className="space-y-3">
                  {sampleOutput.advisorNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-gold-500/15 bg-white p-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-[10px] font-bold text-gold-700">
                        {note.advisor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gold-700 mb-0.5">{note.advisor}</p>
                        <p className="text-xs text-navy-700 leading-relaxed">{note.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter-arguments & Sensitivities */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-teal" />
                    <h3 className="text-sm font-semibold text-navy-900">Counter-Arguments</h3>
                  </div>
                  <ul className="space-y-2">
                    {sampleOutput.counterArguments.map((arg, i) => (
                      <li key={i} className="text-xs text-navy-600 leading-relaxed pl-3 border-l-2 border-teal/20">{arg}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-crimson/15 bg-crimson/3 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-crimson" />
                    <h3 className="text-sm font-semibold text-navy-900">Red Lines & Sensitivities</h3>
                  </div>
                  <ul className="space-y-2">
                    {sampleOutput.sensitivities.map((s, i) => (
                      <li key={i} className="text-xs text-navy-600 leading-relaxed pl-3 border-l-2 border-crimson/20">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
