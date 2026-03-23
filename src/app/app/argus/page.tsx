'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { RealToolView } from '@/components/praxis/real-tool-view';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import { Search, Upload, Network, FileText, GitCompare, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import {
  ARGUS_DEMO_QUERIES,
  ARGUS_DEMO_DOCUMENTS,
  ARGUS_CROSS_CASE_MATRIX,
} from '@/lib/constants/argus-demo';
import type { ArgusQuery, ArgusDocument } from '@/lib/constants/argus-demo';

const MARK_COLORS: Record<string, string> = {
  Actor: 'bg-blue-100 text-blue-900',
  Claim: 'bg-purple-100 text-purple-900',
  Interest: 'bg-teal-100 text-teal-900',
  Constraint: 'bg-red-100 text-red-900',
  Leverage: 'bg-amber-100 text-amber-900',
  Commitment: 'bg-green-100 text-green-900',
  Event: 'bg-orange-100 text-orange-900',
  Narrative: 'bg-pink-100 text-pink-900',
};

const ENTITY_BADGE_COLORS: Record<string, string> = {
  Actor: 'bg-blue-50 text-blue-700 border-blue-200',
  Claim: 'bg-purple-50 text-purple-700 border-purple-200',
  Interest: 'bg-teal-50 text-teal-700 border-teal-200',
  Constraint: 'bg-red-50 text-red-700 border-red-200',
  Leverage: 'bg-amber-50 text-amber-700 border-amber-200',
  Commitment: 'bg-green-50 text-green-700 border-green-200',
  Event: 'bg-orange-50 text-orange-700 border-orange-200',
  Narrative: 'bg-pink-50 text-pink-700 border-pink-200',
};

function ConfidenceBadge({ value }: { value: number }) {
  const color =
    value >= 85
      ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
      : value >= 70
        ? 'text-amber-600 border-amber-200 bg-amber-50'
        : 'text-navy-500 border-navy-200 bg-navy-50';
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
        color,
      )}
    >
      {value}%
    </span>
  );
}

function EntityBadge({ name, type }: { name: string; type: string }) {
  const colors = ENTITY_BADGE_COLORS[type] || ENTITY_BADGE_COLORS.Actor;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        colors,
      )}
    >
      {name}
    </span>
  );
}

/* ── Tab 1: Knowledge Graph ─────────────────────────────────────────── */

