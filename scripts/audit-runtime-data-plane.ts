import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import {
  EXPECTED_FIRESTORE_PATHS,
  buildRuntimeDataPlaneReport,
  redactString,
  renderRuntimeDataPlaneMarkdown,
  type CloudSqlIntrospection,
} from '@/lib/audits/runtime-data-plane';

const root = process.cwd();
const outDir = join(root, 'docs', 'audits');
const stamp = new Date().toISOString().slice(0, 10);
const baseName = `${stamp}-runtime-data-plane-diagnostic`;

async function main(): Promise<void> {
  const firestoreSamples = await collectFirestoreSamples();
  const sqlIntrospection = await collectCloudSqlIntrospection();
  const report = await buildRuntimeDataPlaneReport({
    firestoreSamples,
    sqlIntrospection,
  });
  const markdown = renderRuntimeDataPlaneMarkdown(report);
  const json = `${JSON.stringify(report, null, 2)}\n`;

  mkdirSync(outDir, { recursive: true });
  const mdPath = join(outDir, `${baseName}.md`);
  const jsonPath = join(outDir, `${baseName}.json`);
  writeFileSync(mdPath, markdown, 'utf8');
  writeFileSync(jsonPath, json, 'utf8');

  const counts = report.findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.status] = (acc[finding.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log('audit:runtime-data-plane OK');
  console.log(`Markdown: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`Findings: PASS=${counts.PASS ?? 0} WARN=${counts.WARN ?? 0} FAIL=${counts.FAIL ?? 0} BLOCKED=${counts.BLOCKED ?? 0}`);
  const strict = process.argv.includes('--strict') || process.env.PRAXIS_RUNTIME_DATA_PLANE_STRICT === '1';
  if (strict && report.findings.some((finding) => finding.status === 'FAIL')) {
    process.exitCode = 1;
  }
}

async function collectFirestoreSamples(): Promise<Partial<Record<string, boolean>> | undefined> {
  const uid = process.env.PRAXIS_DIAGNOSTIC_UID?.trim();
  if (!uid) return undefined;

  try {
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    const db = getAdminDbOrThrow();
    const capsuleId = process.env.PRAXIS_DIAGNOSTIC_CAPSULE_ID?.trim() || null;
    const threadId = process.env.PRAXIS_DIAGNOSTIC_THREAD_ID?.trim() || null;
    const situationId = process.env.PRAXIS_DIAGNOSTIC_SITUATION_ID?.trim() || null;
    const outputId = process.env.PRAXIS_DIAGNOSTIC_OUTPUT_ID?.trim() || null;

    const samples: Partial<Record<string, boolean>> = {};
    await Promise.all(EXPECTED_FIRESTORE_PATHS.map(async (check) => {
      samples[check.path] = await samplePath({
        uid,
        capsuleId,
        threadId,
        situationId,
        outputId,
        templatePath: check.path,
        db,
      });
    }));
    return samples;
  } catch (error) {
    console.warn(`Firestore sampling blocked: ${redactString(error instanceof Error ? error.message : String(error))}`);
    return undefined;
  }
}

async function samplePath(input: {
  uid: string;
  capsuleId: string | null;
  threadId: string | null;
  situationId: string | null;
  outputId: string | null;
  templatePath: string;
  db: FirebaseFirestore.Firestore;
}): Promise<boolean> {
  const { db, uid, capsuleId, threadId, situationId, outputId, templatePath } = input;
  switch (templatePath) {
    case 'users/{uid}':
      return (await db.collection('users').doc(uid).get()).exists;
    case 'users/{uid}/profile/analyst':
      return (await db.collection('users').doc(uid).collection('profile').doc('analyst').get()).exists;
    case 'users/{uid}/usage/{period}':
      return !(await db.collection('users').doc(uid).collection('usage').limit(1).get()).empty;
    case 'users/{uid}/settings/api_keys_encrypted/providers/{provider}':
      return !(await db.collection('users').doc(uid).collection('settings').doc('api_keys_encrypted').collection('providers').limit(1).get()).empty;
    case 'users/{uid}/capsules/{capsuleId}':
      return capsuleId
        ? (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).get()).exists
        : !(await db.collection('users').doc(uid).collection('capsules').limit(1).get()).empty;
    case 'users/{uid}/capsules/{capsuleId}/versions/{version}':
      if (!capsuleId) return false;
      return !(await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('versions').limit(1).get()).empty;
    case 'users/{uid}/capsules/{capsuleId}/sources/{sourceId}':
      if (!capsuleId) return false;
      return !(await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('sources').limit(1).get()).empty;
    case 'users/{uid}/capsules/{capsuleId}/researchDossiers/starter-dossier':
      if (!capsuleId) return false;
      return (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('researchDossiers').doc('starter-dossier').get()).exists;
    case 'users/{uid}/capsules/{capsuleId}/claimLedgers/starter-claims':
      if (!capsuleId) return false;
      return (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('claimLedgers').doc('starter-claims').get()).exists;
    case 'users/{uid}/capsules/{capsuleId}/humanWorkflowExamples/starter-workflow':
      if (!capsuleId) return false;
      return (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('humanWorkflowExamples').doc('starter-workflow').get()).exists;
    case 'users/{uid}/capsules/{capsuleId}/sourceRefreshDockets/starter-refresh':
      if (!capsuleId) return false;
      return (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('sourceRefreshDockets').doc('starter-refresh').get()).exists;
    case 'users/{uid}/capsules/{capsuleId}/ontologyGraphs/starter-seed':
      if (!capsuleId) return false;
      return (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('ontologyGraphs').doc('starter-seed').get()).exists;
    case 'users/{uid}/capsules/{capsuleId}/askThreads/{threadId}':
      if (!capsuleId) return false;
      return threadId
        ? (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('askThreads').doc(threadId).get()).exists
        : !(await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('askThreads').limit(1).get()).empty;
    case 'users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns/{turnId}':
      if (!capsuleId || !threadId) return false;
      return !(await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('askThreads').doc(threadId).collection('turns').limit(1).get()).empty;
    case 'users/{uid}/contextStacks/default':
      return (await db.collection('users').doc(uid).collection('contextStacks').doc('default').get()).exists;
    case 'users/{uid}/conversations/{conversationId}/turns/{turnId}': {
      const conversations = await db.collection('users').doc(uid).collection('conversations').limit(1).get();
      if (conversations.empty) return false;
      return !(await conversations.docs[0].ref.collection('turns').limit(1).get()).empty;
    }
    case 'users/{uid}/situations/{situationId}/memos/{memoId}':
      if (!situationId) return false;
      return !(await db.collection('users').doc(uid).collection('situations').doc(situationId).collection('memos').limit(1).get()).empty;
    case 'users/{uid}/situations/{situationId}/documents/{documentId}':
      if (!situationId) return false;
      return !(await db.collection('users').doc(uid).collection('situations').doc(situationId).collection('documents').limit(1).get()).empty;
    case 'users/{uid}/outputCapsules/{outputId}':
      return outputId
        ? (await db.collection('users').doc(uid).collection('outputCapsules').doc(outputId).get()).exists
        : !(await db.collection('users').doc(uid).collection('outputCapsules').limit(1).get()).empty;
    case 'users/{uid}/capsules/{capsuleId}/outputs/{outputId}':
      if (!capsuleId) return false;
      return outputId
        ? (await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('outputs').doc(outputId).get()).exists
        : !(await db.collection('users').doc(uid).collection('capsules').doc(capsuleId).collection('outputs').limit(1).get()).empty;
    default:
      return false;
  }
}

async function collectCloudSqlIntrospection(): Promise<CloudSqlIntrospection | null> {
  const connectionString = process.env.ASK_THREAD_DATABASE_URL
    || process.env.AGENT_RUNTIME_DATABASE_URL
    || process.env.PRAXIS_DATABASE_URL
    || process.env.DATABASE_URL
    || null;
  if (!connectionString) return null;

  const pool = new Pool({
    connectionString,
    max: 1,
    ssl: process.env.ASK_THREAD_PG_SSL === 'true' || process.env.AGENT_RUNTIME_PG_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    const [columns, indexes] = await Promise.all([
      pool.query<{ table_name: string; column_name: string }>(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name, ordinal_position
      `, [['ask_threads', 'ask_thread_turns', 'agent_runs', 'agent_run_events', 'agent_tool_calls', 'agent_approvals']]),
      pool.query<{ table_name: string; indexname: string }>(`
        SELECT tablename AS table_name, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
        ORDER BY tablename, indexname
      `, [['ask_threads', 'ask_thread_turns', 'agent_runs', 'agent_run_events', 'agent_tool_calls', 'agent_approvals']]),
    ]);
    const introspection: CloudSqlIntrospection = { tables: {} };
    for (const row of columns.rows) {
      introspection.tables[row.table_name] ??= { columns: [], indexes: [] };
      introspection.tables[row.table_name].columns.push(row.column_name);
    }
    for (const row of indexes.rows) {
      introspection.tables[row.table_name] ??= { columns: [], indexes: [] };
      introspection.tables[row.table_name].indexes.push(row.indexname);
    }
    return introspection;
  } catch (error) {
    console.warn(`Cloud SQL introspection blocked: ${redactString(error instanceof Error ? error.message : String(error))}`);
    return null;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

void main().catch((error) => {
  console.error(`audit:runtime-data-plane failed: ${redactString(error instanceof Error ? error.stack ?? error.message : String(error))}`);
  process.exit(1);
});
