/**
 * PRAXIS Graph Layer — Neo4j or Firestore adapter
 * Zero-config fallback: if NEO4J_URI is not set, uses Firestore subcollections.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ACONode, ACOEdge, GraphLayer, GraphMetrics } from './types';
import {
  computeDegreeCentrality,
  computeBetweennessCentrality,
  detectCommunities,
  getMostCentralNode,
  computeDensity,
} from './firestore-graph-analytics';

// ---------------------------------------------------------------------------
// Firestore Graph Layer (default — no Neo4j needed)
// ---------------------------------------------------------------------------

export class FirestoreGraphLayer implements GraphLayer {
  getType(): 'neo4j' | 'firestore' { return 'firestore'; }

  private nodesRef(uid: string, sitId: string) {
    return adminDb
      .collection('users').doc(uid)
      .collection('situations').doc(sitId)
      .collection('graph').doc('main')
      .collection('nodes');
  }

  private edgesRef(uid: string, sitId: string) {
    return adminDb
      .collection('users').doc(uid)
      .collection('situations').doc(sitId)
      .collection('graph').doc('main')
      .collection('edges');
  }

  private metricsRef(uid: string, sitId: string) {
    return adminDb
      .collection('users').doc(uid)
      .collection('situations').doc(sitId)
      .collection('graph').doc('metrics');
  }

  async getNodes(uid: string, sitId: string): Promise<ACONode[]> {
    const snap = await this.nodesRef(uid, sitId).get();
    return snap.docs.map(d => d.data() as ACONode);
  }

  async getEdges(uid: string, sitId: string): Promise<ACOEdge[]> {
    const snap = await this.edgesRef(uid, sitId).get();
    return snap.docs.map(d => d.data() as ACOEdge);
  }

  async getMetrics(uid: string, sitId: string): Promise<GraphMetrics> {
    const metricsSnap = await this.metricsRef(uid, sitId).get();
    if (metricsSnap.exists) return metricsSnap.data() as GraphMetrics;
    // Compute on the fly
    const [nodes, edges] = await Promise.all([this.getNodes(uid, sitId), this.getEdges(uid, sitId)]);
    return this.computeAndSaveMetrics(uid, sitId, nodes, edges);
  }

  private async computeAndSaveMetrics(uid: string, sitId: string, nodes: ACONode[], edges: ACOEdge[]): Promise<GraphMetrics> {
    const communities = detectCommunities(nodes, edges);
    const uniqueCommunities = new Set(communities.values()).size;
    const metrics: GraphMetrics = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density: computeDensity(nodes.length, edges.length),
      communities: uniqueCommunities,
      mostCentralNode: getMostCentralNode(nodes, edges),
      lastComputed: new Date().toISOString(),
    };
    await this.metricsRef(uid, sitId).set(metrics);
    return metrics;
  }

  async upsertNode(uid: string, sitId: string, node: Partial<ACONode> & { id: string }): Promise<void> {
    const now = new Date().toISOString();
    const ref = this.nodesRef(uid, sitId).doc(node.id);
    const existing = await ref.get();
    if (existing.exists) {
      await ref.update({ ...node, updatedAt: now });
    } else {
      await ref.set({
        subtypes: [],
        confidence: 'INFERRED' as const,
        sourceDocIds: [],
        aliases: [],
        metadata: {},
        createdAt: now,
        updatedAt: now,
        ...node,
      });
    }
    // Invalidate cached metrics
    await this.metricsRef(uid, sitId).delete().catch(() => {});
  }

  async upsertEdge(uid: string, sitId: string, edge: Partial<ACOEdge> & { id: string; source: string; target: string }): Promise<void> {
    const ref = this.edgesRef(uid, sitId).doc(edge.id);
    const existing = await ref.get();
    if (existing.exists) {
      await ref.update({ ...edge });
    } else {
      await ref.set({
        category: 'foundational' as const,
        confidence: 'INFERRED' as const,
        weight: 0.5,
        sourceDocIds: [],
        metadata: {},
        ...edge,
      });
    }
    await this.metricsRef(uid, sitId).delete().catch(() => {});
  }

  async isHealthy(): Promise<boolean> {
    try {
      await adminDb.collection('users').limit(1).get();
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Neo4j Graph Layer (activated when NEO4J_URI is set)
// ---------------------------------------------------------------------------

export class Neo4jGraphLayer implements GraphLayer {
  private driver: unknown = null;

  getType(): 'neo4j' | 'firestore' { return 'neo4j'; }

  private async getDriver() {
    if (this.driver) return this.driver;
    try {
      const neo4j = require('neo4j-driver');
      this.driver = neo4j.driver(
        process.env.NEO4J_URI!,
        neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || ''),
        { maxConnectionPoolSize: 5 }
      );
      return this.driver;
    } catch {
      throw new Error('[graph-layer] neo4j-driver not installed. Run: npm install neo4j-driver');
    }
  }

  private async runQuery(cypher: string, params: Record<string, unknown> = {}): Promise<unknown[]> {
    const driver = await this.getDriver() as { session: () => { run: (q: string, p: Record<string, unknown>) => Promise<{ records: unknown[] }>; close: () => Promise<void> } };
    const session = driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } finally {
      await session.close();
    }
  }

  async getNodes(uid: string, sitId: string): Promise<ACONode[]> {
    try {
      const records = await this.runQuery(
        'MATCH (n {uid: $uid, situationId: $sitId}) RETURN n',
        { uid, sitId }
      ) as Array<{ get: (k: string) => { properties: ACONode } }>;
      return records.map(r => r.get('n').properties);
    } catch (err) {
      console.error('[graph-layer] Neo4j getNodes failed:', err);
      return [];
    }
  }

  async getEdges(uid: string, sitId: string): Promise<ACOEdge[]> {
    try {
      const records = await this.runQuery(
        'MATCH ()-[r {uid: $uid, situationId: $sitId}]->() RETURN r',
        { uid, sitId }
      ) as Array<{ get: (k: string) => { properties: ACOEdge } }>;
      return records.map(r => r.get('r').properties);
    } catch (err) {
      console.error('[graph-layer] Neo4j getEdges failed:', err);
      return [];
    }
  }

  async getMetrics(uid: string, sitId: string): Promise<GraphMetrics> {
    const [nodes, edges] = await Promise.all([this.getNodes(uid, sitId), this.getEdges(uid, sitId)]);
    const { getMostCentralNode, computeDensity, detectCommunities } = await import('./firestore-graph-analytics');
    const communities = detectCommunities(nodes, edges);
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density: computeDensity(nodes.length, edges.length),
      communities: new Set(communities.values()).size,
      mostCentralNode: getMostCentralNode(nodes, edges),
      lastComputed: new Date().toISOString(),
    };
  }

  async upsertNode(uid: string, sitId: string, node: Partial<ACONode> & { id: string }): Promise<void> {
    const now = new Date().toISOString();
    try {
      await this.runQuery(
        `MERGE (n:${node.type || 'Entity'} {id: $id, uid: $uid, situationId: $sitId})
         SET n += $props, n.updatedAt = $now`,
        { id: node.id, uid, sitId, props: { ...node, uid, situationId: sitId }, now }
      );
    } catch (err) {
      console.error('[graph-layer] Neo4j upsertNode failed:', err);
    }
  }

  async upsertEdge(uid: string, sitId: string, edge: Partial<ACOEdge> & { id: string; source: string; target: string }): Promise<void> {
    try {
      await this.runQuery(
        `MATCH (a {id: $source, uid: $uid, situationId: $sitId})
         MATCH (b {id: $target, uid: $uid, situationId: $sitId})
         MERGE (a)-[r:RELATES {id: $id, uid: $uid, situationId: $sitId}]->(b)
         SET r += $props`,
        { source: edge.source, target: edge.target, id: edge.id, uid, sitId, props: { ...edge, uid, situationId: sitId } }
      );
    } catch (err) {
      console.error('[graph-layer] Neo4j upsertEdge failed:', err);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.runQuery('RETURN 1');
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory — returns the right layer based on config
// ---------------------------------------------------------------------------

let _graphLayer: GraphLayer | null = null;

export function createGraphLayer(): GraphLayer {
  if (_graphLayer) return _graphLayer;
  if (process.env.NEO4J_URI) {
    _graphLayer = new Neo4jGraphLayer();
  } else {
    _graphLayer = new FirestoreGraphLayer();
  }
  return _graphLayer;
}
