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
const appLaunchpad = read('src/components/app/praxis-app-launchpad.tsx');
const workbench = read('src/components/praxis/tasklet-praxis-workbench.tsx');
const boardroom = read('src/components/boardroom/boardroom-workspace.tsx');
const appShell = read('src/components/app/app-shell.tsx');
const sitemap = read('src/app/sitemap.ts');
const dockerfile = read('Dockerfile');

requireAll('public route', publicPage, [
  'PraxisMarketingHome',
  'SoftwareApplication',
  'Turn any policy question into a sourced, citable brief.',
]);
forbidAll('public route', publicPage, [
  'TaskletPraxisWorkbench',
  'AskPraxisHome',
  'PraxisAppLaunchpad',
  '/api/created-work',
  '/api/context',
  '/api/health',
]);

requireAll('marketing home', marketingHome, [
  'data-testid="marketing-home"',
  'Turn any policy question into a sourced, citable brief.',
  'data-testid="marketing-hero-prompt"',
  'data-testid="marketing-primary-cta"',
  'Context Capsules',
  'Agentic research',
  'Capsule marketplace',
  'data-testid="marketing-marketplace-teaser"',
  'data-testid="marketing-pricing-strip"',
  'Every claim cited',
  'Start free',
]);
forbidAll('marketing home', marketingHome, [
  'Diagnostics',
  'Systems ready',
  'Search app',
  'context-health',
  'red flags',
  'catalogued',
  'TaskletPraxisWorkbench',
  'AskPraxisHome',
]);

const primaryCtaCount = marketingHome.split('data-testid="marketing-primary-cta"').length - 1;
if (primaryCtaCount !== 1) {
  failures.push(`marketing home should expose exactly one primary CTA test id, found ${primaryCtaCount}`);
}

requireAll('signed-in app index', appIndex, ['PraxisAppLaunchpad']);
forbidAll('signed-in app index', appIndex, ['AskPraxisHome', 'TaskletPraxisWorkbench']);
requireAll('signed-in launchpad', appLaunchpad, [
  'data-testid="app-launchpad"',
  'What do you want to analyze?',
  'data-testid="launchpad-capsule-chip"',
  '/api/created-work?limit=4',
  'items.slice(0, 4)',
  'Your capsules',
  'Browse marketplace',
  'Recent work',
  'data-testid="advanced-edit-context"',
  'Advanced / Edit context',
]);
forbidAll('signed-in launchpad', appLaunchpad, [
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

for (const required of ['/learn', '/pricing', '/release-notes', '/login']) {
  if (!sitemap.includes(required)) failures.push(`sitemap missing public route: ${required}`);
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
