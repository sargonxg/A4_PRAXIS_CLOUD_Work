'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useRef, useCallback } from 'react';
import { MessageCircle, Sparkles, Copy, FileText, Users, Shield, Check, Download, RefreshCw, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

interface AudienceOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  tone: string;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: 'council',
    label: 'Security Council',
    icon: Shield,
    description: 'Formal, measured, mandate-focused',
    tone: 'Use formal UN language, cite resolution numbers, reference Chapter VII provisions. Emphasize collective security and multilateral legitimacy. Avoid attribution without documentation.',
  },
  {
    id: 'press',
    label: 'Press Briefing',
    icon: Users,
    description: 'Clear, quotable, public-facing',
    tone: 'Use plain language accessible to non-experts. Make points quotable in 15 seconds or less. Avoid jargon. Anticipate critical follow-up questions. Maintain factual precision.',
  },
  {
    id: 'bilateral',
    label: 'Bilateral Meeting',
    icon: MessageCircle,
    description: 'Diplomatic, relationship-aware',
    tone: 'Balance candor with diplomatic courtesy. Acknowledge shared interests before raising concerns. Leave space for the counterpart to respond constructively. Avoid ultimatums.',
  },
  {
    id: 'internal',
    label: 'Internal Strategy',
    icon: FileText,
    description: 'Frank, analytical, option-oriented',
    tone: 'Be direct and unsparing in the assessment. Present options with honest trade-offs. Name specific actors and their likely behavior. This is for internal use only — no diplomatic hedging.',
  },
];

interface TopicOption {
  id: string;
  label: string;
  context: string;
}

const TOPIC_OPTIONS: TopicOption[] = [
  { id: 'ceasefire', label: 'DRM-Government ceasefire status', context: 'The ceasefire brokered in February 2026 is fragile. DRM forces have made three reported incursions. Government forces have shelled two villages in violation. Both parties publicly claim adherence.' },
  { id: 'mandate', label: 'UNMN mandate renewal', context: 'UNMN mandate expires 31 March 2026 (in 19 days). France and Kenya co-sponsor renewal resolution. P5 member has threatened veto without ROE restrictions. TCCs want Chapter VII strengthening.' },
  { id: 'humanitarian', label: 'Humanitarian access crisis', context: 'MSF expelled from eastern provinces 14 February. WFP convoys blocked 8 times in 6 weeks. 340,000 civilians without sustained access. OCHA estimates 2.1 million food-insecure.' },
  { id: 'karovia', label: 'Karovia military support allegations', context: 'Credible reports of Karovian military advisors embedded with DRM command. Arms shipments via Lake Kessara documented by Panel of Experts. Karovia denies involvement.' },
  { id: 'framework', label: 'Framework Agreement implementation', context: 'Framework Agreement signed November 2025. Ceasefire, prisoner exchange (paused), joint monitoring. DRM has not formed its side of joint verification commission. 4 of 12 benchmarks met.' },
  { id: 'custom', label: 'Custom topic...', context: '' },
];

const CONFLICT_OPTIONS = [
  { id: 'nordalia', label: 'Nordalia Crisis', riskScore: 7.8 },
  { id: 'sahel', label: 'Sahel Security Complex', riskScore: 6.2 },
  { id: 'scs', label: 'South China Sea Tensions', riskScore: 5.8 },
  { id: 'kolari', label: 'Kolari-Barantum Border Dispute', riskScore: 3.2 },
];

