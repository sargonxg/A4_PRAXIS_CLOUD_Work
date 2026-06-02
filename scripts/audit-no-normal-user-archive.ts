/**
 * audit:no-normal-user-archive
 *
 * The Workspace navigation group (the short spine every user always sees)
 * must never point at archive, specialist, admin, or experimental routes.
 * Those belong to Knowledge, Advanced, or Administration groups.
 *
 * Fail modes:
 *  - A Workspace NAV_GROUPS entry has an href starting with
 *    /app/admin, /app/tools/archive, /app/settings, or
 *    /app/workbench/[caseId]/ach.
 *  - The Workspace group exceeds six mode labels (creep guard).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const navPath = 'src/lib/navigation/primary-nav.ts';
const full = join(root, navPath);
if (!existsSync(full)) {
  console.error(`audit:no-normal-user-archive failed: missing ${navPath}`);
  process.exit(1);
}
const src = readFileSync(full, 'utf8');

// Slice out the workspace group block. Look for the comma-terminated
// id marker that only appears inside an actual group entry (the
// type union "id: 'workspace' | 'advanced'" lacks the trailing comma).
function sliceGroup(s: string, groupId: string): string {
  const marker = `id: '${groupId}',`;
  const start = s.indexOf(marker);
  if (start === -1) return '';
  // Find the next group's marker after this one.
  const nextMarkers = ['workspace', 'knowledge', 'advanced', 'administration']
    .filter((id) => id !== groupId)
    .map((id) => s.indexOf(`id: '${id}',`, start + marker.length))
    .filter((idx) => idx !== -1);
  const next = nextMarkers.length > 0 ? Math.min(...nextMarkers) : s.length;
  return s.slice(start, next);
}

const workspaceBlock = sliceGroup(src, 'workspace');
if (!workspaceBlock) {
  console.error(`audit:no-normal-user-archive failed: workspace group marker "id: 'workspace',"  not found in ${navPath}`);
  process.exit(1);
}

const hrefMatches = [...workspaceBlock.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);

if (hrefMatches.length === 0) {
  failures.push('Workspace group has no href entries — has the schema changed?');
}

if (hrefMatches.length > 6) {
  failures.push(`Workspace group has ${hrefMatches.length} items — must stay <= 6 while all modes point at /app`);
}

const FORBIDDEN_PREFIXES = [
  '/app/admin',
  '/app/tools/archive',
  '/app/settings',
];

const FORBIDDEN_SUFFIXES = [
  '/ach',
];

for (const href of hrefMatches) {
  for (const prefix of FORBIDDEN_PREFIXES) {
    if (href.startsWith(prefix)) {
      failures.push(`Workspace link ${href} points at restricted prefix ${prefix} (move to Advanced or Administration)`);
    }
  }
  for (const suffix of FORBIDDEN_SUFFIXES) {
    if (href.endsWith(suffix) || href.includes(`${suffix}/`)) {
      failures.push(`Workspace link ${href} ends with restricted suffix ${suffix} (advanced workbench tabs only)`);
    }
  }
  if (href.includes('show_archive=1')) {
    failures.push(`Workspace link ${href} surfaces the archive — must be admin-only`);
  }
}

if (failures.length > 0) {
  console.error('audit:no-normal-user-archive failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`audit:no-normal-user-archive OK (${hrefMatches.length} Workspace hrefs verified)`);
