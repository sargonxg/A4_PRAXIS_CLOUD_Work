import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRIMARY_MOBILE_WORKFLOWS } from '../src/lib/agentic-workflows/registry';
import { PRIMARY_NAV } from '../src/lib/navigation/primary-nav';

const failures: string[] = [];
const mobileNav = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'mobile-bottom-nav.tsx'), 'utf8');
const sidebar = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'app-sidebar.tsx'), 'utf8');
const header = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'header.tsx'), 'utf8');
const appShell = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'app-shell.tsx'), 'utf8');
const askHome = readFileSync(join(process.cwd(), 'src', 'components', 'dashboard', 'ask-praxis-home.tsx'), 'utf8');

if (!appShell.includes('<MobileBottomNav />')) failures.push('app shell does not render mobile bottom navigation');
if (!mobileNav.includes('data-testid="mobile-bottom-nav"')) failures.push('mobile bottom nav is missing a stable test marker');

for (const relText of [mobileNav, sidebar]) {
  if (!relText.includes('PRIMARY_NAV')) failures.push('desktop and mobile navigation must consume PRIMARY_NAV');
}

for (const item of PRIMARY_NAV) {
  if (!item.label.trim()) failures.push(`PRIMARY_NAV item ${item.id} is missing a label`);
}
if (!mobileNav.includes('item.label')) failures.push('mobile nav must render PRIMARY_NAV labels');
if (!mobileNav.includes('item.href')) failures.push('mobile non-Ask items must route through canonical PRIMARY_NAV hrefs');

if (!PRIMARY_NAV.some((item) => item.id === 'write' && item.href === '/app/write')) {
  failures.push('PRIMARY_NAV Write must open /app/write');
}
if (!header.includes('Ask PRAXIS or search')) failures.push('header must expose the unified Ask/search command input');

for (const chapter of ['desk', 'research', 'memos', 'draft', 'ach', 'tools', 'boardroom']) {
  if (mobileNav.includes(`tab: '${chapter}'`) || mobileNav.includes(`tab: "${chapter}"`)) {
    failures.push(`mobile nav encodes chapter "${chapter}" as a tab`);
  }
}
if (!askHome.includes('PRIMARY_MOBILE_WORKFLOWS')) {
  failures.push('AskPraxisHome does not render the primary mobile workflow registry');
}
for (const workflow of PRIMARY_MOBILE_WORKFLOWS) {
  if (!workflow.prompt.trim()) failures.push(`${workflow.id} is missing a mobile launch prompt`);
  if (!workflow.saveLocation.trim()) failures.push(`${workflow.id} is missing a save location`);
}

if (failures.length > 0) {
  console.error('[audit:mobile-primary-flows] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:mobile-primary-flows] ok');
