/**
 * PRAXIS Situation Knowledge Core — main entry point.
 * Combines all 4 layers into a unified intelligence substrate.
 */

import { createGraphLayer } from './graph-layer';
import { VectorLayer } from './vector-layer';
import { FeedLayer } from './feed-layer';
import { ToolOutputLayer } from './tool-output-layer';
import { RetrievalOrchestrator } from './retrieval-orchestrator';
import type { SKCContext } from './types';

export class SituationKnowledgeCore {
  private graphLayer = createGraphLayer();
  private vectorLayer: VectorLayer;
  private feedLayer: FeedLayer;
  private toolOutputLayer: ToolOutputLayer;
  private orchestrator: RetrievalOrchestrator;

  constructor(private uid: string, private situationId: string) {
    this.vectorLayer = new VectorLayer(uid, situationId);
    this.feedLayer = new FeedLayer(uid, situationId);
    this.toolOutputLayer = new ToolOutputLayer(uid, situationId);
    this.orchestrator = new RetrievalOrchestrator(
      this.graphLayer, this.vectorLayer, this.feedLayer, this.toolOutputLayer
    );
  }

  async getToolContext(toolId: string, query?: string): Promise<Partial<SKCContext>> {
    return this.orchestrator.retrieve(this.uid, this.situationId, toolId, query);
  }

  async ingestDocument(docId: string, text: string, entityRefs: string[] = []): Promise<void> {
    await this.vectorLayer.ingestDocument(docId, text, entityRefs);
  }

  async ingestToolOutput(toolId: string, summary: string): Promise<void> {
    await this.vectorLayer.ingestToolOutput(toolId, summary);
  }

  async saveFeedData(feedName: string, data: unknown, country: string): Promise<void> {
    await this.feedLayer.saveFeedData(feedName, data, country);
  }

  async upsertGraphNode(node: Parameters<typeof this.graphLayer.upsertNode>[2]): Promise<void> {
    await this.graphLayer.upsertNode(this.uid, this.situationId, node);
  }

  async upsertGraphEdge(edge: Parameters<typeof this.graphLayer.upsertEdge>[2]): Promise<void> {
    await this.graphLayer.upsertEdge(this.uid, this.situationId, edge);
  }

  async getHealth(): Promise<{
    graph: boolean;
    graphType: 'neo4j' | 'firestore';
    vector: boolean;
    feeds: boolean;
    tools: boolean;
    embeddingCount: number;
  }> {
    const [graph, vector, feeds, tools, embeddingCount] = await Promise.all([
      this.graphLayer.isHealthy(),
      this.vectorLayer.isHealthy(),
      this.feedLayer.isHealthy(),
      this.toolOutputLayer.isHealthy(),
      this.vectorLayer.getEmbeddingCount(),
    ]);
    return { graph, graphType: this.graphLayer.getType(), vector, feeds, tools, embeddingCount };
  }
}
