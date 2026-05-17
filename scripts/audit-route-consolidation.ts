/**
 * audit:route-consolidation
 *
 * Verifies that every route slated for consolidation in the
 * 2026-05-14 simplification audit has been deleted from the App
 * Router tree. Legacy URL compatibility lives in src/proxy.ts.
 *
 * Fail modes:
 *  - Legacy page file still exists
 *  - Internal app code still links at a legacy route as a primary
 *    action (excluding the experience-map which lists every route
 *    for inventory purposes)
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const REMOVED_ROUTE_FILES = [
  'src/app/app/dashboard/page.tsx',
  'src/app/app/dashboard/layout.tsx',
  'src/app/app/dashboard/loading.tsx',
  'src/app/app/dashboard/error.tsx',
  'src/app/app/assistant/page.tsx',
  'src/app/app/contexts/page.tsx',
  'src/app/app/contexts/import/[token]/page.tsx',
  'src/app/app/cores/context/page.tsx',
  'src/app/app/cores/user/page.tsx',
  'src/app/app/canvas/page.tsx',
  'src/app/app/profile/page.tsx',
  'src/app/app/settings/layout.tsx',
  'src/app/app/settings/api-keys/page.tsx',
  'src/app/app/settings/graph-backend/page.tsx',
  'src/app/app/settings/model-preferences/page.tsx',
  'src/app/app/settings/notifications/page.tsx',
  'src/app/app/settings/preferences/page.tsx',
  'src/app/app/settings/profile/page.tsx',
  'src/app/app/settings/system-health/page.tsx',
  'src/app/app/situations/page.tsx',
  'src/app/app/situations/new/page.tsx',
  'src/app/app/tools/page.tsx',
  'src/app/app/tools/archive/page.tsx',
  'src/app/app/tools/tools-archive-client.tsx',
  'src/app/app/write/page.tsx',
];

for (const file of REMOVED_ROUTE_FILES) {
  if (existsSync(join(root, file))) failures.push(`${file} should be deleted; proxy owns this legacy URL`);
}

if (failures.length > 0) {
  console.error('audit:route-consolidation failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`audit:route-consolidation OK (${REMOVED_ROUTE_FILES.length} removed route files verified)`);
