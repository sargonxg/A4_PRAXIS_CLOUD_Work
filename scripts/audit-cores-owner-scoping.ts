import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const baseline = readFileSync(join(root, 'backend/migrations/versions/0019_cores_baseline.py'), 'utf8');
const failures: string[] = [];

for (const table of ['cores', 'core_grants', 'core_audit']) {
  const tableBlock = baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?\\);`))?.[0] ?? '';
  if (!tableBlock.includes('owner_uid text NOT NULL')) {
    failures.push(`${table} does not declare owner_uid text NOT NULL`);
  }
  if (!baseline.includes('ENABLE ROW LEVEL SECURITY')) {
    failures.push(`${table} does not enable row-level security`);
  }
  if (!baseline.includes('DROP POLICY IF EXISTS') || !baseline.includes('tenant_isolation')) {
    failures.push(`${table} downgrade does not drop tenant policy`);
  }
}

for (const token of [
  'owner_uid = current_tenant() OR owner_uid =',
  'WITH CHECK (owner_uid = current_tenant() OR owner_uid =',
  'cores_platform_owner',
]) {
  if (!baseline.includes(token)) failures.push(`cores tenant policy missing token: ${token}`);
}

const routerPath = join(root, 'backend/routers/cores.py');
if (existsSync(routerPath)) {
  const router = readFileSync(routerPath, 'utf8');
  for (const token of ['tenant_session', 'owner_uid', 'current_user']) {
    if (!router.includes(token)) failures.push(`backend/routers/cores.py exists but does not reference ${token}`);
  }
}

if (failures.length > 0) {
  console.error('Core owner-scoping audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Core owner-scoping audit passed: core tables are owner-scoped, RLS-protected, and router exposure remains gated.');
