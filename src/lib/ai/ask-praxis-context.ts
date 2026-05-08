import type { CorpusSearchResponse } from '@/types/corpus';
import type { Situation } from '@/types/situation';
import type { ConflictGraphSnapshot } from '@/lib/ai/tools';

const MAX_GRAPH_EXAMPLES = 10;

export function buildAskPraxisAnswerPolicyBlock(): string {
  return `## Ask PRAXIS Answer Quality Contract

Build answers from this evidence stack, in order:
1. The active Situation record and analyst-provided context.
2. Retrieved situation corpus items, cited inline as [#1], [#2], etc.
3. The active Situation Model graph snapshot, cited as [graph].
4. Live web search only when the question needs current facts beyond the saved situation.

For substantial answers, use this shape:
- Bottom line: the answer in 1-3 sentences.
- Evidence: cite the strongest saved corpus items or graph facts.
- Gaps: name missing, stale, thin, or disputed context.
- Next step: recommend the smallest useful action, source repair, workflow, or output.

Do not overclaim. If the saved context is thin, say so and explain exactly what evidence would improve the answer.`;
}

export function buildAskPraxisSituationSourcePosture(situation: Situation): string {
  const sourceUrls = Array.isArray(situation.sourceUrls) ? situation.sourceUrls : [];
  const customSources = Array.isArray(situation.customSources) ? situation.customSources : [];
  const sourceLines = [
    ...sourceUrls.map((url, index) => `${index + 1}. ${url}`),
    ...customSources.map((source, index) => `${sourceUrls.length + index + 1}. ${source.name ?? source.url} — ${source.url}`),
  ];

  const contextSignals = [
    `actors=${situation.actorCount || situation.actors.length || 0}`,
    `graphEntities=${situation.graphEntities || 0}`,
    `documents=${situation.documentCount || 0}`,
    `analysisPhase=${situation.analysisPhase ?? 'not-set'}`,
    `workflow=${situation.workflowPathLabel ?? situation.workflowPath ?? 'not-set'}`,
    `updatedAt=${situation.updatedAt ?? 'unknown'}`,
  ];

  return `## Ask PRAXIS Situation Source Posture
${contextSignals.join(' · ')}
${sourceLines.length ? `\nAnalyst-provided or custom sources:\n${sourceLines.join('\n')}` : '\nNo analyst-provided source URLs are attached to this Situation yet.'}`;
}

export function formatAskPraxisCorpusBlock(corpus: CorpusSearchResponse): string {
  const layers = corpus.trace.layersSearched.join(', ');
  if (corpus.items.length === 0) {
    return `## User Situation Corpus
The shared retriever found 0 evidence items across layers ${layers}. Treat any factual claim as an intelligence gap. Recommend the smallest useful context-building action before answering with high confidence.`;
  }

  const lines = corpus.items.map((item, index) => {
    const freshness = item.freshness ? ` freshness=${item.freshness}` : '';
    return `[#${index + 1}] (${item.sourceType}) ${item.title} — ${item.excerpt}
    citation=${item.citation} confidence=${item.confidence}${freshness}
    why=${item.reason}`;
  });

  return `## User Situation Corpus (${corpus.items.length} items)
Layers searched: ${layers}
Ranking: ${corpus.trace.ranking}
Retrieval: ${corpus.trace.durationMs}ms, ${corpus.trace.totalCandidates} candidate(s)

Use these items to ground factual claims. Cite inline by reference like [#3]. Never fabricate sources; when evidence is missing, say "intelligence gap" and recommend a concrete source or workflow to fill it.

${lines.join('\n\n')}`;
}

export function summarizeAskPraxisGraphSnapshot(graphSnapshot: ConflictGraphSnapshot | null): string {
  if (!graphSnapshot?.nodes?.length) {
    return `## Situation Model Graph Snapshot
No graph snapshot was available to Ask PRAXIS. Treat graph-specific claims as unverified until the Situation Model is populated or refreshed.`;
  }

  const nodeTypeCounts = countBy(graphSnapshot.nodes.map((node) => node.type || 'unknown'));
  const edgeTypeCounts = countBy(graphSnapshot.edges.map((edge) => edge.type || edge.label || 'unknown'));
  const examples = graphSnapshot.nodes
    .filter((node) => ['actor', 'claim', 'interest', 'constraint', 'leverage', 'commitment', 'event', 'narrative'].includes(node.type))
    .slice(0, MAX_GRAPH_EXAMPLES)
    .map((node) => `- ${node.type}: ${node.label}`);

  return `## Situation Model Graph Snapshot
Nodes: ${graphSnapshot.nodes.length} (${formatCounts(nodeTypeCounts)})
Edges: ${graphSnapshot.edges.length}${graphSnapshot.edges.length ? ` (${formatCounts(edgeTypeCounts)})` : ''}
${examples.length ? `\nPriority graph facts:\n${examples.join('\n')}` : '\nNo priority graph facts were available in the first graph slice.'}

Use [graph] when relying on this snapshot. If the graph is sparse or has no edges, mark graph-based judgments as lower confidence and recommend context repair.`;
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}
