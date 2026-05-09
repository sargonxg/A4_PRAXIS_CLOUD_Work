import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const migration = readFileSync(join(root, 'backend/migrations/versions/0022_ask_threads.py'), 'utf8');
const tsTypes = readFileSync(join(root, 'src/lib/ask/types.ts'), 'utf8');
const pyTypes = readFileSync(join(root, 'backend/services/ask/types/models.py'), 'utf8');
const askPage = readFileSync(join(root, 'src/app/app/ask/page.tsx'), 'utf8');
const askSurface = readFileSync(join(root, 'src/components/v7/v7-ask-surface.tsx'), 'utf8');

for (const token of [
  'revision = "0022_ask_threads"',
  'down_revision = "0020_cores_linkage"',
  'CREATE TABLE IF NOT EXISTS ask_threads',
  'CREATE TABLE IF NOT EXISTS ask_messages',
  'CREATE TABLE IF NOT EXISTS ask_message_citations',
  'owner_uid text NOT NULL',
  'attached_core_ids uuid[]',
  'ENABLE ROW LEVEL SECURITY',
  'current_tenant()',
  'DROP TABLE IF EXISTS ask_message_citations',
  'DROP TABLE IF EXISTS ask_messages',
  'DROP TABLE IF EXISTS ask_threads',
]) {
  if (!migration.includes(token)) failures.push(`0022 ask migration missing ${token}`);
}

for (const mode of ['quick', 'deep', 'plan', 'memo', 'brief', 'talking_points']) {
  if (!migration.includes(`'${mode}'`)) failures.push(`0022 ask migration missing mode ${mode}`);
  if (!tsTypes.includes(`'${mode}'`)) failures.push(`Ask TS types missing mode ${mode}`);
  if (!pyTypes.includes(`"${mode}"`)) failures.push(`Ask Python types missing mode ${mode}`);
}

for (const action of ['direct_answer', 'run_skill', 'run_subagent_plan', 'clarify']) {
  if (!migration.includes(`'${action}'`)) failures.push(`0022 ask migration missing route action ${action}`);
  if (!tsTypes.includes(`'${action}'`)) failures.push(`Ask TS types missing route action ${action}`);
  if (!pyTypes.includes(`"${action}"`)) failures.push(`Ask Python types missing route action ${action}`);
}

for (const sourceKind of ['source_receipt', 'document', 'graph_node', 'graph_edge', 'core', 'web', 'other']) {
  if (!migration.includes(`'${sourceKind}'`)) failures.push(`0022 ask migration missing citation source kind ${sourceKind}`);
  if (!tsTypes.includes(`'${sourceKind}'`)) failures.push(`Ask TS types missing citation source kind ${sourceKind}`);
  if (!pyTypes.includes(`"${sourceKind}"`)) failures.push(`Ask Python types missing citation source kind ${sourceKind}`);
}

for (const token of ['askThreadSchema', 'askMessageSchema', 'askMessageCitationSchema', 'askRunRequestSchema']) {
  if (!tsTypes.includes(token)) failures.push(`Ask TS types missing ${token}`);
}

for (const token of ['class AskThread', 'class AskMessage', 'class AskMessageCitation', 'class AskRunRequest']) {
  if (!pyTypes.includes(token)) failures.push(`Ask Python types missing ${token}`);
}

if (!askPage.includes('V7AskSurface')) failures.push('/app/ask does not render V7AskSurface');
for (const token of ['data-testid="v7-ask-surface"', 'ChatInterface', 'Attached cores', 'ASK_MODES']) {
  if (!askSurface.includes(token)) failures.push(`V7 Ask surface missing ${token}`);
}

if (failures.length > 0) {
  console.error('[audit:ask-thread-substrate] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ask-thread-substrate] ok');
