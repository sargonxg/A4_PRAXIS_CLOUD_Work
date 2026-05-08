import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const allowedCogneeImportFiles = new Set([
  path.normalize('backend/services/cognee_memory.py'),
]);

const requiredFiles = [
  'backend/services/cognee_memory.py',
  'backend/services/cognee_bridge.py',
  'backend/routers/memory.py',
  'backend/migrations/versions/0013_cognee_bridge.py',
  'backend/migrations/versions/0014_cognee_provenance_firewall.py',
  'backend/migrations/sql/cognee_database_setup.sql',
  'backend/migrations/sql/cognee_rls_apply.sql',
  'src/app/api/memory/[...slug]/route.ts',
  'src/app/api/health/features/route.ts',
  'src/hooks/use-feature-flags.ts',
  'src/lib/features/client.ts',
  'src/lib/knowledge/memory-layer.ts',
  'src/types/env.d.ts',
  'docs/architecture/COGNEE_MEMORY_LAYER.md',
  'docs/runbooks/MEMORY_LAYER_RUNBOOK.md',
  'docs/adr/0049-cognee-memory-layer-disabled-first.md',
  'infrastructure/deploy-cognee.sh',
  'infrastructure/cognee-kuzu-snapshot.sh',
  'infrastructure/scheduler/cognee-kuzu-snapshot.yaml',
  'monitoring/dashboards/cognee.json',
  'scripts/audit-cognee-operations.ts',
];

for (const file of requiredFiles) {
  try {
    statSync(path.join(root, file));
  } catch {
    failures.push(`missing required Cognee architecture file: ${file}`);
  }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full);
    if (rel.includes('node_modules') || rel.includes('.next') || rel.includes('.venv') || rel.includes('__pycache__')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(py|ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

for (const file of walk(path.join(root, 'backend')).concat(walk(path.join(root, 'src')))) {
  const rel = path.normalize(path.relative(root, file));
  const source = readFileSync(file, 'utf8');
  const importsCognee = /^\s*(import|from)\s+cognee\b/m.test(source);
  if (importsCognee && !allowedCogneeImportFiles.has(rel)) {
    failures.push(`${rel}: direct Cognee SDK import outside backend/services/cognee_memory.py`);
  }
}

const bridgeMigration = readFileSync(path.join(root, 'backend/migrations/versions/0013_cognee_bridge.py'), 'utf8');
for (const marker of [
  'aco_cognee_link',
  'confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 0.600)',
  'ENABLE ROW LEVEL SECURITY',
  'current_tenant',
]) {
  if (!bridgeMigration.includes(marker)) failures.push(`0013_cognee_bridge.py missing marker: ${marker}`);
}

const backendMain = readFileSync(path.join(root, 'backend/main.py'), 'utf8');
if (!backendMain.includes('memory.router') || !backendMain.includes('/api/v1/memory')) {
  failures.push('backend/main.py does not mount the memory router at /api/v1/memory');
}

const nextMemoryRoute = readFileSync(path.join(root, 'src/app/api/memory/[...slug]/route.ts'), 'utf8');
if (!nextMemoryRoute.includes('withAuth')) {
  failures.push('src/app/api/memory/[...slug]/route.ts is not protected by withAuth');
}

const featureRoute = readFileSync(path.join(root, 'src/app/api/health/features/route.ts'), 'utf8');
for (const marker of ["process.env.COGNEE_ENABLED === 'true'", 'COGNEE_BACKEND_URL', 'VERTEX_AGENT_ENGINE_ID']) {
  if (!featureRoute.includes(marker)) failures.push(`src/app/api/health/features/route.ts missing marker: ${marker}`);
}

const cogneeSetupSql = readFileSync(path.join(root, 'backend/migrations/sql/cognee_database_setup.sql'), 'utf8');
for (const marker of ['CREATE ROLE praxis_cognee_app', 'current_tenant()', 'REVOKE ALL ON DATABASE praxis_cognee FROM praxis_app']) {
  if (!cogneeSetupSql.includes(marker)) failures.push(`cognee_database_setup.sql missing marker: ${marker}`);
}

const cogneeRlsSql = readFileSync(path.join(root, 'backend/migrations/sql/cognee_rls_apply.sql'), 'utf8');
for (const marker of ['ENABLE ROW LEVEL SECURITY', 'tenant_id = current_tenant()', 'praxis_cognee_app']) {
  if (!cogneeRlsSql.includes(marker)) failures.push(`cognee_rls_apply.sql missing marker: ${marker}`);
}

const deployCognee = readFileSync(path.join(root, 'infrastructure/deploy-cognee.sh'), 'utf8');
for (const marker of ['--no-allow-unauthenticated', 'praxis-cognee-sa', 'COGNEE_LLM_API_KEY=vertex-adc']) {
  if (!deployCognee.includes(marker)) failures.push(`deploy-cognee.sh missing marker: ${marker}`);
}

const firewallMigration = readFileSync(path.join(root, 'backend/migrations/versions/0014_cognee_provenance_firewall.py'), 'utf8');
for (const marker of ['reject_unsafe_cognee_graph_node', "NEW.layer = 'Verdict'", 'NEW.confidence > 0.600', "prov->>'kind' = 'cognee'"]) {
  if (!firewallMigration.includes(marker)) failures.push(`0014_cognee_provenance_firewall.py missing marker: ${marker}`);
}

if (failures.length > 0) {
  console.error('[audit:cognee] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:cognee] ok');
