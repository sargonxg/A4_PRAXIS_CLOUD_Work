"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { BiasIndicator } from "./bias-indicator";
import {
  X,
  Globe,
  Building2,
  MapPin,
  BarChart3,
  AlertTriangle,
  Shield,
  Languages,
  ArrowRight,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react";

export interface MediaSource {
  name: string;
  x: number; // political orientation -1 to 1
  y: number; // reliability 0 to 1
  type: string;
  region: string;
  color: string;
  knownBiases?: string[];
  coverageStrengths?: string[];
  languages?: string[];
  country?: string;
  description?: string;
}

// Extended info for sources (in a real app this would come from an API)
const EXTENDED_INFO: Record<
  string,
  {
    country: string;
    description: string;
    knownBiases: string[];
    coverageStrengths: string[];
    languages: string[];
  }
> = {
  Reuters: {
    country: "United Kingdom",
    description:
      "International news organization providing real-time reporting across all media platforms.",
    knownBiases: ["Minimal detectable bias", "Western framing on some global issues"],
    coverageStrengths: ["Breaking news", "Financial markets", "Global conflicts"],
    languages: ["English", "Arabic", "French", "Spanish", "Chinese"],
  },
  AP: {
    country: "United States",
    description:
      "Not-for-profit news cooperative, one of the largest and most trusted sources of independent newsgathering.",
    knownBiases: ["Minimal detectable bias", "US-centric framing on domestic issues"],
    coverageStrengths: ["Breaking news", "Elections", "US domestic policy"],
    languages: ["English", "Spanish", "Arabic"],
  },
  AFP: {
    country: "France",
    description:
      "One of the world's oldest and largest news agencies, providing multimedia content in six languages.",
    knownBiases: ["Francophone world emphasis", "European perspective"],
    coverageStrengths: ["Africa", "Europe", "Middle East"],
    languages: ["English", "French", "Arabic", "Spanish", "Portuguese", "German"],
  },
  BBC: {
    country: "United Kingdom",
    description:
      "British public service broadcaster and the world's oldest national broadcaster.",
    knownBiases: ["UK government influence debates", "Slight left-of-center framing"],
    coverageStrengths: ["International affairs", "Investigative journalism", "Documentary"],
    languages: ["English", "Arabic", "Hindi", "Swahili", "Russian", "Chinese"],
  },
  "Al Jazeera": {
    country: "Qatar",
    description:
      "Qatari state-funded media network offering news coverage from a Middle Eastern perspective.",
    knownBiases: ["Qatari foreign policy alignment", "Sympathetic to political Islam movements"],
    coverageStrengths: ["Middle East conflicts", "Arab Spring", "Palestinian issues"],
    languages: ["Arabic", "English", "Turkish", "Bosnian"],
  },
  NYT: {
    country: "United States",
    description:
      "American newspaper of record with global reach and in-depth investigative reporting.",
    knownBiases: ["Liberal-leaning editorial board", "Urban-elite perspective"],
    coverageStrengths: ["Investigations", "US politics", "Culture and arts"],
    languages: ["English", "Spanish", "Chinese"],
  },
  "Fox News": {
    country: "United States",
    description:
      "American conservative cable news channel and media company.",
    knownBiases: ["Strong conservative editorial stance", "Republican party alignment"],
    coverageStrengths: ["US conservative politics", "Immigration", "Law enforcement"],
    languages: ["English"],
  },
  RT: {
    country: "Russia",
    description:
      "Russian state-controlled international television network funded by the Russian government.",
    knownBiases: ["Kremlin narrative alignment", "Anti-Western framing", "Disinformation concerns"],
    coverageStrengths: ["Russian perspective", "Western criticism", "Alternative narratives"],
    languages: ["English", "Arabic", "Spanish", "French", "German"],
  },
  CGTN: {
    country: "China",
    description:
      "Chinese state-owned media network providing coverage from Beijing's perspective.",
    knownBiases: ["CCP narrative alignment", "Suppression of sensitive topics"],
    coverageStrengths: ["Chinese economy", "Belt and Road", "Asia-Pacific affairs"],
    languages: ["English", "Chinese", "Arabic", "French", "Spanish", "Russian"],
  },
};

function getExtendedInfo(name: string) {
  return (
    EXTENDED_INFO[name] ?? {
      country: "—",
      description: "Detailed profile information not yet available for this source.",
      knownBiases: ["Profile under review"],
      coverageStrengths: ["General news"],
      languages: ["English"],
    }
  );
}

const TYPE_LABELS: Record<string, string> = {
  wire: "Wire Service",
  public: "Public Broadcaster",
  private: "Private Media",
  state: "State-Affiliated",
  international_org: "International Organization",
};

interface AiAnalysis {
  politicalOrientation: number;
  reliability: number;
  editorialIndependence: number;
  ownershipType: string;
  country: string;
  description: string;
  knownBiases: string[];
  coverageStrengths: string[];
  conflictCoverageNotes: string;
  recommendedCrossReferences: string[];
}

interface SourceCardProps {
  source: MediaSource | null;
  onClose: () => void;
  className?: string;
}

export function SourceCard({ source, onClose, className }: SourceCardProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedSource, setAnalyzedSource] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!source || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/ai/media-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiAnalysis(data.assessment);
      setAnalyzedSource(source.name);
    } catch {
      setAnalysisError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset analysis when source changes
  const currentAnalysis = analyzedSource === source?.name ? aiAnalysis : null;

  return (
    <AnimatePresence mode="wait">
      {source && (
        <motion.div
          key={source.name}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "rounded-xl border border-navy-700/60 bg-navy-900/95 p-5 backdrop-blur-md",
            className
          )}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full shadow-lg"
                style={{
                  backgroundColor: source.color,
                  boxShadow: `0 0 8px ${source.color}40`,
                }}
              />
              <div>
                <h3 className="text-lg font-semibold text-navy-100">
                  {source.name}
                </h3>
                <p className="text-xs text-navy-400">
                  {TYPE_LABELS[source.type] ?? source.type} &middot;{" "}
                  {source.region}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-navy-500 transition-colors hover:bg-navy-800 hover:text-navy-300"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed text-navy-300">
            {getExtendedInfo(source.name).description}
          </p>

          {/* Stats Row */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <InfoItem
              icon={MapPin}
              label="Country"
              value={getExtendedInfo(source.name).country}
            />
            <InfoItem
              icon={Building2}
              label="Type"
              value={TYPE_LABELS[source.type] ?? source.type}
            />
            <InfoItem
              icon={BarChart3}
              label="Reliability"
              value={`${Math.round(source.y * 100)}%`}
            />
            <InfoItem
              icon={Globe}
              label="Region"
              value={source.region}
            />
          </div>

          {/* Bias Indicator */}
          <div className="mb-4">
            <BiasIndicator
              value={source.x}
              label="Political Orientation"
            />
          </div>

          {/* Known Biases */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-terracotta" />
              <span className="text-xs font-medium uppercase tracking-wider text-navy-400">
                Known Biases
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getExtendedInfo(source.name).knownBiases.map((bias) => (
                <span
                  key={bias}
                  className="inline-flex rounded-md border border-terracotta/20 bg-terracotta/10 px-2 py-0.5 text-xs text-terracotta"
                >
                  {bias}
                </span>
              ))}
            </div>
          </div>

          {/* Coverage Strengths */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-sage" />
              <span className="text-xs font-medium uppercase tracking-wider text-navy-400">
                Coverage Strengths
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getExtendedInfo(source.name).coverageStrengths.map((str) => (
                <span
                  key={str}
                  className="inline-flex rounded-md border border-sage/20 bg-sage/10 px-2 py-0.5 text-xs text-sage"
                >
                  {str}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-teal" />
              <span className="text-xs font-medium uppercase tracking-wider text-navy-400">
                Languages
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getExtendedInfo(source.name).languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex rounded-md border border-teal/20 bg-teal/10 px-2 py-0.5 text-xs text-teal"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          {currentAnalysis ? (
            <div className="mb-4 rounded-lg border border-gold-500/20 bg-navy-800/60 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-500">AI Analysis</span>
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="ml-auto text-[10px] text-navy-500 hover:text-navy-300 transition-colors">
                  Refresh
                </button>
              </div>
              <p className="text-xs text-navy-300 leading-relaxed">{currentAnalysis.conflictCoverageNotes}</p>
              {currentAnalysis.recommendedCrossReferences.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="h-3 w-3 text-teal" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">Cross-reference with</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentAnalysis.recommendedCrossReferences.map((ref) => (
                      <span key={ref} className="text-[10px] rounded px-1.5 py-0.5 bg-teal/10 border border-teal/20 text-teal">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : analysisError ? (
            <p className="mb-3 text-xs text-crimson">{analysisError}</p>
          ) : null}

          {/* Action */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-medium text-gold-400 transition-all hover:border-gold-500/50 hover:bg-gold-500/20 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                {currentAnalysis ? 'Re-Analyze Coverage' : 'Analyze Coverage'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-navy-700/40 bg-navy-800/50 px-3 py-2">
      <div className="mb-0.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-navy-500" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-navy-500">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-navy-200">{value}</p>
    </div>
  );
}