export default function TalkingPointsPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [selectedAudience, setSelectedAudience] = useState('council');
  const [selectedTopic, setSelectedTopic] = useState('ceasefire');
  const [selectedConflict, setSelectedConflict] = useState('nordalia');
  const [customTopic, setCustomTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const audienceOption = AUDIENCE_OPTIONS.find((a) => a.id === selectedAudience)!;
  const topicOption = TOPIC_OPTIONS.find((t) => t.id === selectedTopic)!;
  const conflictOption = CONFLICT_OPTIONS.find((c) => c.id === selectedConflict)!;

  const topicLabel = selectedTopic === 'custom' ? customTopic : topicOption?.label ?? '';
  const topicContext = selectedTopic === 'custom' ? additionalContext : topicOption?.context ?? '';

  const handleGenerate = useCallback(async () => {
    if (isGenerating) { abortRef.current?.abort(); return; }
    if (!topicLabel.trim()) return;

    setIsGenerating(true);
    setOutput('');
    const controller = new AbortController();
    abortRef.current = controller;

    const prompt = `Generate talking points for: ${topicLabel}
Audience: ${audienceOption.label}
Conflict context: ${conflictOption.label}
Current situation: DRM advancing, ceasefire fragile, UNMN mandate renewal in 19 days, Karovia proxy involvement suspected, Framework Agreement partially implemented.
${topicContext ? `Topic-specific context: ${topicContext}` : ''}
${additionalContext && selectedTopic !== 'custom' ? `Additional context: ${additionalContext}` : ''}

Tone guidance: ${audienceOption.tone}

Format output with exactly THREE sections:

## Key Messages
3-4 bullet points with supporting evidence and specific data points. Each bullet should stand alone as a complete talking point.

## If Asked
5 anticipated questions with concise, precise answers. Format as:
**Q: [question]**
A: [answer]

## Do Not Say
3-4 red-line topics or formulations to avoid, with brief explanation of why each is problematic for this audience.`;

    try {
      const response = await fetch('/api/ai/talking-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: topicLabel,
          audience: audienceOption.label,
          tone: selectedAudience,
          context: prompt,
        }),
        signal: controller.signal,
      });

      // Fall back to generic chat endpoint if talking-points endpoint not available
      const res = response.ok ? response : await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('API error');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setOutput(accumulated); }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setOutput('**Error:** Failed to generate talking points. Please check your connection and try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, topicLabel, topicContext, audienceOption, conflictOption, selectedAudience, selectedTopic, additionalContext]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    const text = `# Talking Points — ${topicLabel}\n**Audience:** ${audienceOption.label} | **Conflict:** ${conflictOption.label}\n\n${output}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output, topicLabel, audienceOption, conflictOption]);

  const handleExport = useCallback(() => {
    if (!output) return;
    const blob = new Blob([`# Talking Points — ${topicLabel}\n**Audience:** ${audienceOption.label}\n**Conflict:** ${conflictOption.label}\n\n${output}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talking-points-${selectedTopic}-${selectedAudience}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, topicLabel, audienceOption, conflictOption, selectedTopic, selectedAudience]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/8">
          <MessageCircle className="h-5 w-5 text-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Talking Points Generator</h1>
          <p className="text-sm text-navy-500">
            AI-structured talking points with key messages, anticipated Q&amp;A, and red-line guidance
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left panel — configuration */}
        <div className="space-y-4">
          {/* Audience selector */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Audience</h3>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = selectedAudience === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedAudience(opt.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                      isActive
                        ? 'border-teal/30 bg-teal/5 text-teal'
                        : 'border-[var(--color-app-border)] text-navy-600 hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-teal' : 'text-navy-400')} />
                    <span className={cn('text-xs font-semibold', isActive ? 'text-teal' : 'text-navy-800')}>{opt.label}</span>
                    <span className="text-[10px] leading-tight text-navy-400">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conflict selector */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Conflict Context</h3>
            <div className="relative">
              <select
                value={selectedConflict}
                onChange={(e) => setSelectedConflict(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal/10"
              >
                {CONFLICT_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label} (Risk: {c.riskScore})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
            </div>
          </div>

          {/* Topic selector */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Topic</h3>
            <div className="space-y-1.5">
              {TOPIC_OPTIONS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all',
                    selectedTopic === topic.id
                      ? 'border-diplomatic-blue/25 bg-diplomatic-blue/6 font-medium text-diplomatic-blue'
                      : 'border-transparent text-navy-600 hover:bg-[var(--color-app-surface-alt)]'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', selectedTopic === topic.id ? 'bg-diplomatic-blue' : 'bg-navy-300')} />
                  {topic.label}
                </button>
              ))}
            </div>
            {selectedTopic === 'custom' && (
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="mt-3 w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-teal/10"
                placeholder="Describe the topic..."
              />
            )}
          </div>

          {/* Additional context */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-navy-900">Additional Context</h3>
            <p className="mb-3 text-xs text-navy-400">Add specific instructions, red lines, or paste a brief</p>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. Avoid mentioning Chapter VII language. Counterpart is skeptical of UNMN. Emphasize economic cost of continued conflict..."
              className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/10"
              rows={4}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topicLabel.trim()}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all shadow-sm',
              isGenerating ? 'bg-crimson/80 hover:bg-crimson' : 'bg-diplomatic-blue hover:bg-diplomatic-blue/90 disabled:opacity-50'
            )}
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Stop Generation</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generate Talking Points</>
            )}
          </button>
        </div>

        {/* Right panel — output */}
        <div className="lg:col-span-2 space-y-4">
          {(output || isGenerating) ? (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="h-4 w-4 text-gold-500" />
                  <h3 className="text-sm font-semibold text-navy-900">{topicLabel}</h3>
                  <span className="rounded-full bg-teal/8 px-2 py-0.5 text-[10px] font-medium text-teal">
                    {audienceOption.label}
                  </span>
                  <span className="rounded-full bg-diplomatic-blue/8 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue">
                    {conflictOption.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="h-3 w-3" />Regenerate
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-sage" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isGenerating || !output}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--color-app-surface-alt)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition-colors disabled:opacity-40"
                  >
                    <Download className="h-3 w-3" />Export
                  </button>
                </div>
              </div>

              {isGenerating && !output && (
                <div className="flex items-center gap-2 py-8 text-sm text-navy-400 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-teal" />
                  Generating talking points for {audienceOption.label}...
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-app-border)] bg-white">
                <MessageCircle className="h-6 w-6 text-navy-400" />
              </div>
              <h3 className="font-serif text-lg font-medium text-navy-900">No talking points yet</h3>
              <p className="mt-1 max-w-sm text-sm text-navy-500">
                Select an audience, conflict context, and topic — then generate structured AI talking points with key messages, Q&amp;A, and red lines.
              </p>
              <div className="mt-6 space-y-2 text-left w-full max-w-xs">
                {[
                  { label: 'Key Messages', desc: '3-4 bullet points with evidence' },
                  { label: 'If Asked', desc: '5 anticipated Q&A pairs' },
                  { label: 'Do Not Say', desc: '3-4 red-line topics to avoid' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5">
                    <div className="h-6 w-6 shrink-0 rounded-md bg-teal/8 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-teal" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-800">{label}</p>
                      <p className="text-[10px] text-navy-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-1.5 rounded-lg border border-gold-500/15 bg-gold-500/4 px-3 py-2 text-xs text-gold-700">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Grounded in UN diplomatic standards and Nordalia context
              </div>
            </div>
          )}

          {output && !isGenerating && (
            <>
              <div className="flex items-center gap-2 text-[11px] text-navy-400">
                <Sparkles className="h-3 w-3 text-gold-500" />
                AI-generated content. Review before use in official communications.
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-crimson/10 bg-crimson/3 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                <div>
                  <p className="text-xs font-semibold text-navy-900">Review Required</p>
                  <p className="mt-0.5 text-xs text-navy-600">These talking points are AI-generated and require review by a qualified diplomatic officer before use in official communications. Verify all factual claims against primary sources.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
