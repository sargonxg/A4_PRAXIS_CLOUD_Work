import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_KG_BACKEND, KG_BACKEND_MODES } from '@/lib/kg/backend';

const failures: string[] = [];
const requiredFiles = [
  'backend/migrations/versions/0011_postgres_kg_contract.py',
  'backend/services/kg_repositories.py',
  'docs/architecture/POSTGRES_SCHEMA.md',
  'docs/architecture/KG_BACKEND.md',
  'docs/architecture/COST_NOTES.md',
  'docs/runbooks/POSTGRES_OPERATIONS.md',
];

for (const file of requiredFiles) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

if (DEFAULT_KG_BACKEND !== 'postgres') failures.push('DEFAULT_KG_BACKEND must be postgres');
for (const mode of ['postgres', 'neo4j', 'both']) {
  if (!KG_BACKEND_MODES.includes(mode as never)) failures.push(`missing KG_BACKEND mode ${mode}`);
}

const backendConfig = readFileSync(join(process.cwd(), 'backend/config.py'), 'utf8');
if (!backendConfig.includes('KG_BACKEND') || !backendConfig.includes('default="postgres"')) {
  failures.push('backend/config.py must expose KG_BACKEND with postgres default');
}

const migration = readFileSync(join(process.cwd(), 'backend/migrations/versions/0011_postgres_kg_contract.py'), 'utf8');
for (const table of ['graph_nodes', 'graph_edges', 'graph_embeddings', 'graph_audit']) {
  if (!migration.includes(table)) failures.push(`migration missing ${table}`);
}

const repos = readFileSync(join(process.cwd(), 'backend/services/kg_repositories.py'), 'utf8');
for (const symbol of ['NodeRepo', 'EdgeRepo', 'GraphTraversalRepo', 'EmbeddingRepo', 'owner_uid', 'case_id']) {
  if (!repos.includes(symbol)) failures.push(`KG repository layer missing ${symbol}`);
}

if (failures.length > 0) {
  console.error('KG backend audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('KG backend audit passed. (static-marker)');
