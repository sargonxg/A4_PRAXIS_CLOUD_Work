import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function expectMissing(rel: string): void {
  if (existsSync(join(root, rel))) failures.push(`${rel} should be removed from the MVP route surface`);
}

const primaryNav = read('src/lib/navigation/primary-nav.ts');
for (const marker of [
  "label: 'Home'",
  "label: 'Ask PRAXIS'",
  "label: 'Library'",
  "label: 'Memo Studio'",
  "label: 'Canvas'",
  "label: 'Advanced'",
  "href: '/app/dashboard'",
  "href: '/app/assistant'",
  "href: '/app/contexts'",
  "href: '/app/write'",
  "href: '/app/canvas'",
  "href: '/app/tools'",
]) {
  if (!primaryNav.includes(marker)) failures.push(`PRIMARY_NAV missing canonical marker: ${marker}`);
}

const sidebar = read('src/components/app/app-sidebar.tsx');
const mobile = read('src/components/app/mobile-bottom-nav.tsx');
if (!sidebar.includes('NAV_GROUPS')) failures.push('sidebar must consume grouped primary navigation from NAV_GROUPS');
if (!mobile.includes('NAV_GROUPS')) failures.push('mobile navigation must consume the Workspace group from NAV_GROUPS');
if (!primaryNav.includes('export const PRIMARY_NAV') || !primaryNav.includes('NAV_GROUPS.flatMap')) {
  failures.push('PRIMARY_NAV must stay derived from NAV_GROUPS for shortcuts and path matching');
}
for (const forbidden of ['Manage cores', 'Manage Cores', '/app/draft', '/app/methods']) {
  if (sidebar.includes(forbidden) || mobile.includes(forbidden)) failures.push(`navigation still includes obsolete marker: ${forbidden}`);
}

const header = read('src/components/app/header.tsx');
for (const marker of ['Command or ask PRAXIS', 'PRAXIS_CANONICAL_TOOLS', 'PRIMARY_NAV']) {
  if (!header.includes(marker)) failures.push(`header missing unified command marker: ${marker}`);
}
if (header.includes('routeLabels')) failures.push('header still uses a hand-maintained route label map');

const proxy = read('src/proxy.ts');
for (const marker of [
  "pathname === '/contexts'",
  "pathname.startsWith('/contexts/')",
  "pathname === '/methods'",
  "pathname.startsWith('/methods/')",
  "pathname === '/ontologies'",
  "pathname.startsWith('/ontologies/')",
  "pathname === '/users'",
  "pathname.startsWith('/users/')",
  "'/app/syria-case'",
  "'/app/workbench/syria-2026'",
]) {
  if (!proxy.includes(marker)) failures.push(`proxy missing legacy redirect marker: ${marker}`);
}
if (proxy.includes("'/app/draft'") || proxy.includes("startsWith('/app/draft/'))")) {
  failures.push('proxy still exposes the old /app/draft route');
}

for (const rel of [
  'src/app/contexts',
  'src/app/methods',
  'src/app/ontologies',
  'src/app/users',
  'src/app/demo',
  'src/app/app/syria-case',
  'src/components/app/situation-selector.tsx',
  'src/components/tour',
  'src/lib/tour',
]) {
  expectMissing(rel);
}

const appShell = read('src/components/app/app-shell.tsx');
if (appShell.includes('<DebugPanel')) failures.push('DebugPanel should not render from AppShell');
if (!appShell.includes('GlobalSearch') || !appShell.includes('initialQuery')) {
  failures.push('AppShell must own the shared command/search overlay state');
}

if (failures.length) {
  console.error('[audit:mvp-route-shape] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:mvp-route-shape] ok');
