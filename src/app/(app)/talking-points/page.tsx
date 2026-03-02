'use client';

import { useState } from 'react';
import { MessageCircle, Sparkles, Copy, FileText, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';

const toneOptions = [
  { id: 'council', label: 'For Security Council', icon: Shield },
  { id: 'press', label: 'For Press Briefing', icon: Users },
  { id: 'bilateral', label: 'For Bilateral Meeting', icon: MessageCircle },
  { id: 'internal', label: 'For Internal Strategy', icon: FileText },
];

const sampleOutput = {
  keyMessages: [
    "The humanitarian situation in eastern Nordalia has deteriorated sharply since the collapse of the February ceasefire, with 240,000 new displacements recorded in the past two weeks alone.",
    "The DRM's seizure of the Belara mining complex represents a dangerous escalation that threatens both the ceasefire framework and regional economic stability.",
    "The international community must act decisively to prevent a return to full-scale hostilities — the window for diplomatic intervention is narrowing rapidly.",
    "We call on all parties to recommit to the Framework Agreement and engage constructively with the Special Representative's mediation efforts.",
  ],
  evidence: [
    { text: "OCHA reports 240,000 new IDPs since Feb 14", source: "OCHA SITREP #47", strength: "strong" },
    { text: "DRM forces control 3 of 5 mining sites in Belara Province", source: "UNMISS Security Report", strength: "strong" },
    { text: "Framework Agreement violations documented by UNMISS", source: "S/2026/115", strength: "strong" },
    { text: "Regional economic impact estimated at $2.4B annually", source: "World Bank Analysis", strength: "moderate" },
  ],
  counterArguments: [
    "The Government may argue the DRM provoked the escalation through cross-border arms procurement — be prepared to acknowledge the complexity while maintaining focus on civilian protection.",
    "Karovia will likely push back on characterizations of 'external interference' — frame concerns as 'regional security implications' rather than direct accusations.",
  ],
  sensitivities: [
    "Avoid directly naming Karovian officials linked to arms transfers until the Panel of Experts report is public.",
    "The Government is sensitive about sovereignty language — use 'partnership' framing rather than 'intervention'.",
  ],
};

export default function TalkingPointsPage() {
  const [selectedTone, setSelectedTone] = useState('council');
  const [inputText, setInputText] = useState('');
  const [showOutput, setShowOutput] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-teal" />
          <h1 className="text-2xl font-semibold text-navy-50">Talking Points Generator</h1>
        </div>
        <p className="mt-1 text-sm text-navy-400">
          Auto-generate structured talking points with sourced references and rhetorical framing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-100">Input Brief</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste a brief, or describe the situation you need talking points for..."
              className="w-full rounded-md border border-navy-700/50 bg-navy-900/60 px-3 py-2.5 text-sm text-navy-200 placeholder:text-navy-500 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
              rows={6}
            />
            <p className="mt-2 text-[10px] text-navy-500">
              Or select from recent reports and situations
            </p>
          </div>

          <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-100">Tone & Context</h3>
            <div className="space-y-2">
              {toneOptions.map((tone) => {
                const Icon = tone.icon;
                return (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                      selectedTone === tone.id
                        ? 'bg-teal/10 text-teal border border-teal/20'
                        : 'text-navy-400 hover:bg-navy-700/30 border border-transparent'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tone.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowOutput(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-navy-950 transition-all hover:bg-gold-400"
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
              <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-100">Key Messages</h3>
                  <button className="flex items-center gap-1.5 text-[10px] text-navy-400 hover:text-navy-200">
                    <Copy className="h-3 w-3" />
                    Copy All
                  </button>
                </div>
                <ol className="space-y-3">
                  {sampleOutput.keyMessages.map((msg, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/10 text-[10px] font-bold text-teal">
                        {i + 1}
                      </span>
                      <p className="text-sm text-navy-200 leading-relaxed">{msg}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Supporting Evidence */}
              <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-5">
                <h3 className="mb-4 text-sm font-semibold text-navy-100">Supporting Evidence</h3>
                <div className="space-y-2">
                  {sampleOutput.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md bg-navy-900/40 p-3">
                      <Badge variant={ev.strength === 'strong' ? 'sage' : 'gold'} className="shrink-0 text-[9px]">
                        {ev.strength}
                      </Badge>
                      <div>
                        <p className="text-xs text-navy-200">{ev.text}</p>
                        <p className="mt-1 text-[10px] text-navy-500">Source: {ev.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter-arguments & Sensitivities */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-navy-100">Anticipated Counter-Arguments</h3>
                  <ul className="space-y-2">
                    {sampleOutput.counterArguments.map((arg, i) => (
                      <li key={i} className="text-xs text-navy-300 leading-relaxed">{arg}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-crimson/20 bg-navy-800 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-crimson/80">Red Lines & Sensitivities</h3>
                  <ul className="space-y-2">
                    {sampleOutput.sensitivities.map((s, i) => (
                      <li key={i} className="text-xs text-navy-300 leading-relaxed">{s}</li>
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
