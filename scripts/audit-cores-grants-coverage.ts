import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    failures.push(`missing ${path}`);
    return '';
  }
}

const migration = read('backend/migrations/versions/0019_cores_baseline.py');
const router = read('backend/routers/cores.py');
const proxy = read('src/app/api/backend/[...path]/route.ts');
const drawer = read('src/components/v7/v7-core-drawer.tsx');

for (const token of [
  "principal_kind text NOT NULL CHECK (principal_kind IN ('user','team'))",
  'core_grants.principal_kind =',
  'core_grants.principal_id = current_tenant()',
  'principal_kind = \'user\' AND principal_id = current_tenant()',
  'WITH CHECK (owner_uid = current_tenant())',
]) {
  if (!migration.includes(token)) failures.push(`core grants RLS missing ${token}`);
}

for (const forbidden of ["principal_kind IN ('user','team','link','public')", "core_grants.principal_kind = 'public'"]) {
  if (migration.includes(forbidden)) failures.push(`core grants migration still permits v7-disabled grant path: ${forbidden}`);
}

for (const token of [
  '@router.post("/{core_id}/grants")',
  '@router.delete("/{core_id}/grants/{grant_id}")',
  "'share'",
  "'unshare'",
  'public_link_grants_disabled_in_v7',
  'current_user = token["uid"]',
]) {
  if (!router.includes(token)) failures.push(`backend cores grants route missing ${token}`);
}

for (const token of [
  "method: 'POST', pattern: /^cores\\/[^/]+\\/(fork|grants)$/",
  "method: 'DELETE', pattern: /^cores\\/[^/]+\\/grants\\/[^/]+$/",
]) {
  if (!proxy.includes(token)) failures.push(`Next backend proxy missing ${token}`);
}

for (const token of ['Share Case Core', 'principalId', '/grants', 'Fork Case Core']) {
  if (!drawer.includes(token)) failures.push(`Core drawer missing share/fork UI token: ${token}`);
}

if (failures.length > 0) {
  console.error('[audit:cores-grants-coverage] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:cores-grants-coverage] ok');
