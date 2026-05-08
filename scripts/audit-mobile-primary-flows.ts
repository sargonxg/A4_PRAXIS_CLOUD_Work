import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MOBILE_PRIMARY_EXPERIENCE } from '../src/lib/product/experience-map';
import { PRIMARY_MOBILE_WORKFLOWS } from '../src/lib/agentic-workflows/registry';

const failures: string[] = [];
const mobileNav = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'mobile-bottom-nav.tsx'), 'utf8');
const appShell = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'app-shell.tsx'), 'utf8');
const askHome = readFileSync(join(process.cwd(), 'src', 'components', 'dashboard', 'ask-praxis-home.tsx'), 'utf8');

if (!appShell.includes('<MobileBottomNav />')) failures.push('app shell does not render mobile bottom navigation');
if (!mobileNav.includes('data-testid="mobile-bottom-nav"')) failures.push('mobile bottom nav is missing a stable test marker');
if (!mobileNav.includes("queryKey: 'openChapter'") || !mobileNav.includes("queryValue: 'draft'")) {
  failures.push('mobile Outputs nav must open the Draft chapter with openChapter, not a substrate tab');
}
for (const chapter of ['desk', 'research', 'memos', 'draft', 'ach', 'tools', 'boardroom']) {
  if (mobileNav.includes(`tab: '${chapter}'`) || mobileNav.includes(`tab: "${chapter}"`)) {
    failures.push(`mobile nav encodes chapter "${chapter}" as a tab`);
  }
}
for (const area of MOBILE_PRIMARY_EXPERIENCE) {
  if (!mobileNav.includes(area.shortLabel) && area.id !== 'ask') {
    failures.push(`mobile nav does not expose primary area "${area.label}"`);
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
