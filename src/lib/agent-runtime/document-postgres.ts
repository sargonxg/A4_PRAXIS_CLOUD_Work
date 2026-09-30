import { Pool } from 'pg';

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getDatabaseUrl(): string | null {
  return process.env.DOCUMENT_DATABASE_URL
    || process.env.ASK_THREAD_DATABASE_URL
    || process.env.AGENT_RUNTIME_DATABASE_URL
    || process.env.PRAXIS_DATABASE_URL
    || process.env.DATABASE_URL
    || null;
}

function getPool(): Pool {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('Document SQL mirror is not configured: set DOCUMENT_DATABASE_URL, AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: Number(process.env.DOCUMENT_PG_POOL_MAX ?? process.env.AGENT_RUNTIME_PG_POOL_MAX ?? 5),
      ssl: process.env.DOCUMENT_PG_SSL === 'true' || process.env.AGENT_RUNTIME_PG_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

export function isDocumentSqlMirrorConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

/** Delete only this owner's mirror through its own configured database pool. */
export async function eraseOwnerDocumentMirror(ownerUid: string): Promise<void> {
  if (!ownerUid.trim()) throw new Error('An owner is required for document mirror erasure.');
  if (!isDocumentSqlMirrorConfigured()) return;
  const existing = await getPool().query<{ relation: string | null }>("SELECT to_regclass('public.document_ingestion_records') AS relation");
  if (existing.rows[0]?.relation) {
    await getPool().query('DELETE FROM document_ingestion_records WHERE owner_uid = $1', [ownerUid]);
  }
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS document_ingestion_records (
        id TEXT PRIMARY KEY,
        owner_uid TEXT NOT NULL,
        situation_id TEXT NOT NULL,
        title TEXT NOT NULL,
        file_type TEXT NOT NULL,
        size_bytes BIGINT NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        bucket_uri TEXT,
        source_core_id TEXT,
        source_receipt_id TEXT,
        ingestion_run_id TEXT,
        ingestion_status TEXT,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        entity_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS document_ingestion_records_owner_situation_idx
        ON document_ingestion_records (owner_uid, situation_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS document_ingestion_records_ingestion_run_idx
        ON document_ingestion_records (ingestion_run_id);
    `).then(() => undefined);
  }
  return schemaReady;
}

export async function mirrorDocumentIngestionSql(input: {
  id: string;
  ownerUid: string;
  situationId: string;
  title: string;
  fileType: string;
  sizeBytes: number;
  status: string;
  bucketUri?: string | null;
  sourceCoreId?: string | null;
  sourceReceiptId?: string | null;
  ingestionRunId?: string | null;
  ingestionStatus?: string | null;
  chunkCount?: number;
  entityCount?: number;
  metadata?: Record<string, unknown>;
  now?: Date;
}): Promise<void> {
  if (!isDocumentSqlMirrorConfigured()) return;
  await ensureSchema();
  const now = input.now ?? new Date();
  await getPool().query(
    `
      INSERT INTO document_ingestion_records (
        id, owner_uid, situation_id, title, file_type, size_bytes, status,
        bucket_uri, source_core_id, source_receipt_id, ingestion_run_id,
        ingestion_status, chunk_count, entity_count, metadata, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16)
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        file_type = EXCLUDED.file_type,
        size_bytes = EXCLUDED.size_bytes,
        status = EXCLUDED.status,
        bucket_uri = EXCLUDED.bucket_uri,
        source_core_id = EXCLUDED.source_core_id,
        source_receipt_id = EXCLUDED.source_receipt_id,
        ingestion_run_id = EXCLUDED.ingestion_run_id,
        ingestion_status = EXCLUDED.ingestion_status,
        chunk_count = EXCLUDED.chunk_count,
        entity_count = EXCLUDED.entity_count,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
    `,
    [
      input.id,
      input.ownerUid,
      input.situationId,
      input.title,
      input.fileType,
      input.sizeBytes,
      input.status,
      input.bucketUri ?? null,
      input.sourceCoreId ?? null,
      input.sourceReceiptId ?? null,
      input.ingestionRunId ?? null,
      input.ingestionStatus ?? null,
      Math.max(0, Math.floor(input.chunkCount ?? 0)),
      Math.max(0, Math.floor(input.entityCount ?? 0)),
      JSON.stringify(input.metadata ?? {}),
      now,
    ],
  );
}
