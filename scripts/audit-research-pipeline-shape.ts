import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const required = [
  'backend/services/google_grounded_search.py',
  'backend/services/wikidata_sparql.py',
  'backend/agents/source_augmenter/state_machine.py',
  'backend/routers/research.py',
  'src/lib/research/pipeline.ts',
  'src/app/api/research/run/route.ts',
  'src/lib/research/methods.ts',
  'skills/tools/research.deep-research-agent/SKILL.md',
  'skills/tools/research.wikidata-sparql/SKILL.md',
  'skills/tools/research.google-grounded-search/SKILL.md',
];

for (const file of required) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

const machine = read('backend/agents/source_augmenter/state_machine.py');
const steps = [
  '# [R1] decompose',
  '# [R2] source_pick',
  '# [R3] fan_out',
  '# [R4] fetch_parse',
  '# [R5] relevance_score',
  '# [R6] cross_verify',
  '# [R7] receipts',
  '# [R8] extract',
  '# [R9] resolve',
  '# [R10] firewall',
  '# [R11] route',
  '# [R12] commit',
  '# [R13] respond',
];
const positions = steps.map((step) => machine.indexOf(step));
steps.forEach((step, index) => {
  if (positions[index] < 0) failures.push(`state machine missing ${step}`);
});
for (let i = 1; i < positions.length; i += 1) {
  if (positions[i - 1] >= 0 && positions[i] >= 0 && positions[i] <= positions[i - 1]) {
    failures.push(`state machine step out of order: ${steps[i]}`);
  }
}

for (const marker of ['Google Grounded Search', 'GroundedResult', 'tier: str = "T5"', 'backend.ai.providers']) {
  if (!read('backend/services/google_grounded_search.py').includes(marker)) failures.push(`grounded search service missing ${marker}`);
}
for (const marker of ['sparql_query', 'actor_disambiguation', 'entity_facts', 'related_entities', 'time.sleep']) {
  if (!read('backend/services/wikidata_sparql.py').includes(marker)) failures.push(`wikidata service missing ${marker}`);
}
for (const marker of ['AsyncIterable<ResearchUpdate>', 'subQuestionGenerated', 'sourceFound', 'finalReport']) {
  if (!read('src/lib/research/pipeline.ts').includes(marker)) failures.push(`TS research pipeline missing ${marker}`);
}
for (const id of ['research.deep-research-agent', 'research.wikidata-sparql', 'research.google-grounded-search']) {
  if (!read('src/lib/research/methods.ts').includes(id)) failures.push(`research method missing ${id}`);
}
const forbidden = ['fire' + 'crawl', 'parallel.ai', 'Parallel AI'];
for (const token of forbidden) {
  if (machine.toLowerCase().includes(token.toLowerCase())) failures.push(`research MVP must not enable ${token}`);
}

const gate = read('package.json');
if (!gate.includes('npm run audit:research-pipeline-shape')) failures.push('audit:gate missing audit:research-pipeline-shape');

if (failures.length > 0) {
  console.error('audit:research-pipeline-shape failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:research-pipeline-shape passed for Google Grounded Search, Wikidata SPARQL, and R1-R13 source augmenter shape. (static-marker)');

function read(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
