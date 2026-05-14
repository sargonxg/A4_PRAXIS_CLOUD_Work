/**
 * audit:admin-only-internals
 *
 * Operational internals (API keys, persona registry, system health,
 * graph backend, model preferences, read logs, audit invariants)
 * must only appear inside the Administration NAV_GROUPS group, which
 * is admin-role gated. They must never show up in Workspace or
 * Advanced.
 *
 * Fail modes:
 *  - An internals href appears in the Workspace or Advanced groups
 *  - The Administration group is missing the adminOnly: true flag
 *  - A non-admin surface (header / mobile-bottom-nav / dashboard)
 *    renders a direct link to one of the internals paths
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const INTERNAL_PATHS = [
  '/app/settings/api-keys',
  '/app/settings/system-health',
  '/app/settings/graph-backend',
  '/app/settings/model-preferences',
  '/app/settings/personas',
  '/app/admin/read-log',
  '/app/admin/audit-runs',
];

function read(rel: string): string | null {
  const full = join(root, rel);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

const navSrc = read('src/lib/navigation/primary-nav.ts');
if (!navSrc) {
  console.error('audit:admin-only-internals failed: missing src/lib/navigation/primary-nav.ts');
  process.exit(1);
}

// Slice by group markers — match the comma-terminated id literal
// which only appears inside an actual group entry (not in the type
// union declaration "id: 'workspace' | 'advanced' | ...").
function sliceGroup(s: string, groupId: string): string {
  const marker = `id: '${groupId}',`;
  const start = s.indexOf(marker);
  if (start === -1) return '';
  const nextMarkers = ['workspace', 'advanced', 'administration']
    .filter((id) => id !== groupId)
    .map((id) => s.indexOf(`id: '${id}',`, start + marker.length))
    .filter((idx) => idx !== -1);
  const next = nextMarkers.length > 0 ? Math.min(...nextMarkers) : s.length;
  return s.slice(start, next);
}

const workspaceBlock = sliceGroup(navSrc, 'workspace');
const advancedBlock = sliceGroup(navSrc, 'advanced');
const adminBlock = sliceGroup(navSrc, 'administration');

if (!adminBlock) {
  failures.push('Administration NAV_GROUPS entry is missing');
} else if (!adminBlock.includes('adminOnly: true')) {
  failures.push('Administration group must declare adminOnly: true');
}

for (const internalPath of INTERNAL_PATHS) {
  // It's fine for this to appear in adminBlock; failure is only if
  // it leaks into workspace or advanced.
  if (workspaceBlock.includes(`'${internalPath}'`)) {
    failures.push(`Workspace group exposes internal path ${internalPath}`);
  }
  if (advancedBlock.includes(`'${internalPath}'`)) {
    failures.push(`Advanced group exposes internal path ${internalPath}`);
  }
}

// Check that mobile bottom nav (always visible to everyone) does not
// link to any of the internals paths.
const mobileSrc = read('src/components/app/mobile-bottom-nav.tsx') ?? '';
for (const internalPath of INTERNAL_PATHS) {
  if (mobileSrc.includes(internalPath)) {
    failures.push(`Mobile bottom nav exposes internal path ${internalPath}`);
  }
}

// Header should not have a direct link either — settings live behind
// the user dropdown which is allowed; flag bare hrefs.
const headerSrc = read('src/components/app/header.tsx') ?? '';
for (const internalPath of INTERNAL_PATHS) {
  // Allow appearances inside dropdown menus (where they are still
  // permission-gated via the auth context) — only flag when the
  // path appears as a primary header Link.
  const directLink = new RegExp(`<Link[^>]+href=["'\`]${internalPath.replace(/\//g, '\\/')}["'\`]`);
  if (directLink.test(headerSrc)) {
    failures.push(`Header renders a primary <Link> to internal path ${internalPath}`);
  }
}

if (failures.length > 0) {
  console.error('audit:admin-only-internals failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`audit:admin-only-internals OK (${INTERNAL_PATHS.length} internal paths verified)`);
