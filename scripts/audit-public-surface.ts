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

function requireAll(label: string, source: string, markers: string[]): void {
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${label} missing marker: ${marker}`);
  }
}

function forbidAll(label: string, source: string, markers: string[]): void {
  for (const marker of markers) {
    if (source.includes(marker)) failures.push(`${label} still exposes marker: ${marker}`);
  }
}

const publicPage = read('src/app/page.tsx');
const marketingHome = read('src/components/marketing/praxis-marketing-home.tsx');
const appIndex = read('src/app/app/page.tsx');
const chatShell = read('src/components/app/praxis-chat-first-shell.tsx');
const praxisChat = read('src/components/app/praxis-chat.tsx');
const publicHomeSurface = `${marketingHome}\n${chatShell}\n${praxisChat}`;
const sharedHomeSurface = `${marketingHome}\n${appIndex}\n${chatShell}\n${praxisChat}`;
const policyMissions = read('src/lib/product/policy-missions.ts');
const workbench = read('src/components/praxis/tasklet-praxis-workbench.tsx');
const boardroom = read('src/components/boardroom/boardroom-workspace.tsx');
const appShell = read('src/components/app/app-shell.tsx');
const sitemap = read('src/app/sitemap.ts');
const dockerfile = read('Dockerfile');

requireAll('public route', publicPage, [
  'PraxisMarketingHome',
  'SoftwareApplication',
  'Turn a hard policy question into sourced work your team can review.',
]);
forbidAll('public route', publicPage, [
  'TaskletPraxisWorkbench',
  'AskPraxisHome',
  'PraxisAppLaunchpad',
  '/api/created-work',
  '/api/context',
  '/api/health',
]);

requireAll('marketing home wrapper', marketingHome, [
  'PraxisChatFirstShell',
  'mode="public"',
]);
requireAll('marketing home', publicHomeSurface, [
  'marketing-home',
  'data-testid="praxis-chat-first-shell"',
  'data-testid="simple-home-chat"',
  'Write trusted knowledge products.',
  'Capsules keep the context clear.',
  'POLICY_MISSION_EXAMPLES',
  'data-testid="marketing-hero-prompt"',
  'data-testid="marketing-primary-cta"',
  'Continue',
  'Ask',
  'Context Capsules library',
  'Guide',
  'Pricing',
  'isPublic ? <PublicShell>{body}</PublicShell> : body',
]);
forbidAll('marketing home', publicHomeSurface, [
  'SAMPLE_POLICY_ARTIFACTS',
  'PublicMarketingSections',
  'PRAXIS sample artifacts',
  'data-testid="marketing-marketplace-teaser"',
  'data-testid="marketing-pricing-strip"',
  'Diagnostics',
  'Systems ready',
  'Search app',
  'context-health',
  'red flags',
  'catalogued',
  'TaskletPraxisWorkbench',
  'AskPraxisHome',
  'PolicyAgentStrip',
  'PublicFlagshipCapsuleStrip',
]);

const primaryCtaCount = publicHomeSurface.split('data-testid="marketing-primary-cta"').length - 1;
if (primaryCtaCount !== 1) {
  failures.push(`marketing home should expose exactly one primary CTA test id, found ${primaryCtaCount}`);
}

requireAll('signed-in app index', appIndex, [
  'PraxisChatFirstShell',
  'mode="authenticated"',
]);
forbidAll('signed-in app index', appIndex, ['AskPraxisHome']);
// Saved output links reuse the existing workbench. Ordinary Home must retain
// the simple chat shell; app-page behavior tests cover missing/invalid IDs.
if (appIndex.includes('TaskletPraxisWorkbench')) {
  requireAll('saved memo dispatch', appIndex, [
    'const memoId = singleResourceId(query.memoId);',
  ]);
  if (!/if\s*\(memoId\)\s*\{\s*return\s+<TaskletPraxisWorkbench\b[^>]*\binitialMemoId=\{memoId\}[^>]*\/>;\s*\}/.test(appIndex)) {
    failures.push('workbench dispatch must return only inside the validated memoId branch');
  }
  const homeReturnIndex = appIndex.indexOf('return (');
  if (homeReturnIndex < 0) failures.push('signed-in app index missing ordinary Home return');
  else forbidAll('ordinary signed-in Home', appIndex.slice(homeReturnIndex), ['TaskletPraxisWorkbench']);
  if ((appIndex.match(/<TaskletPraxisWorkbench\b/g) ?? []).length !== 1) {
    failures.push('saved memo dispatch must be the only workbench render in the app index');
  }
}
requireAll('signed-in launchpad', sharedHomeSurface, [
  'app-launchpad',
  'Write trusted knowledge products.',
  'POLICY_MISSION_EXAMPLES',
  'Ask PRAXIS',
  'fetch(\'/api/ai/chat\'',
  'sourceCards',
  'data-testid="simple-home-chat"',
  'data-testid="context-toggle"',
  'data-testid="launchpad-capsule-chip"',
  'data-testid="launchpad-capsule-stack"',
  'Attach context',
  'Build context',
  'data-testid="advanced-edit-context"',
]);
requireAll('policy missions', policyMissions, [
  'Sanctions impact memo',
  'Treaty brief with citations',
  'Stakeholder map & ACH',
]);
forbidAll('signed-in launchpad', sharedHomeSurface, [
  'Diagnostics',
  'Systems ready',
  'Search app',
  'red flags',
  'catalogued',
]);

requireAll('shared cockpit', workbench, [
  'TaskletPraxisWorkbench',
  'data-testid="praxis-main-composer"',
  'data-testid="capsule-context-bar"',
  'data-testid="praxis-chat-thread"',
  'Compose your reasoning and policy products from expert ContextCapsules.',
  'const showOperatorChrome = process.env.NEXT_PUBLIC_PRAXIS_DEBUG === \'true\';',
]);
requireAll('boardroom workspace', boardroom, [
  'BoardroomWorkspace',
  'const showOperatorChrome = process.env.NEXT_PUBLIC_PRAXIS_DEBUG === \'true\';',
]);

requireAll('app shell', appShell, [
  'data-testid="praxis-one-page-app-shell"',
  "pathname === '/app'",
]);

for (const required of ['/learn', '/guide', '/pricing', '/release-notes']) {
  if (!sitemap.includes(required)) failures.push(`sitemap missing public route: ${required}`);
}
for (const excluded of ['/changelog', '/login']) {
  if (sitemap.includes(excluded)) failures.push(`sitemap includes redirect or non-indexable route: ${excluded}`);
}

for (const stalePublicFile of ['public/sitemap.xml', 'public/robots.txt']) {
  if (existsSync(join(root, stalePublicFile))) {
    failures.push(`stale public SEO file shadows App Router route: ${stalePublicFile}`);
  }
}

if (!dockerfile.includes('rm -f public/sitemap.xml public/robots.txt')) {
  failures.push('Dockerfile must remove stale public sitemap/robots files before serving the standalone image');
}

if (failures.length) {
  console.error('audit:public-surface failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:public-surface OK');