function KnowledgeGraphTab() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<ArgusQuery | null>(null);

  function handleSelectQuery(query: ArgusQuery) {
    setSelectedQuery(query);
    setSearchValue(query.query);
  }

  function handleSearch() {
    const match = ARGUS_DEMO_QUERIES.find(
      (q) => q.query.toLowerCase() === searchValue.toLowerCase(),
    );
    if (match) setSelectedQuery(match);
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Query the Conflict Knowledge Graph..."
          className="w-full rounded-xl border border-[var(--color-app-border)] bg-white py-3.5 pl-12 pr-4 text-sm text-navy-900 placeholder:text-navy-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
      </div>

      {/* Query suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {ARGUS_DEMO_QUERIES.map((q) => (
          <button
            key={q.id}
            onClick={() => handleSelectQuery(q)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors',
              selectedQuery?.id === q.id
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
                : 'border-[var(--color-app-border)] bg-white text-navy-600 hover:border-emerald-300 hover:bg-emerald-50/50',
            )}
          >
            {q.query.length > 42 ? q.query.slice(0, 42) + '...' : q.query}
          </button>
        ))}
      </div>

      {/* Results */}
      {selectedQuery ? (
        <div className="rounded-xl border border-[var(--color-app-border)] border-l-4 border-l-emerald-500 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm leading-relaxed text-navy-700">
              {selectedQuery.response.summary}
            </p>
            <ConfidenceBadge value={selectedQuery.response.confidence} />
          </div>

          {/* Graph path */}
          <div className="mt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Knowledge Graph Path
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedQuery.response.graphPath.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-1 text-[11px] font-medium text-navy-700">
                    {step.from}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
                    {step.relation}
                  </span>
                  <span className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-1 text-[11px] font-medium text-navy-700">
                    {step.to}
                  </span>
                  {i < selectedQuery.response.graphPath.length - 1 && (
                    <span className="mx-1 text-navy-300">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Entities */}
          <div className="mt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Related Entities
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedQuery.response.entities.map((e, i) => (
                <EntityBadge key={i} name={e.name} type={e.type} />
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="mt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
              Sources
            </h4>
            <ul className="space-y-1">
              {selectedQuery.response.sources.map((s, i) => (
                <li key={i} className="text-[12px] text-navy-500">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-white/50 py-16">
          <Network className="mb-3 h-10 w-10 text-navy-300" />
          <p className="text-sm text-navy-400">
            Enter a query or click a suggestion to search the ARGUS knowledge graph
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Tab 2: Document Intelligence ───────────────────────────────────── */

function DocumentIntelligenceTab() {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  function renderHighlightedText(doc: ArgusDocument) {
    const sorted = [...doc.extractedEntities].sort((a, b) => a.startChar - b.startChar);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((entity, i) => {
      if (entity.startChar > lastIndex) {
        parts.push(
          <span key={`t-${i}`}>{doc.sampleText.slice(lastIndex, entity.startChar)}</span>,
        );
      }
      const markColor = MARK_COLORS[entity.entityType] || 'bg-gray-100 text-gray-900';
      parts.push(
        <mark
          key={`e-${i}`}
          className={cn('rounded px-0.5', markColor)}
          title={entity.entityType}
        >
          {doc.sampleText.slice(entity.startChar, entity.endChar)}
        </mark>,
      );
      lastIndex = entity.endChar;
    });
    if (lastIndex < doc.sampleText.length) {
      parts.push(<span key="tail">{doc.sampleText.slice(lastIndex)}</span>);
    }
    return parts;
  }

  return (
    <div className="space-y-4">
      {/* Mock upload zone */}
      <button
        type="button"
        onClick={() => alert('Upload available in production')}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-app-border)] bg-white/50 py-8 text-navy-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"
      >
        <Upload className="h-8 w-8" />
        <span className="text-sm font-medium">Drop PDF, DOCX, cables, or SITREPs</span>
        <span className="text-[11px] text-navy-400">Supported: PDF, DOCX, TXT, CSV</span>
      </button>

      {/* Demo documents */}
      <h3 className="text-sm font-semibold text-navy-700">Demo Processed Documents</h3>
      <div className="space-y-3">
        {ARGUS_DEMO_DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className="rounded-xl border border-[var(--color-app-border)] bg-white"
          >
            <button
              onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-navy-800">{doc.title}</p>
                  <p className="text-[11px] text-navy-400">
                    {doc.extractedEntities.length} entities extracted
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] font-medium text-navy-500">
                {doc.type}
              </span>
            </button>

            {expandedDoc === doc.id && (
              <div className="border-t border-[var(--color-app-border)] px-5 py-4">
                <p className="mb-4 text-[13px] leading-relaxed text-navy-700">
                  {renderHighlightedText(doc)}
                </p>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--color-app-border)]">
                      <th className="pb-2 font-semibold text-navy-500">Entity</th>
                      <th className="pb-2 font-semibold text-navy-500">Type</th>
                      <th className="pb-2 text-right font-semibold text-navy-500">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.extractedEntities.map((e, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--color-app-border)] last:border-0"
                      >
                        <td className="py-1.5 text-navy-700">{e.text}</td>
                        <td>
                          <EntityBadge name={e.entityType} type={e.entityType} />
                        </td>
                        <td className="text-right text-navy-500">
                          {Math.round(e.confidence * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tab 3: Cross-Case Patterns ─────────────────────────────────────── */

function CrossCasePatternsTab({ situationName }: { situationName?: string }) {
  const categories = Object.keys(ARGUS_CROSS_CASE_MATRIX);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-app-border)] bg-white">
      <table className="w-full text-left text-[12px]">
        <thead className="sticky top-0 z-10 bg-[var(--color-app-surface-alt)]">
          <tr className="border-b border-[var(--color-app-border)]">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-navy-500">
              Pattern
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-navy-500">
                  {situationName ?? 'Nordalia'}
                </span>
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-navy-500">
                  Ethiopia-Tigray
                </span>
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-navy-500">
                  Sudan
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) =>
            ARGUS_CROSS_CASE_MATRIX[cat].map((row, i) => (
              <tr
                key={`${cat}-${i}`}
                className="border-b border-[var(--color-app-border)] last:border-0"
              >
                <td className="px-4 py-3 font-semibold text-navy-700 whitespace-nowrap">
                  {cat}
                </td>
                <td className="px-4 py-3 text-navy-600">
                  {row.nordalia}
                  <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                    {row.confidence}%
                  </span>
                </td>
                <td className="px-4 py-3 text-navy-600">{row.ethiopia}</td>
                <td className="px-4 py-3 text-navy-600">{row.sudan}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */

function DemoArgusPage({ situationName }: { situationName?: string }) {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-navy-900">ARGUS Intelligence</h1>
        <p className="mt-1 text-sm text-navy-500">
          Graph-augmented RAG — knowledge graph queries, entity extraction, and cross-case pattern
          matching
        </p>
      </div>

      <Tabs defaultValue="knowledge-graph">
        <TabsList>
          <TabsTrigger value="knowledge-graph" className="gap-1.5">
            <Network className="h-3.5 w-3.5" /> Knowledge Graph
          </TabsTrigger>
          <TabsTrigger value="document-intelligence" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Document Intelligence
          </TabsTrigger>
          <TabsTrigger value="cross-case" className="gap-1.5">
            <GitCompare className="h-3.5 w-3.5" /> Cross-Case Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-graph">
          <KnowledgeGraphTab />
        </TabsContent>
        <TabsContent value="document-intelligence">
          <DocumentIntelligenceTab />
        </TabsContent>
        <TabsContent value="cross-case">
          <CrossCasePatternsTab situationName={situationName} />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-app-border)] bg-white px-6 py-4">
        <EcosystemBadge product="ARGUS" size="md" />
        <div className="text-center">
          <p className="text-[12px] text-navy-500">
            Connect ARGUS for live knowledge graph queries, real-time document processing, and
            cross-case intelligence
          </p>
          <p className="mt-1 text-[10px] italic text-navy-400">
            DEMO — Results are pre-computed. Connect ARGUS for live analysis.
          </p>
        </div>
        <a
          href="https://argus.tacitus.me"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Open ARGUS <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <PoweredByTacitus />
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

export default function ArgusPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  
  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoArgusPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  // Real mode — AI populate prompt, then show tool
  return (
    <AiPopulate
      toolId="argus"
      toolName="ARGUS Intelligence"
      apiEndpoint="/api/ai/argus"
      creditCost={2}
      hasExistingData={false}
      onDataGenerated={() => {}}
    >
      <DemoArgusPage situationName={situation.name} />
    </AiPopulate>
  );
}
