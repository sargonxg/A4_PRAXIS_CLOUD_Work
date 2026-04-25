/**
 * PRAXIS Retrieval Orchestrator — unified 4-layer context retrieval.
 * Queries graph, vector, feed, and tool-output layers.
 * Merges, deduplicates, ranks, and fits context within token budget.
 */

import type {
  SKCContext, ACONode, ACOEdge, VectorResult, FeedCacheEntry,
  RelatedToolData, GraphLayer,
} from './types';
import type { VectorLayer } from './vector-layer';
import type { FeedLayer } from './feed-layer';
import type { ToolOutputLayer } from './tool-output-layer';

// Token budgets per tool category
const CONTEXT_BUDGETS: Record<string, { graph: number; vector: number; feeds: number; tools: number }> = {
  context:     { graph: 5000, vector: 2000, feeds: 5000, tools: 3000 },
  analysis:    { graph: 8000, vector: 3000, feeds: 8000, tools: 6000 },
  drafting:    { graph: 10000, vector: 5000, feeds: 3000, tools: 12000 },
  simulation:  { graph: 10000, vector: 2000, feeds: 2000, tools: 8000 },
  intelligence:{ graph: 5000, vector: 5000, feeds: 10000, tools: 5000 },
};

const TOOL_CATEGORIES: Record<string, string> = {
  'dashboard': 'context', 'documents': 'context', 'sources-library': 'context',
  'timeline': 'context', 'humanitarian': 'context', 'calendar': 'context', 'conflict-graph': 'context',
  'risk-monitor': 'analysis', 'early-warning': 'analysis', 'actor-profiles': 'analysis',
  'stakeholder-map': 'analysis', 'power-map': 'analysis', 'info-environment': 'analysis',
  'compare': 'analysis',
  'assistant': 'drafting', 'report-studio': 'drafting', 'dossier': 'drafting',
  'talking-points': 'drafting', 'briefing': 'drafting', 'daily-brief': 'drafting',
  'un-toolkit': 'drafting', 'policy-memo': 'drafting',
  'scenarios': 'simulation', 'negotiation-prep': 'simulation', 'game-theory': 'simulation',
  'concordia': 'simulation', 'mediation-design': 'simulation',
  'deep-research': 'intelligence', 'argus': 'intelligence', 'media-compass': 'intelligence',
  'media-roundup': 'intelligence', 'geospatial-monitor': 'intelligence',
  'sanctions': 'intelligence', 'commitments': 'intelligence', 'treaty-analyzer': 'intelligence',
  'alert-center': 'intelligence',
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4); // ~4 chars per token
}

export class RetrievalOrchestrator {
  constructor(
    private graphLayer: GraphLayer,
    private vectorLayer: VectorLayer,
    private feedLayer: FeedLayer,
    private toolOutputLayer: ToolOutputLayer,
  ) {}

  async retrieve(
    uid: string,
    situationId: string,
    toolId: string,
    vectorQuery?: string,
  ): Promise<Partial<SKCContext>> {
    const category = TOOL_CATEGORIES[toolId] ?? 'analysis';
    const budget = CONTEXT_BUDGETS[category];

    // Parallel fetch from all 4 layers
    const [nodes, edges, metrics, vectorResults, feedData, relatedToolData] = await Promise.all([
      this.graphLayer.getNodes(uid, situationId).catch(() => [] as ACONode[]),
      this.graphLayer.getEdges(uid, situationId).catch(() => [] as ACOEdge[]),
      this.graphLayer.getMetrics(uid, situationId).catch(() => ({
        nodeCount: 0, edgeCount: 0, density: 0, communities: 0, mostCentralNode: '', lastComputed: '',
      })),
      vectorQuery ? this.vectorLayer.search(vectorQuery, 10).catch(() => [] as VectorResult[]) : Promise.resolve([] as VectorResult[]),
      this.feedLayer.getToolRelevantFeeds(toolId).catch(() => ({} as Record<string, FeedCacheEntry>)),
      this.toolOutputLayer.getRelatedToolData(toolId).catch(() => ({} as Record<string, RelatedToolData>)),
    ]);

    // Trim to token budget
    const trimmedNodes = this.trimNodes(nodes, budget.graph);
    const trimmedEdges = this.trimEdges(edges, nodes, budget.graph);
    const trimmedVector = this.trimVectorResults(vectorResults, budget.vector);
    const trimmedFeeds = this.trimFeedData(feedData, budget.feeds);
    const trimmedTools = this.trimToolData(relatedToolData, budget.tools);

    const contextTokenEstimate =
      estimateTokens(JSON.stringify(trimmedNodes)) +
      estimateTokens(JSON.stringify(trimmedEdges)) +
      estimateTokens(JSON.stringify(trimmedVector)) +
      estimateTokens(JSON.stringify(trimmedFeeds)) +
      estimateTokens(JSON.stringify(trimmedTools));

    return {
      graph: { nodes: trimmedNodes, edges: trimmedEdges, metrics },
      vectorResults: trimmedVector,
      feedData: trimmedFeeds,
      relatedToolData: trimmedTools,
      timestamp: new Date().toISOString(),
      contextTokenEstimate,
    };
  }

