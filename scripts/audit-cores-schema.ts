import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const baseline = readFileSync(join(root, 'backend/migrations/versions/0019_cores_baseline.py'), 'utf8');
const linkage = readFileSync(join(root, 'backend/migrations/versions/0020_cores_linkage.py'), 'utf8');

const failures: string[] = [];

for (const token of [
  'revision = "0019_cores_baseline"',
  'down_revision = "0018_notifications_feedback_system"',
  'CREATE TABLE IF NOT EXISTS cores',
  'CREATE TABLE IF NOT EXISTS core_grants',
  'CREATE TABLE IF NOT EXISTS core_audit',
  'ENABLE ROW LEVEL SECURITY',
  'current_tenant()',
  'DROP TABLE IF EXISTS core_audit',
  'DROP TABLE IF EXISTS core_grants',
  'DROP TABLE IF EXISTS cores',
]) {
  if (!baseline.includes(token)) failures.push(`0019 missing required token: ${token}`);
}

for (const kind of ['praxis', 'user', 'team', 'situation', 'source', 'document', 'graph', 'output']) {
  if (!baseline.includes(`'${kind}'`)) failures.push(`0019 cores.kind check missing ${kind}`);
}

for (const column of [
  'owner_uid text NOT NULL',
  'metadata jsonb NOT NULL',
  'parent_core_id uuid REFERENCES cores(id)',
  'cores_platform_owner',
]) {
  if (!baseline.includes(column)) failures.push(`0019 cores schema missing ${column}`);
}

for (const token of [
  'revision = "0020_cores_linkage"',
  'down_revision = "0019_cores_baseline"',
  'ADD COLUMN IF NOT EXISTS core_id uuid REFERENCES cores(id) ON DELETE SET NULL',
  'DROP COLUMN IF EXISTS core_id',
]) {
  if (!linkage.includes(token)) failures.push(`0020 missing required token: ${token}`);
}

for (const table of [
  'cases',
  'situation_frames',
  'source_receipts',
  'documents',
  'graph_nodes',
  'graph_edges',
  'graph_embeddings',
  'memos',
  'memo_versions',
  'drafts',
  'briefings',
  'boardroom_briefings',
  'recipe_runs',
  'dialectica_runs',
  'research_threads',
  'ach_hypotheses',
  'workspace_suggestions',
  'workspace_orchestrator_log',
]) {
  if (!linkage.includes(`"${table}"`)) failures.push(`0020 linkage missing table: ${table}`);
}

if (failures.length > 0) {
  console.error('Core schema audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Core schema audit passed: migrations 0019/0020 define cores, linkage columns, RLS, and downgrades.');
