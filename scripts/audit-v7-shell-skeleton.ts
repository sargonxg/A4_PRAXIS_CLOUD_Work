import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const featuresRoute = readFileSync(join(root, 'src/app/api/health/features/route.ts'), 'utf8');
const featureClient = readFileSync(join(root, 'src/lib/features/client.ts'), 'utf8');
const dashboard = readFileSync(join(root, 'src/components/dashboard/dashboard-command-center.tsx'), 'utf8');
const shell = readFileSync(join(root, 'src/components/v7/v7-command-shell.tsx'), 'utf8');
const destination = readFileSync(join(root, 'src/components/v7/v7-destination-page.tsx'), 'utf8');
const mobileNav = readFileSync(join(root, 'src/components/app/mobile-bottom-nav.tsx'), 'utf8');
const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

for (const token of ['praxisV7', 'PRAXIS_V7_BACKEND', 'NEXT_PUBLIC_PRAXIS_V7', 'Cache-Control']) {
  if (!featuresRoute.includes(token)) failures.push(`/api/health/features missing ${token}`);
}

for (const token of ['praxisV7', "enabled: false", 'v7 shell disabled by default']) {
  if (!featureClient.includes(token)) failures.push(`feature client missing ${token}`);
}

for (const token of ['useFeatureFlags', 'features.praxisV7.enabled', 'V7CommandShell']) {
  if (!dashboard.includes(token)) failures.push(`dashboard command center missing ${token}`);
}

for (const token of [
  'data-testid="v7-command-shell"',
  'PRODUCT_EXPERIENCE_AREAS',
  'AGENTIC_WORKFLOWS',
  'open-praxis-chat',
  'workflowHref',
]) {
  if (!shell.includes(token)) failures.push(`v7 command shell missing ${token}`);
}

try {
  const coresPage = readFileSync(join(root, 'src/app/app/cores/page.tsx'), 'utf8');
  if (!coresPage.includes('V7CoresSurface')) failures.push('/app/cores does not render V7CoresSurface');
} catch {
  failures.push('missing v7 cores route/component');
}

try {
  const outputsPage = readFileSync(join(root, 'src/app/app/outputs/page.tsx'), 'utf8');
  if (!outputsPage.includes('V7OutputsSurface')) failures.push('/app/outputs does not render V7OutputsSurface');
} catch {
  failures.push('missing v7 outputs route/component');
}

try {
  const askPage = readFileSync(join(root, 'src/app/app/ask/page.tsx'), 'utf8');
  const askThreadPage = readFileSync(join(root, 'src/app/app/ask/[threadId]/page.tsx'), 'utf8');
  const askSurface = readFileSync(join(root, 'src/components/v7/v7-ask-surface.tsx'), 'utf8');
  if (!askPage.includes('V7AskSurface')) failures.push('/app/ask does not render V7AskSurface');
  if (!askThreadPage.includes('initialThreadId')) failures.push('/app/ask/[threadId] does not pass initialThreadId to V7AskSurface');
  for (const token of ['data-testid="v7-ask-surface"', 'data-testid="v7-staged-skill-card"', 'V7AskSkillRouterPanel', 'V7AskRuntimePanel', 'ChatInterface', 'ASK_MODES', 'Attached cores', 'Staged Analyst Skill']) {
    if (!askSurface.includes(token)) failures.push(`v7 ask surface missing ${token}`);
  }
} catch {
  failures.push('missing v7 ask surface route/component');
}

try {
  const homePage = readFileSync(join(root, 'src/app/app/home/page.tsx'), 'utf8');
  const homeSurface = readFileSync(join(root, 'src/components/v7/v7-home-surface.tsx'), 'utf8');
  if (!homePage.includes('V7HomeSurface')) failures.push('/app/home does not render V7HomeSurface');
  for (const token of ['data-testid="v7-home-surface"', 'Ask PRAXIS', 'Cores Library', 'Next actions', '/app/ask/${threadId}', 'open-praxis-chat', 'Open PRAXIS command palette']) {
    if (!homeSurface.includes(token)) failures.push(`v7 home surface missing ${token}`);
  }
} catch {
  failures.push('missing v7 home surface route/component');
}

for (const token of ['data-testid={`v7-destination-${areaId}`}', 'PRODUCT_EXPERIENCE_AREAS', 'AGENTIC_WORKFLOWS', 'Open current surface']) {
  if (!destination.includes(token)) failures.push(`v7 destination page missing ${token}`);
}

for (const token of ['V7_DESTINATION_ROUTES', 'praxisV7Enabled', 'PRAXIS_V7_BACKEND', 'NEXT_PUBLIC_PRAXIS_V7']) {
  if (!proxy.includes(token)) failures.push(`proxy missing v7 route guard token ${token}`);
}

for (const token of [
  'features.praxisV7.enabled',
  'data-v7="true"',
  "href: '/app/home'",
  "href: '/app/ask'",
  "href: '/app/cores'",
  "href: '/app/outputs'",
]) {
  if (!mobileNav.includes(token)) failures.push(`mobile bottom nav missing v7 token ${token}`);
}

if (!packageJson.scripts?.['audit:v7-shell-skeleton']) {
  failures.push('package.json missing audit:v7-shell-skeleton');
}

if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-shell-skeleton')) {
  failures.push('audit:gate missing audit:v7-shell-skeleton');
}

if (failures.length > 0) {
  console.error('[audit:v7-shell-skeleton] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-shell-skeleton] ok');
