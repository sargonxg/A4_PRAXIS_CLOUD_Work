import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const FORBIDDEN = ['Cognee', 'GraphRAG', 'substrate'];
const PUBLIC_FORBIDDEN = [
  ...FORBIDDEN,
  'ACO',
  'Cypher',
  'Gemini',
  'Vertex AI',
  'Deep Research Agent',
  'Conflict Graph Agent',
  'Briefing Agent',
  'Sanctions Agent',
];
const PRIMARY_ENTRY_FILES = [
  join(ROOT, 'src', 'components', 'dashboard', 'ask-praxis-home.tsx'),
  join(ROOT, 'src', 'components', 'dashboard', 'dashboard-command-center.tsx'),
  join(ROOT, 'src', 'components', 'app', 'app-shell.tsx'),
  join(ROOT, 'src', 'components', 'app', 'header.tsx'),
  join(ROOT, 'src', 'components', 'app', 'mobile-bottom-nav.tsx'),
];
const LANDING_ENTRY_FILES = [
  join(ROOT, 'src', 'app', '(landing)', 'page.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'agentic-app-section.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'hero.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'hero-visual.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'hero-quadrant-tour.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'six-steps.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'live-demo.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'live-demo-screens', 'cypher-query-screen.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'dialectica.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'dialectica-firewall-demo.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'dialectica-graph-3d.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'trust.tsx'),
  join(ROOT, 'src', 'components', 'landing', 'footer.tsx'),
];
const failures: string[] = [];

function stringLiterals(content: string): string[] {
  return Array.from(content.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g)).map((match) => match[2] ?? '');
}

for (const file of PRIMARY_ENTRY_FILES) {
  const content = readFileSync(file, 'utf8');
  for (const marker of FORBIDDEN) {
    if (stringLiterals(content).some((literal) => literal.includes(marker))) {
      failures.push(`${relative(ROOT, file)} contains visible internal jargon marker "${marker}"`);
    }
  }
}

for (const file of LANDING_ENTRY_FILES) {
  const content = readFileSync(file, 'utf8');
  for (const marker of PUBLIC_FORBIDDEN) {
    if (stringLiterals(content).some((literal) => literal.includes(marker))) {
      failures.push(`${relative(ROOT, file)} contains public-facing internal jargon marker "${marker}"`);
    }
  }
}

if (failures.length > 0) {
  console.error('[audit:no-internal-jargon-ui] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:no-internal-jargon-ui] ok');
