import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const allowedTables = new Set(['workspace_suggestions', 'workspace_orchestrator_log', 'aco_cognee_link']);
const writePattern = /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-z_]+)/gi;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (full.includes('__pycache__')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (entry.endsWith('.py')) out.push(full);
  }
  return out;
}

const orchestratorRoot = path.join(root, 'backend/services/workspace_orchestrator');
for (const file of walk(orchestratorRoot)) {
  const rel = path.relative(root, file);
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(writePattern)) {
    const table = match[2].toLowerCase();
    if (!allowedTables.has(table)) failures.push(`${rel}: orchestrator writes disallowed table ${table}`);
  }
}

const cogneeMemory = readFileSync(path.join(root, 'backend/services/cognee_memory.py'), 'utf8');
for (const marker of ['ontology_file_path: str = ACO_ONTOLOGY_FILE', 'temporal_cognify: bool = True', 'save_interaction: bool = True']) {
  if (!cogneeMemory.includes(marker)) failures.push(`cognee_memory.py missing marker: ${marker}`);
}

if (failures.length) {
  console.error('[audit:orchestrator-writes] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:orchestrator-writes] ok (static-marker)');
