import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NAV_GROUPS, PRIMARY_NAV, primaryNavForPath, WORKSPACE_ROUTES } from '../src/lib/navigation/primary-nav';
import { COMMAND_SEARCH_ACTIONS } from '../src/lib/app-search/static-actions';

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
  "label: 'Chat'",
  "label: 'Capsules'",
  "href: '/app'",
  "href: '/app/capsules'",
]) {
  if (!primaryNav.includes(marker)) failures.push(`PRIMARY_NAV missing canonical marker: ${marker}`);
}
const workspaceItems = NAV_GROUPS.find((group) => group.id === 'workspace')?.items ?? [];
if (workspaceItems.length !== 2 || workspaceItems[0]?.href !== '/app' || workspaceItems[1]?.href !== '/app/capsules') {
  failures.push('Workspace primary navigation must contain Chat and Capsules only, in that order');
}
for (const [path, expected] of [
  ['/app', 'home'],
  ['/app/conversations/route-audit', 'home'],
  ['/app/capsules', 'capsules'],
  ['/app/capsules/builder', 'capsules'],
  ['/app/settings', 'settings'],
  ['/app/boardroom', 'boardroom'],
] as const) {
  if (primaryNavForPath(path)?.id !== expected) failures.push(`${path} must resolve to ${expected} navigation`);
}
if (PRIMARY_NAV.length !== NAV_GROUPS.reduce((total, group) => total + group.items.length, 0)) {
  failures.push('Flattened navigation must include secondary destinations for shortcuts and path matching');
}
for (const removedPrimary of ["label: 'Repository'", "href: '/app/repository'"]) {
  if (primaryNav.includes(removedPrimary)) failures.push(`PRIMARY_NAV still exposes repository as a separate primary item: ${removedPrimary}`);
}
for (const oldLabel of ["label: 'Ask PRAXIS'", "label: 'Library'", "label: 'Memo Studio'", "label: 'Canvas'", "label: 'Advanced'"]) {
  if (primaryNav.includes(oldLabel)) failures.push(`PRIMARY_NAV still exposes old app label: ${oldLabel}`);
}
for (const legacyHref of ["href: '/app/dashboard'", "href: '/app/assistant'", "href: '/app/contexts'", "href: '/app/write'", "href: '/app/canvas'", "href: '/app/tools'"]) {
  if (primaryNav.includes(legacyHref)) failures.push(`PRIMARY_NAV still exposes old app page: ${legacyHref}`);
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
for (const marker of ['breadcrumbsForPath', 'onOpenSearch?.()', 'Search workspace', 'AccountProfileButton']) {
  if (!header.includes(marker)) failures.push(`shared header missing workspace control: ${marker}`);
}
if (header.includes('routeLabels')) failures.push('header still uses a hand-maintained route label map');
const globalSearch = read('src/components/shared/global-search.tsx');
for (const marker of ['role="dialog"', 'aria-modal="true"', 'COMMAND_SEARCH_ACTIONS.map', 'buildFederatedSearchResults', 'fetchFederatedSearchData', 'commands: COMMANDS', "result.run === 'ask'", 'askPraxis(query)', 'router.push(result.href)', 'initialQuery']) {
  if (!globalSearch.includes(marker)) failures.push(`shared command palette missing behavior: ${marker}`);
}
for (const [id, href] of [['create-capsule', WORKSPACE_ROUTES.newCapsule], ['attach-source', WORKSPACE_ROUTES.sources], ['fork-demo', WORKSPACE_ROUTES.starters]]) {
  if (COMMAND_SEARCH_ACTIONS.find((action) => action.id === id)?.href !== href) failures.push(`workspace command ${id} must route to its actual task destination`);
}
for (const id of ['find-gaps', 'improve-capsule']) {
  const href = COMMAND_SEARCH_ACTIONS.find((action) => action.id === id)?.href;
  const url = href ? new URL(href, 'https://praxis.tacitus.me') : null;
  if (url?.pathname !== WORKSPACE_ROUTES.chat || !url.searchParams.get('prompt')?.trim()) failures.push(`workspace command ${id} must carry an actionable Ask prompt`);
}
const federatedSearch = read('src/lib/search/federated-app-search.ts');
for (const marker of ['buildFederatedSearchResults', 'fetchFederatedSearchData', '/api/app/search?q=', 'encodeURIComponent(query.trim())']) {
  if (!federatedSearch.includes(marker)) failures.push(`federated workspace search missing owner-scoped API integration: ${marker}`);
}
const appSearchRoute = read('src/app/api/app/search/route.ts');
for (const marker of ['withAuth', 'normalizeAppSearchQuery', 'searchApp({', 'uid: user.uid']) {
  if (!appSearchRoute.includes(marker)) failures.push(`workspace search API missing authenticated owner/query boundary: ${marker}`);
}

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
]) {
  if (!proxy.includes(marker)) failures.push(`proxy missing legacy redirect marker: ${marker}`);
}
for (const marker of [
  "pathname === '/app/dashboard'",
  "pathname === '/app/assistant'",
  "pathname === '/app/contexts'",
  "pathname === '/app/tools'",
  "pathname === '/app/write'",
  "pathname === '/app/canvas'",
]) {
  if (!proxy.includes(marker)) failures.push(`proxy missing one-page app redirect marker: ${marker}`);
}
for (const removedMarker of ["'/app/user-case-case'", "'/app/workbench/user-case'", "pathname.startsWith('/demo')", "'/demo/:path*'"]) {
  if (proxy.includes(removedMarker)) failures.push(`proxy still includes removed demo/case marker: ${removedMarker}`);
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
  'src/app/app/user-case-case',
  'src/lib/cases/user-case',
  'src/lib/cases/v5-demo-contexts.ts',
  'src/lib/user-case',
  'scripts/seed-demos',
  'tests/demo',
  'src/components/app/situation-selector.tsx',
  'src/components/tour',
  'src/lib/tour',
]) {
  expectMissing(rel);
}

const appShell = read('src/components/app/app-shell.tsx');
if (appShell.includes('<DebugPanel')) failures.push('DebugPanel should not render from AppShell');
if (!appShell.includes('data-testid="praxis-one-page-app-shell"')) {
  failures.push('AppShell must provide the consistent chat-first workspace shell');
}
if (!appShell.includes('GlobalSearch') || !appShell.includes('initialQuery')) {
  failures.push('AppShell must own the shared command/search overlay state');
}
for (const marker of ['useAuth', '<Header', 'onOpenSearch={openSearch}', '<AppSidebar', '<MobileBottomNav']) {
  if (!appShell.includes(marker)) failures.push(`authenticated workspace shell missing shared boundary: ${marker}`);
}

if (failures.length) {
  console.error('[audit:mvp-route-shape] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:mvp-route-shape] ok');
