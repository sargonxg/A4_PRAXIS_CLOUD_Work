import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    failures.push(`missing ${path}`);
    return '';
  }
}

const home = read('src/components/v7/v7-home-surface.tsx');
const picker = read('src/components/v7/v7-core-picker.tsx');
const homeRoute = read('src/app/app/home/page.tsx');
const migration = read('backend/migrations/versions/0023_seeded_examples.py');
const packageJson = JSON.parse(read('package.json') || '{}') as { scripts?: Record<string, string> };

if (!homeRoute.includes('V7HomeSurface')) failures.push('/app/home does not render V7HomeSurface');

for (const forbidden of ['Syria', 'syria', 'situations[0]', 'demoSituationFallback', 'Open demo Situation']) {
  if (home.includes(forbidden)) failures.push(`v7 home hardcodes or auto-selects forbidden token: ${forbidden}`);
}

for (const token of [
  'No Situation selected',
  'Pick or create a Situation Core to start',
  'Open a seeded Situation',
  'Create new Situation',
  'Pick a Situation to see gaps',
  'No recent Ask threads or outputs yet.',
  'href="/app/cores?examples=1"',
  "activeSituation ?? null",
  "attachedCoreIds: attachedSituationIds.join(',')",
  'Two Situations attached — answers will reference both.',
]) {
  if (!home.includes(token)) failures.push(`v7 home missing generic empty-state token: ${token}`);
}

if (!picker.includes('data-testid="v7-attach-core-link"')) {
  failures.push('v7 shared core picker missing attach-core test id');
}

for (const ontology of ['conflict', 'mediation', 'governance', 'narrative', 'human-rights', 'economic', 'humanitarian', 'legal', 'security']) {
  if (!migration.includes(`"${ontology}"`)) failures.push(`0023 seeded examples missing ontology ${ontology}`);
}

for (const seed of [
  'Syria 2026 transition',
  'US housing access California',
  'Workplace mediation',
  'Sanctions-evasion case',
  'Humanitarian access NES',
  'Governance transition Tunisia',
  'Narrative laundering case',
  'Treaty interpretation case',
  'Mediation issue-framing rubric',
  'Source reliability methodology',
]) {
  if (!migration.includes(seed)) failures.push(`0023 seeded examples missing ${seed}`);
}

for (const token of [
  'revision = "0023_seeded_examples"',
  'down_revision = "0022_ask_threads"',
  'WHERE NOT EXISTS',
  "owner_uid = 'platform'",
  "tags @> ARRAY['example']::text[]",
]) {
  if (!migration.includes(token)) failures.push(`0023 migration missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-home-shape']) failures.push('package.json missing audit:v7-home-shape');
if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-home-shape')) {
  failures.push('audit:gate missing audit:v7-home-shape');
}

if (failures.length > 0) {
  console.error('[audit:v7-home-shape] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-home-shape] ok');
