'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { BriefBlocksPanel } from '@/components/briefing/brief-blocks-panel';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Maximize,
  X,
  MessageSquare,
  Loader2,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import { CASE_REGISTRY } from '@/lib/constants/case-registry';
import { DEMO_MORNING_BRIEF, type BriefingSlide } from '@/lib/constants/briefing-data';
import type { Situation } from '@/types/situation';

const BRIEFING_TYPES = [
  { id: 'morning', label: 'Morning Intelligence Brief', description: 'Daily situation update for senior leadership' },
  { id: 'security-council', label: 'Security Council Briefing', description: 'Formal briefing for UNSC members' },
  { id: 'emergency', label: 'Emergency Situation Update', description: 'Rapid assessment for crisis response' },
  { id: 'mediation', label: 'Mediation Progress Update', description: 'Track II and mediation process status' },
] as const;

const caseEntries = Object.entries(CASE_REGISTRY).map(([id, c]) => ({
  id,
  name: c.meta.name,
}));

function SlideContent({ slide }: { slide: BriefingSlide }) {
  if (slide.type === 'title') {
    const lines = slide.content.split('\n').filter(Boolean);
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="mb-6 inline-block rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600">
          {lines[lines.length - 1]}
        </span>
        <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">{slide.title}</h1>
        <p className="mt-4 text-lg text-navy-500">{lines[0]}</p>
        <p className="mt-2 text-sm text-navy-400">{lines[1]}</p>
      </div>
    );
  }

  // Format content: render markdown-like bullets and bold
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-3" />;

      // Bold text rendering via dangerouslySetInnerHTML avoided — use simple regex
      const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (trimmed.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 mb-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />
            <span
              className="text-sm text-navy-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatted.slice(2) }}
            />
          </div>
        );
      }

      return (
        <p
          key={i}
          className="text-sm text-navy-700 leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="font-serif text-2xl font-bold text-navy-900 mb-6">{slide.title}</h2>
      <div className="flex-1">{renderContent(slide.content)}</div>
      {slide.sources && slide.sources.length > 0 && (
        <div className="mt-6 border-t border-navy-100 pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-navy-300 mb-1">Sources</p>
          <p className="text-[10px] text-navy-400">{slide.sources.join(' · ')}</p>
        </div>
      )}
    </div>
  );
}

/** Data shape returned by /api/ai/briefing-generate */
interface BriefingData {
  slides: {
    title: string;
    content: string;
    speakerNotes?: string;
    sources?: string[];
  }[];
}

/** Map API slide to the BriefingSlide type used by the renderer */
function toBriefingSlides(data: BriefingData): BriefingSlide[] {
  const SLIDE_TYPES: BriefingSlide['type'][] = [
    'title', 'summary', 'map', 'timeline', 'risk', 'actions', 'discussion',
  ];
  return data.slides.map((s, i) => ({
    id: `slide-${i + 1}`,
    type: SLIDE_TYPES[i] ?? 'summary',
    title: s.title,
    content: s.content,
    speakerNotes: s.speakerNotes ?? '',
    sources: s.sources,
  }));
}

