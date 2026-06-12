import { Pool, type QueryResultRow } from 'pg';
import type {
  AskThreadRecord,
  AskThreadTurnRecord,
  PersistAskThreadTurnInput,
} from '@/lib/firebase/ask-thread-service';

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getDatabaseUrl(): string | null {
  return process.env.ASK_THREAD_DATABASE_URL
    || process.env.AGENT_RUNTIME_DATABASE_URL
    || process.env.PRAXIS_DATABASE_URL
    || process.env.DATABASE_URL
    || null;
}

function getPool(): Pool {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('Ask thread SQL memory is not configured: set ASK_THREAD_DATABASE_URL, AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: Number(process.env.ASK_THREAD_PG_POOL_MAX ?? process.env.AGENT_RUNTIME_PG_POOL_MAX ?? 5),
      ssl: process.env.ASK_THREAD_PG_SSL === 'true' || process.env.AGENT_RUNTIME_PG_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

export function isAskThreadSqlConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS ask_threads (
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        situation_id TEXT,
        capsule_version INTEGER,
        last_prompt TEXT NOT NULL DEFAULT '',
        last_output_preview TEXT NOT NULL DEFAULT '',
        turn_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (owner_uid, capsule_id, thread_id)
      );
      CREATE INDEX IF NOT EXISTS ask_threads_owner_updated_idx
        ON ask_threads (owner_uid, updated_at DESC);

      CREATE TABLE IF NOT EXISTS ask_thread_turns (
        id TEXT PRIMARY KEY,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        situation_id TEXT,
        prompt TEXT NOT NULL,
        output TEXT NOT NULL,
        capsule_version INTEGER,
        runtime JSONB NOT NULL DEFAULT '{}'::jsonb,
        path_id TEXT,
        path_version INTEGER,
        framework_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
        tool_invocations JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        FOREIGN KEY (owner_uid, capsule_id, thread_id)
          REFERENCES ask_threads(owner_uid, capsule_id, thread_id)
          ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS ask_thread_turns_thread_created_idx
        ON ask_thread_turns (owner_uid, capsule_id, thread_id, created_at ASC);
    `).then(() => undefined);
  }
  return schemaReady;
}

export async function persistAskThreadTurnSql(input: PersistAskThreadTurnInput): Promise<AskThreadTurnRecord | null> {
  const capsuleId = cleanId(input.capsuleId, '');
  if (!capsuleId || !isAskThreadSqlConfigured()) return null;

  await ensureSchema();
  const threadId = cleanId(input.threadId, 'default');
  const now = input.now ?? new Date();
  const requestedTurnId = cleanId(input.turnId, '');
  const turnId = requestedTurnId || `turn-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = now.toISOString();

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const existingTurnResult = requestedTurnId
      ? await client.query('SELECT created_at FROM ask_thread_turns WHERE id = $1 LIMIT 1', [turnId])
      : { rows: [] };
    const turnAlreadyExists = existingTurnResult.rows.length > 0;
    const createdAt = turnAlreadyExists ? iso(existingTurnResult.rows[0].created_at) : nowIso;
    await client.query(
      `
        INSERT INTO ask_threads (
          owner_uid, capsule_id, thread_id, situation_id, capsule_version,
          last_prompt, last_output_preview, turn_count, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,$8)
        ON CONFLICT (owner_uid, capsule_id, thread_id)
        DO UPDATE SET
          situation_id = COALESCE(EXCLUDED.situation_id, ask_threads.situation_id),
          capsule_version = COALESCE(EXCLUDED.capsule_version, ask_threads.capsule_version),
          last_prompt = EXCLUDED.last_prompt,
          last_output_preview = EXCLUDED.last_output_preview,
          turn_count = ask_threads.turn_count + $9,
          updated_at = EXCLUDED.updated_at
      `,
      [
        input.uid,
        capsuleId,
        threadId,
        input.situationId ?? null,
        input.capsuleVersion ?? null,
        input.prompt.slice(0, 1600),
        input.output.slice(0, 1600),
        nowIso,
        turnAlreadyExists ? 0 : 1,
      ],
    );
    const turnResult = await client.query(
      `
        INSERT INTO ask_thread_turns (
          id, owner_uid, capsule_id, thread_id, situation_id, prompt, output,
          capsule_version, runtime, path_id, path_version, framework_steps,
          tool_invocations, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id)
        DO UPDATE SET
          output = EXCLUDED.output,
          runtime = EXCLUDED.runtime,
          path_id = EXCLUDED.path_id,
          path_version = EXCLUDED.path_version,
          framework_steps = EXCLUDED.framework_steps,
          tool_invocations = EXCLUDED.tool_invocations
        RETURNING *
      `,
      [
        turnId,
        input.uid,
        capsuleId,
        threadId,
        input.situationId ?? null,
        input.prompt,
        input.output,
        input.capsuleVersion ?? null,
        JSON.stringify(input.runtime ?? {}),
        input.pathId ?? null,
        input.pathVersion ?? null,
        JSON.stringify(input.frameworkSteps ?? []),
        JSON.stringify(input.toolInvocations ?? []),
        createdAt,
      ],
    );
    await client.query('COMMIT');
    return rowToTurn(turnResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function listAskThreadTurnsSql(input: {
  uid: string;
  capsuleId: string;
  threadId: string;
  limit?: number;
}): Promise<{ thread: AskThreadRecord | null; turns: AskThreadTurnRecord[] }> {
  if (!isAskThreadSqlConfigured()) return { thread: null, turns: [] };
  const capsuleId = cleanId(input.capsuleId, '');
  const threadId = cleanId(input.threadId, '');
  if (!capsuleId || !threadId) return { thread: null, turns: [] };
  await ensureSchema();
  const safeLimit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const [threadResult, turnsResult] = await Promise.all([
    getPool().query(
      `
        SELECT * FROM ask_threads
        WHERE owner_uid = $1 AND capsule_id = $2 AND thread_id = $3
        LIMIT 1
      `,
      [input.uid, capsuleId, threadId],
    ),
    getPool().query(
      `
        SELECT * FROM ask_thread_turns
        WHERE owner_uid = $1 AND capsule_id = $2 AND thread_id = $3
        ORDER BY created_at DESC
        LIMIT $4
      `,
      [input.uid, capsuleId, threadId, safeLimit],
    ),
  ]);
  return {
    thread: threadResult.rows[0] ? rowToThread(threadResult.rows[0]) : null,
    turns: turnsResult.rows.map(rowToTurn).reverse(),
  };
}

function rowToThread(row: QueryResultRow): AskThreadRecord {
  return {
    uid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    threadId: String(row.thread_id),
    situationId: row.situation_id ?? null,
    capsuleVersion: row.capsule_version === null ? null : Number(row.capsule_version),
    lastPrompt: String(row.last_prompt ?? ''),
    lastOutputPreview: String(row.last_output_preview ?? ''),
    turnCount: Number(row.turn_count ?? 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function rowToTurn(row: QueryResultRow): AskThreadTurnRecord {
  return {
    id: String(row.id),
    uid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    threadId: String(row.thread_id),
    situationId: row.situation_id ?? null,
    prompt: String(row.prompt ?? ''),
    output: String(row.output ?? ''),
    capsuleVersion: row.capsule_version === null ? null : Number(row.capsule_version),
    runtime: isRecord(row.runtime) ? row.runtime : {},
    pathId: row.path_id ?? null,
    pathVersion: row.path_version === null ? null : Number(row.path_version),
    frameworkSteps: Array.isArray(row.framework_steps) ? row.framework_steps : [],
    toolInvocations: Array.isArray(row.tool_invocations) ? row.tool_invocations : [],
    createdAt: iso(row.created_at),
  };
}

function cleanId(value: string | null | undefined, fallback: string): string {
  return value?.trim().replace(/[/?#[\]]/g, '-') || fallback;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