  private trimNodes(nodes: ACONode[], tokenBudget: number): ACONode[] {
    const budget = Math.floor(tokenBudget * 0.6);
    let tokens = 0;
    const result: ACONode[] = [];
    // Prioritize: EXTRACTED > INFERRED > actors > others
    const sorted = [...nodes].sort((a, b) => {
      const confScore = { EXTRACTED: 3, INFERRED: 2, ASSESSED: 1, AMBIGUOUS: 0 };
      const typeBonus = a.type === 'actor' ? 1 : 0;
      return (confScore[b.confidence] + (b.type === 'actor' ? 1 : 0)) -
             (confScore[a.confidence] + typeBonus);
    });
    for (const node of sorted) {
      const t = estimateTokens(JSON.stringify(node));
      if (tokens + t > budget) break;
      result.push(node);
      tokens += t;
    }
    return result;
  }

  private trimEdges(edges: ACOEdge[], nodes: ACONode[], tokenBudget: number): ACOEdge[] {
    const includedIds = new Set(nodes.map(n => n.id));
    const budget = Math.floor(tokenBudget * 0.4);
    let tokens = 0;
    const result: ACOEdge[] = [];
    const sorted = [...edges]
      .filter(e => includedIds.has(e.source) && includedIds.has(e.target))
      .sort((a, b) => b.weight - a.weight);
    for (const edge of sorted) {
      const t = estimateTokens(JSON.stringify(edge));
      if (tokens + t > budget) break;
      result.push(edge);
      tokens += t;
    }
    return result;
  }

  private trimVectorResults(results: VectorResult[], tokenBudget: number): VectorResult[] {
    let tokens = 0;
    const trimmed: VectorResult[] = [];
    for (const r of results) {
      const t = estimateTokens(r.text);
      if (tokens + t > tokenBudget) break;
      trimmed.push(r);
      tokens += t;
    }
    return trimmed;
  }

  private trimFeedData(feeds: Record<string, FeedCacheEntry>, tokenBudget: number): Record<string, FeedCacheEntry> {
    const result: Record<string, FeedCacheEntry> = {};
    let tokens = 0;
    for (const [key, entry] of Object.entries(feeds)) {
      const t = estimateTokens(JSON.stringify(entry.data));
      if (tokens + t > tokenBudget) break;
      result[key] = entry;
      tokens += t;
    }
    return result;
  }

  private trimToolData(tools: Record<string, RelatedToolData>, tokenBudget: number): Record<string, RelatedToolData> {
    const result: Record<string, RelatedToolData> = {};
    let tokens = 0;
    for (const [key, entry] of Object.entries(tools)) {
      const clipped = this.clipStructuredData(entry.data);
      const preview = JSON.stringify(clipped);
      const t = estimateTokens(preview);
      if (tokens + t > tokenBudget) break;
      result[key] = { ...entry, data: clipped };
      tokens += t;
    }
    return result;
  }

  private clipStructuredData(value: unknown, maxString = 2000): unknown {
    if (typeof value === 'string') {
      return value.length > maxString ? `${value.slice(0, maxString - 3)}...` : value;
    }
    if (Array.isArray(value)) {
      return value.slice(0, 12).map((item) => this.clipStructuredData(item, Math.floor(maxString / 2)));
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
        out[key] = this.clipStructuredData(nested, Math.floor(maxString / 2));
      }
      return out;
    }
    return value;
  }
}