function DemoBriefingPage({ situationName, situation, preloadedSlides }: {
  situationName?: string;
  situation?: Situation;
  preloadedSlides?: BriefingSlide[];
}) {
  const isRealMode = !!situationName;

  const [view, setView] = useState<'builder' | 'presentation'>(() =>
    preloadedSlides ? 'presentation' : 'builder'
  );
  const [selectedCase, setSelectedCase] = useState(caseEntries[0]?.id ?? '');
  const [briefingType, setBriefingType] = useState('morning');
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<BriefingSlide[] | null>(preloadedSlides ?? null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState('');

  // If preloaded slides arrive after mount (AiPopulate completes), pick them up
  useEffect(() => {
    if (preloadedSlides && !slides) {
      setSlides(preloadedSlides);
      setView('presentation');
    }
  }, [preloadedSlides, slides]);

  const handleGenerate = async () => {
    // Real mode: call the API endpoint for live generation
    if (isRealMode && situation) {
      setGenerating(true);
      setNoDataMessage('');
      try {
        const res = await fetch('/api/ai/briefing-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: situation.id,
            briefingType,
            situation,
            conflictContext: `${situation.name}: ${situation.description}. Actors: ${situation.actors.join(', ')}`,
            situationContext: {
              name: situation.name,
              region: situation.region,
              actors: situation.actors,
              riskScore: situation.riskScore,
              escalationTrend: situation.escalationTrend,
              glaslStage: situation.glaslStage,
              description: situation.description,
            },
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Generation failed' }));
          setNoDataMessage(err.error || 'Failed to generate briefing. Please try again.');
          setGenerating(false);
          return;
        }
        const data = (await res.json()) as BriefingData;
        const newSlides = toBriefingSlides(data);
        setSlides(newSlides);
        setCurrentSlide(0);
        setGenerating(false);
        setView('presentation');
      } catch {
        setNoDataMessage('Network error. Please check your connection and try again.');
        setGenerating(false);
      }
      return;
    }

    // Demo mode: only for Nordalia morning brief
    if (briefingType === 'morning' && selectedCase.includes('nordalia')) {
      setGenerating(true);
      setNoDataMessage('');
      setTimeout(() => {
        setSlides(DEMO_MORNING_BRIEF);
        setCurrentSlide(0);
        setGenerating(false);
        setView('presentation');
      }, 1500);
    } else {
      setNoDataMessage('Briefing template coming in production deployment.');
    }
  };

  const goNext = useCallback(() => {
    if (slides && currentSlide < slides.length - 1) setCurrentSlide((s) => s + 1);
  }, [slides, currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide((s) => s - 1);
  }, [currentSlide]);

  useEffect(() => {
    if (view !== 'presentation') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, goNext, goPrev]);

  const handleFullscreen = () => {
    try {
      document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen not supported
    }
  };

  // ─── BUILDER VIEW ───
  if (view === 'builder') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
            <Presentation className="h-5 w-5 text-steel" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Briefing Room</h1>
            <p className="text-sm text-navy-500">
              Generate structured intelligence briefings for leadership and stakeholders.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 space-y-6">
          {/* Case Selector — hidden in real mode (situation already selected) */}
          {isRealMode ? (
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Situation
              </label>
              <div className="rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2.5 text-sm font-medium text-navy-900">
                {situationName}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Select Case
              </label>
              <div className="relative">
                <select
                  value={selectedCase}
                  onChange={(e) => { setSelectedCase(e.target.value); setNoDataMessage(''); }}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  {caseEntries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Briefing Type */}
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Briefing Type
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {BRIEFING_TYPES.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => { setBriefingType(bt.id); setNoDataMessage(''); }}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-all',
                    briefingType === bt.id
                      ? 'border-diplomatic-blue/40 bg-diplomatic-blue/5 ring-2 ring-diplomatic-blue/20'
                      : 'border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-alt)]'
                  )}
                >
                  <p className="text-sm font-semibold text-navy-800">{bt.label}</p>
                  <p className="mt-0.5 text-[11px] text-navy-500">{bt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* No Data Message */}
          {noDataMessage && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {noDataMessage}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-lg bg-diplomatic-blue px-6 py-3 text-sm font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Briefing…
              </>
            ) : (
              <>
                <Presentation className="h-4 w-4" />
                Generate Briefing
              </>
            )}
          </button>
        </div>
        <PoweredByTacitus />
      </div>
    );
  }

  // ─── PRESENTATION VIEW ───
  if (!slides) return null;
  const slide = slides[currentSlide];

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 px-4 py-2">
        <button
          onClick={handleFullscreen}
          className="rounded-lg border border-[var(--color-app-border)] p-2 text-navy-400 hover:text-navy-700 transition-colors"
          title="Fullscreen"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setView('builder'); setSlides(null); setShowNotes(false); }}
          className="rounded-lg border border-[var(--color-app-border)] p-2 text-navy-400 hover:text-navy-700 transition-colors"
          title="Exit Presentation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Slide Area */}
      <div className="flex flex-1 items-center justify-center px-4 pb-4">
        <div className="w-full max-w-4xl rounded-xl border border-[var(--color-app-border)] bg-white p-10 shadow-sm min-h-[500px]">
          <SlideContent slide={slide} />
        </div>
      </div>

      {/* Speaker Notes Panel */}
      {showNotes && slide.speakerNotes && (
        <div className="border-t border-[var(--color-app-border)] bg-gray-100 px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-400 mb-1">Speaker Notes</p>
          <p className="text-sm italic text-navy-600 leading-relaxed">{slide.speakerNotes}</p>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="flex items-center justify-between border-t border-[var(--color-app-border)] bg-white px-6 py-3">
        {/* Previous */}
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-navy-600 hover:bg-[var(--color-app-surface-alt)] disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Slide dots + counter */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i === currentSlide ? 'bg-diplomatic-blue scale-125' : 'bg-navy-200 hover:bg-navy-300'
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-navy-400">
            {currentSlide + 1} of {slides.length}
          </span>
        </div>

        {/* Speaker Notes toggle + Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              'flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors',
              showNotes
                ? 'bg-diplomatic-blue/10 text-diplomatic-blue'
                : 'text-navy-400 hover:text-navy-600 hover:bg-[var(--color-app-surface-alt)]'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Notes
          </button>
          <button
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-navy-600 hover:bg-[var(--color-app-surface-alt)] disabled:opacity-30 transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-14 left-4 text-navy-400 text-[10px]">
        PRAXIS Intelligence Platform
      </div>
      <PoweredByTacitus />
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

function RealBriefingPage({ situation }: { situation: Situation }) {
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);

  const preloadedSlides = briefingData ? toBriefingSlides(briefingData) : undefined;

  return (
    <>
    <RegistryToolInfo toolId="briefing" />
    <BriefBlocksPanel situation={situation} />
    <AiPopulate
      toolId="briefing"
      toolName="Briefing"
      apiEndpoint="/api/ai/briefing-generate"
      extraBody={{
        caseId: situation.id,
        briefingType: 'morning',
        situation,
        conflictContext: `${situation.name}: ${situation.description}. Actors: ${situation.actors.join(', ')}`,
        situationContext: {
          name: situation.name,
          region: situation.region,
          actors: situation.actors,
          riskScore: situation.riskScore,
          escalationTrend: situation.escalationTrend,
          glaslStage: situation.glaslStage,
          description: situation.description,
        },
      }}
      creditCost={3}
      hasExistingData={!!briefingData}
      onDataGenerated={(data) => setBriefingData(data as BriefingData)}
    >
      <DemoBriefingPage
        situationName={situation.name}
        situation={situation}
        preloadedSlides={preloadedSlides}
      />
    </AiPopulate>
    </>
  );
}

export default function BriefingPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const { hasData, loading: firestoreLoading } = useToolData('briefing');
  const [regenerating, setRegenerating] = useState(false);

  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoBriefingPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/briefing-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  // Real mode — AI populate prompt, then show tool
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Presentation className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>
      <RealBriefingPage situation={situation} />
    </div>
  );
}
