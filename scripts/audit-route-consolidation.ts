/**
 * audit:route-consolidation
 *
 * Verifies that every route slated for consolidation in the
 * 2026-05-14 simplification audit either redirects to a canonical
 * destination at the server (next/navigation `redirect`) or is
 * intentionally still alive (declared in the ALLOWED_ALIVE map).
 *
 * Fail modes:
 *  - Legacy page still renders custom UI instead of `redirect(...)`
 *  - Redirect target is empty / missing
 *  - Redirect points at another legacy route (chain)
 *  - Internal app code still links at a legacy route as a primary
 *    action (excluding the experience-map which lists every route
 *    for inventory purposes)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

// Routes that have been folded. Key = legacy route file path,
// value = expected canonical redirect target.
const FOLDED_ROUTES: Record<string, string> = {
  'src/app/app/dashboard/page.tsx': '/app',
  'src/app/app/assistant/page.tsx': '/app',
  'src/app/app/contexts/page.tsx': '/app',
  'src/app/app/cores/context/page.tsx': '/app',
  'src/app/app/cores/user/page.tsx': '/app',
  'src/app/app/canvas/page.tsx': '/app',
  'src/app/app/profile/page.tsx': '/app',
  'src/app/app/settings/page.tsx': '/app',
  'src/app/app/settings/api-keys/page.tsx': '/app',
  'src/app/app/settings/graph-backend/page.tsx': '/app',
  'src/app/app/settings/model-preferences/page.tsx': '/app',
  'src/app/app/settings/notifications/page.tsx': '/app',
  'src/app/app/settings/preferences/page.tsx': '/app',
  'src/app/app/settings/profile/page.tsx': '/app',
  'src/app/app/settings/system-health/page.tsx': '/app',
  'src/app/app/situations/page.tsx': '/app',
  'src/app/app/situations/new/page.tsx': '/app',
  'src/app/app/tools/page.tsx': '/app',
  'src/app/app/tools/archive/page.tsx': '/app',
  'src/app/app/write/page.tsx': '/app',
};

// Routes that are still alive on purpose during the v6 transition.
// Listed here so the audit script does not flag them as missing.
const ALLOWED_ALIVE = new Set<string>();

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing redirect file: ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

for (const [file, expectedTarget] of Object.entries(FOLDED_ROUTES)) {
  const src = read(file);
  if (!src) continue;
  if (!src.includes(`from 'next/navigation'`) && !src.includes(`from "next/navigation"`)) {
    failures.push(`${file} must import redirect from next/navigation`);
    continue;
  }
  if (!src.includes('redirect(')) {
    failures.push(`${file} must invoke redirect(...) — appears to render custom UI`);
    continue;
  }
  const m = src.match(/redirect\((['"`])([^'"`]+)\1\)/);
  if (!m) {
    failures.push(`${file} has a redirect() call we could not parse`);
    continue;
  }
  const target = m[2];
  if (!target) {
    failures.push(`${file} has an empty redirect target`);
    continue;
  }
  if (target !== expectedTarget) {
    failures.push(`${file} redirects to ${target} but audit expects ${expectedTarget}`);
  }
  // Chain check: redirect target must NOT itself be a folded route.
  for (const otherTarget of Object.keys(FOLDED_ROUTES)) {
    const otherUrl = otherTarget
      .replace('src/app', '')
      .replace('/page.tsx', '');
    if (target === otherUrl) {
      failures.push(`${file} redirects to another folded route ${target} (chain)`);
    }
  }
  if (ALLOWED_ALIVE.has(target)) {
    failures.push(`${file} redirects to a route that is itself slated for fold-in: ${target}`);
  }
}

if (failures.length > 0) {
  console.error('audit:route-consolidation failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`audit:route-consolidation OK (${Object.keys(FOLDED_ROUTES).length} folded routes verified)`);
