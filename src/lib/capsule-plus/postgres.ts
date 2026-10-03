import { Pool, type QueryResultRow } from 'pg';
import { serverFirebaseEmulators } from '@/lib/firebase/emulator-config';
import {
  CapsulePlusGraphEdgeSchema,
  CapsulePlusGraphNodeSchema,
  type CapsulePlusGraphEdge,
  type CapsulePlusGraphNode,
} from '@/lib/capsule-plus';

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getDatabaseUrl(): string | null {
  return process.env.CAPSULE_PLUS_DATABASE_URL
    || process.env.AGENT_RUNTIME_DATABASE_URL
    || process.env.PRAXIS_DATABASE_URL
    || process.env.DATABASE_URL
    || null;
}

function getPool(): Pool {
  if (serverFirebaseEmulators()) throw new Error('Capsule+ Postgres is unavailable in the Auth/Firestore-only local lane.');
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('Capsule+ graph store is not configured: set CAPSULE_PLUS_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: Number(process.env.CAPSULE_PLUS_PG_POOL_MAX ?? 5),
      ssl: process.env.CAPSULE_PLUS_PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id TEXT PRIMARY KEY,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        node_type TEXT NOT NULL,
        label TEXT NOT NULL,
        properties JSONB NOT NULL DEFAULT '{}'::jsonb,
        provenance JSONB NOT NULL,
        review_state TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS graph_nodes_owner_capsule_idx
        ON graph_nodes (owner_uid, capsule_id, node_type);
      CREATE TABLE IF NOT EXISTS graph_edges (
        id TEXT PRIMARY KEY,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        from_node_id TEXT NOT NULL,
        to_node_id TEXT NOT NULL,
        edge_type TEXT NOT NULL,
        label TEXT,
        properties JSONB NOT NULL DEFAULT '{}'::jsonb,
        provenance JSONB NOT NULL,
        review_state TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS graph_edges_owner_capsule_idx
        ON graph_edges (owner_uid, capsule_id, edge_type);
      CREATE TABLE IF NOT EXISTS graph_embeddings (
        id TEXT PRIMARY KEY,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        graph_row_id TEXT NOT NULL,
        graph_row_kind TEXT NOT NULL,
        embedding_model TEXT NOT NULL,
        embedding DOUBLE PRECISION[],
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

export function isCapsulePlusGraphConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export async function listCapsulePlusGraphRows(input: {
  ownerUid: string;
  capsuleId: string;
  includeProposed?: boolean;
}): Promise<{ nodes: CapsulePlusGraphNode[]; edges: CapsulePlusGraphEdge[] }> {
  if (!isCapsulePlusGraphConfigured()) return { nodes: [], edges: [] };
  await ensureSchema();
  const states = input.includeProposed ? ['approved', 'proposed', 'draft'] : ['approved'];
  const [nodes, edges] = await Promise.all([
    getPool().query(
      `SELECT * FROM graph_nodes WHERE owner_uid = $1 AND capsule_id = $2 AND review_state = ANY($3) ORDER BY created_at ASC LIMIT 1000`,
      [input.ownerUid, input.capsuleId, states],
    ),
    getPool().query(
      `SELECT * FROM graph_edges WHERE owner_uid = $1 AND capsule_id = $2 AND review_state = ANY($3) ORDER BY created_at ASC LIMIT 1000`,
      [input.ownerUid, input.capsuleId, states],
    ),
  ]);
  return {
    nodes: nodes.rows.map(rowToNode),
    edges: edges.rows.map(rowToEdge),
  };
}

export async function upsertApprovedCapsulePlusGraphRows(input: {
  ownerUid: string;
  capsuleId: string;
  nodes: CapsulePlusGraphNode[];
  edges: CapsulePlusGraphEdge[];
}): Promise<{ nodesWritten: number; edgesWritten: number; skipped: number }> {
  if (!isCapsulePlusGraphConfigured()) return { nodesWritten: 0, edgesWritten: 0, skipped: input.nodes.length + input.edges.length };
  await ensureSchema();
  let nodesWritten = 0;
  let edgesWritten = 0;
  let skipped = 0;
  for (const node of input.nodes) {
    const scoped = CapsulePlusGraphNodeSchema.parse({ ...node, ownerUid: input.ownerUid, capsuleId: input.capsuleId });
    if (scoped.reviewState !== 'approved') {
      skipped += 1;
      continue;
    }
    await getPool().query(
      `INSERT INTO graph_nodes (id, owner_uid, capsule_id, node_type, label, properties, provenance, review_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, properties = EXCLUDED.properties, provenance = EXCLUDED.provenance, review_state = EXCLUDED.review_state, updated_at = now()`,
      [scoped.id, scoped.ownerUid, scoped.capsuleId, scoped.type, scoped.label, scoped.properties, scoped.provenance, scoped.reviewState],
    );
    nodesWritten += 1;
  }
  for (const edge of input.edges) {
    const scoped = CapsulePlusGraphEdgeSchema.parse({ ...edge, ownerUid: input.ownerUid, capsuleId: input.capsuleId });
    if (scoped.reviewState !== 'approved') {
      skipped += 1;
      continue;
    }
    await getPool().query(
      `INSERT INTO graph_edges (id, owner_uid, capsule_id, from_node_id, to_node_id, edge_type, label, properties, provenance, review_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET from_node_id = EXCLUDED.from_node_id, to_node_id = EXCLUDED.to_node_id, label = EXCLUDED.label, properties = EXCLUDED.properties, provenance = EXCLUDED.provenance, review_state = EXCLUDED.review_state, updated_at = now()`,
      [scoped.id, scoped.ownerUid, scoped.capsuleId, scoped.fromNodeId, scoped.toNodeId, scoped.type, scoped.label ?? null, scoped.properties, scoped.provenance, scoped.reviewState],
    );
    edgesWritten += 1;
  }
  return { nodesWritten, edgesWritten, skipped };
}

function rowToNode(row: QueryResultRow): CapsulePlusGraphNode {
  return CapsulePlusGraphNodeSchema.parse({
    id: String(row.id),
    ownerUid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    type: row.node_type,
    label: String(row.label),
    properties: row.properties ?? {},
    provenance: row.provenance,
    reviewState: row.review_state,
  });
}

function rowToEdge(row: QueryResultRow): CapsulePlusGraphEdge {
  return CapsulePlusGraphEdgeSchema.parse({
    id: String(row.id),
    ownerUid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    type: row.edge_type,
    fromNodeId: String(row.from_node_id),
    toNodeId: String(row.to_node_id),
    label: row.label ?? undefined,
    properties: row.properties ?? {},
    provenance: row.provenance,
    reviewState: row.review_state,
  });
}
