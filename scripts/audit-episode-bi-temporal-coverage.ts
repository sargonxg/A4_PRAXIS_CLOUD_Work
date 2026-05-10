import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const required = [
  'backend/migrations/0025_episode_state.py',
  'backend/types/episode.py',
  'backend/services/episode_scoping.py',
  'src/types/episode.ts',
  'src/components/contexts/EpisodeContext.tsx',
  'src/components/contexts/panels/TimelinePanel.tsx',
];

for (const file of required) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

const migration = read('backend/migrations/0025_episode_state.py');
for (const marker of ['episode_state', 'valid_from TIMESTAMPTZ NOT NULL', "strand IN ('situation', 'work')", 'owner_uid', 'case_id, valid_from']) {
  if (!migration.includes(marker)) failures.push(`episode migration missing ${marker}`);
}

const scoping = read('backend/services/episode_scoping.py');
for (const marker of ['valid_from <= %(episode_valid_from)s', 'valid_to IS NULL OR valid_to > %(episode_valid_from)s', 'owner_uid']) {
  if (!scoping.includes(marker)) failures.push(`episode scoping helper missing ${marker}`);
}
if (/NOW\(\)|now\(\)/.test(scoping)) failures.push('episode scoping helpers must not hardcode NOW()');

const tsTypes = read('src/types/episode.ts');
for (const marker of ['ContextEpisode', "EpisodeStrand = 'situation' | 'work'", 'validFrom']) {
  if (!tsTypes.includes(marker)) failures.push(`src/types/episode.ts missing ${marker}`);
}
if (!read('src/app/contexts/[caseId]/page.tsx').includes('TimelinePanel')) {
  failures.push('/contexts/[caseId] must render TimelinePanel');
}

const gate = read('package.json');
if (!gate.includes('npm run audit:episode-bi-temporal-coverage')) failures.push('audit:gate missing audit:episode-bi-temporal-coverage');

if (failures.length > 0) {
  console.error('audit:episode-bi-temporal-coverage failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:episode-bi-temporal-coverage passed for episode state, typed mirrors, scoping helpers, and Timeline panel. (static-marker)');

function read(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
