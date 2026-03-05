'use client';

import { useState, useRef } from 'react';
import { MessageCircle, Sparkles, Copy, FileText, Users, Shield, Check, Download, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

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

const TONE_LABELS: Record<string, string> = {
  council: 'Security Council',
  press: 'Press Briefing',
  bilateral: 'Bilateral Meeting',
  internal: 'Internal Strategy',
};

function parseDataStreamChunk(raw: string): string {
  return raw
    .split('\n')
    .filter((l) => l.startsWith('0:'))
    .map((l) => { try { return JSON.parse(l.slice(2)); } catch { return ''; } })
    .join('');
}

export default function TalkingPointsPage() {
  const [selectedTone, setSelectedTone] = useState('council');
  const [selectedSituation, setSelectedSituation] = useState('nordalia');
  const [customSituation, setCustomSituation] = useState('');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const situationLabel = selectedSituation === 'custom'
    ? customSituation
    : (situationOptions.find((s) => s.id === selectedSituation)?.label ?? selectedSituation);

  async function handleGenerate() {
    if (isGenerating) { abortRef.current?.abort(); return; }
    const situation = situationLabel.trim();
    if (!situation) return;

    setIsGenerating(true);
    setOutput('');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/ai/talking-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          audience: TONE_LABELS[selectedTone] ?? selectedTone,
          tone: selectedTone,
          context: inputText || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error('API error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setOutput(accumulated);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setOutput('**Error:** Failed to generate talking points. Please check your API key and try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopyAll() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    if (!output) return;
    const blob = new Blob([`# Talking Points — ${situationLabel}\n**Audience:** ${TONE_LABELS[selectedTone]}\n\n${output}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talking-points-${selectedSituation}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
            AI-generated structured talking points with key messages, evidence, anticipated Q&amp;A, and sensitivities
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input panel */}
        <div className="space-y-4">
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
                    <span className={cn('text-[10px] font-mono font-semibold', sit.risk >= 8 ? 'text-crimson' : sit.risk >= 6 ? 'text-gold-600' : 'text-sage')}>
                      {sit.risk}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedSituation === 'custom' && (
              <input
                value={customSituation}
                onChange={(e) => setCustomSituation(e.target.value)}
                className="mt-3 w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500/10"
                placeholder="Describe the situation..."
              />
            )}
          </div>

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

          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Tone &amp; Audience</h3>
            <div className="space-y-1.5">
              {toneOptions.map((tone) => {
                const Icon = tone.icon;
                return (
                  <button key={tone.id} onClick={() => setSelectedTone(tone.id)}
                    className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                      selectedTone === tone.id ? 'bg-teal/8 text-teal border border-teal/20 font-medium' : 'text-navy-600 hover:bg-[var(--color-app-surface-alt)] border border-transparent'
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
            onClick={handleGenerate}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all shadow-sm',
              isGenerating ? 'bg-crimson/80 hover:bg-crimson' : 'bg-diplomatic-blue hover:bg-diplomatic-blue/90'
            )}
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Stop Generation</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generate Talking Points</>
            )}
          </button>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-2 space-y-4">
          {(output || isGenerating) ? (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-500" />
                  <h3 className="text-sm font-semibold text-navy-900">Talking Points — {situationLabel}</h3>
                  <span className="rounded-full bg-teal/8 px-2 py-0.5 text-[10px] font-medium text-teal">{TONE_LABELS[selectedTone]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleGenerate} disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors disabled:opacity-40">
                    <RefreshCw className="h-3 w-3" />Regenerate
                  </button>
                  <button onClick={handleCopyAll}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors">
                    {copied ? <Check className="h-3 w-3 text-sage" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy All'}
                  </button>
                  <button onClick={handleExport} disabled={isGenerating || !output}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors disabled:opacity-40">
                    <Download className="h-3 w-3" />Export
                  </button>
                </div>
              </div>

              {isGenerating && !output && (
                <div className="flex items-center gap-2 text-sm text-navy-400 py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />Generating talking points...
                </div>
              )}

              {output && (
                <div className="relative">
                  <MarkdownRenderer content={output} className="text-sm" />
                  {isGenerating && <span className="inline-block w-0.5 h-4 bg-gold-400 animate-pulse ml-0.5 align-text-bottom" />}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-app-border)] bg-white">
                <MessageCircle className="h-6 w-6 text-navy-400" />
              </div>
              <h3 className="font-serif text-lg font-medium text-navy-900">No talking points yet</h3>
              <p className="mt-1 max-w-sm text-sm text-navy-500">Select a situation and audience, then generate AI-powered diplomatic talking points.</p>
              <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-gold-500/15 bg-gold-500/4 px-3 py-2 text-xs text-gold-700">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />Powered by Gemini 2.5 Flash · Grounded in UN diplomatic standards
              </div>
            </div>
          )}

          {output && !isGenerating && (
            <>
              <div className="flex items-center gap-2 text-[11px] text-navy-400">
                <Sparkles className="h-3 w-3 text-gold-500" />AI-generated content. Review before use in official communications.
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-crimson/10 bg-crimson/3 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                <div>
                  <p className="text-xs font-semibold text-navy-900">Review Required</p>
                  <p className="mt-0.5 text-xs text-navy-600">These talking points are AI-generated and require review by a qualified diplomatic officer. Verify all factual claims against primary sources.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
